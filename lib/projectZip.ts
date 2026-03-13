import JSZip from 'jszip';
import type { ErrorObject } from 'ajv';
import { Project, Device, OaisAuxFile } from './types';
import {
  generateDevicesJSON,
  generatePerformanceJSON,
  migrateProject,
  performanceJsonToProject,
} from './validation';
import {
  validatePerformance,
  validateDevices,
} from './validation/checks';

export type ProjectZipErrorKind = 'zip_format' | 'json_parse' | 'schema' | 'internal';

export type ProjectZipErrorDetail = {
  path: string;
  message: string;
};

export type ProjectZipError = {
  kind: ProjectZipErrorKind;
  title?: string;
  message: string;
  details?: ProjectZipErrorDetail[];
};

function isErrorObjectArray(errors: unknown): errors is ErrorObject[] {
  return Array.isArray(errors);
}

function pointerForAjv(err: ErrorObject): string {
  return err.instancePath && err.instancePath.length > 0 ? err.instancePath : '/';
}

function buildSchemaError(
  target: 'performance' | 'devices',
  errors: ErrorObject[] | null | undefined,
): ProjectZipError {
  const details: ProjectZipErrorDetail[] = [];
  if (isErrorObjectArray(errors)) {
    for (const err of errors) {
      const path = pointerForAjv(err);
      details.push({
        path,
        message: err.message ?? 'is invalid',
      });
    }
  }

  const targetLabel =
    target === 'performance' ? 'authoring/performance.json' : 'authoring/devices.json';

  return {
    kind: 'schema',
    title: `Invalid ${targetLabel}`,
    message: `${targetLabel} failed schema validation`,
    details: details.length > 0 ? details : undefined,
  };
}

export async function exportProjectToOaisZip(project: Project): Promise<JSZip> {
  const migrated = migrateProject(project);
  const perf = generatePerformanceJSON(migrated);
  const devices = generateDevicesJSON(migrated);

  const zip = new JSZip();
  const root = zip.folder('project_performance');
  if (!root) {
    throw new Error('Failed to create project_performance folder in ZIP');
  }

  const authoring = root.folder('authoring');
  if (!authoring) {
    throw new Error('Failed to create authoring folder in ZIP');
  }

  authoring.file(
    'performance.json',
    `${JSON.stringify(perf, null, 2)}\n`,
  );
  authoring.file(
    'devices.json',
    `${JSON.stringify(devices ?? { devices: [] }, null, 2)}\n`,
  );

  const docs = root.folder('docs');
  if (!docs) {
    throw new Error('Failed to create docs folder in ZIP');
  }

  const now = new Date().toISOString();
  const duration =
    typeof migrated.meta.durationSec === 'number' ? migrated.meta.durationSec : undefined;

  const readmeLines = [
    '# Project Performance Package',
    '',
    `- Name: ${migrated.name}`,
    `- Title: ${migrated.meta.title || migrated.name}`,
    `- Schema version: ${migrated.schemaVersion}`,
    duration !== undefined ? `- Duration (s): ${duration}` : undefined,
    `- Exported at: ${now}`,
    '',
    'This archive follows an OAIS-inspired structure:',
    '',
    '- authoring/performance.json',
    '- authoring/devices.json',
    '- media/',
    '- mocap/',
    '- docs/',
    '- metadata/',
  ].filter((line): line is string => typeof line === 'string');

  docs.file('README.md', `${readmeLines.join('\n')}\n`);

  const auxFiles = migrated.meta.oaisAuxFiles ?? {};
  for (const [relativePath, aux] of Object.entries(auxFiles)) {
    // Skip generated README; we always regenerate it.
    if (relativePath === 'docs/README.md') continue;

    const fullPath = `project_performance/${relativePath}`;
    const file = zip.file(fullPath) ?? zip.file(fullPath, '');

    if (!file) {
      continue;
    }

    const data =
      aux.binary || !aux.data
        ? Buffer.from(aux.data ?? '', 'base64')
        : aux.data;

    zip.file(fullPath, data as any);
  }

  return zip;
}

type ParsedZipInput = ArrayBuffer | Uint8Array | Blob;

async function loadZip(data: ParsedZipInput): Promise<JSZip> {
  if (data instanceof Blob) {
    const buffer = await data.arrayBuffer();
    return JSZip.loadAsync(buffer);
  }
  return JSZip.loadAsync(data);
}

function findBaseFolder(zip: JSZip): string {
  const entries = Object.keys(zip.files);
  const withProjectRoot = entries.some((p) =>
    p === 'project_performance/authoring/performance.json' ||
    p.startsWith('project_performance/authoring/performance.json'),
  );
  if (withProjectRoot) {
    return 'project_performance/';
  }

  const withRootAuthoring = entries.some(
    (p) => p === 'authoring/performance.json' || p.startsWith('authoring/performance.json'),
  );
  if (withRootAuthoring) {
    return '';
  }

  throw <ProjectZipError>{
    kind: 'zip_format',
    title: 'Invalid project ZIP',
    message:
      'Could not find authoring/performance.json at ZIP root or under project_performance/.',
  };
}

async function readJsonFile<T>(
  zip: JSZip,
  path: string,
  required: boolean,
  target: 'performance' | 'devices',
): Promise<T | null> {
  const entry = zip.file(path);
  if (!entry) {
    if (required) {
      throw <ProjectZipError>{
        kind: 'zip_format',
        title: 'Missing required file',
        message: `Required file "${path}" is missing from the ZIP.`,
      };
    }
    return null;
  }

  let text: string;
  try {
    text = await entry.async('string');
  } catch (err) {
    throw <ProjectZipError>{
      kind: 'internal',
      title: 'Could not read file',
      message: `Failed to read "${path}" from ZIP.`,
      details: [{ path, message: String(err) }],
    };
  }

  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch (err) {
    throw <ProjectZipError>{
      kind: 'json_parse',
      title: 'Invalid JSON',
      message: `"${path}" contains invalid JSON.`,
      details: [{ path, message: String(err) }],
    };
  }

  if (target === 'performance') {
    const ok = validatePerformance(json);
    if (!ok) {
      throw buildSchemaError('performance', validatePerformance.errors as ErrorObject[] | null);
    }
  } else if (target === 'devices') {
    const ok = validateDevices(json);
    if (!ok) {
      throw buildSchemaError('devices', validateDevices.errors as ErrorObject[] | null);
    }
  }

  return json;
}

function normalizeDevicesJson(raw: any): { devices: any[] } {
  if (!raw) return { devices: [] };
  if (Array.isArray(raw)) return { devices: raw };
  if (Array.isArray(raw.devices)) return { devices: raw.devices };
  return { devices: [] };
}

function mapDevicesToProject(devJson: { devices: any[] } | null): Device[] {
  if (!devJson) return [];
  return devJson.devices.map((d: any) => ({
    id: typeof d.id === 'string' && d.id.trim() ? d.id : crypto.randomUUID(),
    category:
      d.category === 'lighting_fixture' ||
      d.category === 'projection_system' ||
      d.category === 'audio_system'
        ? d.category
        : 'lighting_fixture',
    manufacturer: typeof d.manufacturer === 'string' ? d.manufacturer : '',
    model: typeof d.model === 'string' ? d.model : '',
    instance: typeof d.instance === 'object' && d.instance !== null ? d.instance : {},
    control: typeof d.control === 'object' && d.control !== null ? d.control : {},
    photometrics:
      typeof d.photometrics === 'object' && d.photometrics !== null ? d.photometrics : {},
    video: typeof d.video === 'object' && d.video !== null ? d.video : {},
    channels: typeof d.channels === 'object' && d.channels !== null ? d.channels : {},
  }));
}

async function collectAuxFiles(zip: JSZip, base: string): Promise<{ [path: string]: OaisAuxFile }> {
  const result: { [path: string]: OaisAuxFile } = {};
  const prefix = base ? base : '';

  const paths = Object.keys(zip.files);
  for (const fullPath of paths) {
    const entry = zip.files[fullPath];
    if (!entry || entry.dir) continue;

    if (!fullPath.startsWith(prefix)) continue;
    const relative = fullPath.slice(prefix.length);

    if (
      relative === 'authoring/performance.json' ||
      relative === 'authoring/devices.json'
    ) {
      continue;
    }

    if (
      !(
        relative.startsWith('media/') ||
        relative.startsWith('mocap/') ||
        relative.startsWith('docs/') ||
        relative.startsWith('metadata/')
      )
    ) {
      continue;
    }

    // Skip generated README; we always regenerate it.
    if (relative === 'docs/README.md') {
      continue;
    }

    const data = await entry.async('uint8array');
    const b64 = Buffer.from(data).toString('base64');

    result[relative] = {
      path: relative,
      data: b64,
      binary: true,
    };
  }

  return result;
}

export async function parseProjectOaisZip(
  data: ParsedZipInput,
): Promise<{ project: Project; warnings: string[] }> {
  let zip: JSZip;
  try {
    zip = await loadZip(data);
  } catch (err) {
    throw <ProjectZipError>{
      kind: 'zip_format',
      title: 'Invalid ZIP file',
      message: 'The selected file is not a valid ZIP archive.',
      details: [{ path: '/', message: String(err) }],
    };
  }

  const base = findBaseFolder(zip);
  const perfPath = `${base}authoring/performance.json`;
  const devicesPath = `${base}authoring/devices.json`;

  const performanceJson: any = await readJsonFile(zip, perfPath, true, 'performance');
  const rawDevicesJson: any = await readJsonFile(zip, devicesPath, false, 'devices').catch(
    (err) => {
      if ((err as ProjectZipError).kind === 'schema') {
        throw err;
      }
      return null;
    },
  );

  const normalizedDevices = normalizeDevicesJson(rawDevicesJson);
  let project = performanceJsonToProject(performanceJson);

  const devices = mapDevicesToProject(normalizedDevices);
  if (devices.length > 0) {
    project = {
      ...project,
      devices: { devices },
    };
  }

  project = migrateProject(project);

  const auxFiles = await collectAuxFiles(zip, base);
  if (Object.keys(auxFiles).length > 0) {
    project = {
      ...project,
      meta: {
        ...project.meta,
        oaisAuxFiles: {
          ...(project.meta.oaisAuxFiles ?? {}),
          ...auxFiles,
        },
      },
    };
  }

  const warnings: string[] = [];
  if (!rawDevicesJson) {
    warnings.push('No authoring/devices.json found; created an empty devices set.');
    if (!project.devices) {
      project = {
        ...project,
        devices: { devices: [] },
      };
    }
  }

  return { project, warnings };
}

export function isProjectZipError(err: unknown): err is ProjectZipError {
  return !!err && typeof err === 'object' && 'kind' in (err as any) && 'message' in (err as any);
}

