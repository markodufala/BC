import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { Project, ValidationItem } from '../types';
import { generateDevicesJSON, generatePerformanceJSON } from './index';

let itemId = 0;

function createItem(
  severity: 'error' | 'warning' | 'info',
  code: string,
  category: string,
  message: string,
  opts?: { hint?: string; path?: string; entityType?: string; entityId?: string },
): ValidationItem {
  return {
    id: `item-${itemId++}`,
    severity,
    code,
    category,
    message,
    ...opts,
  };
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const performanceSchema = {
  type: 'object',
  required: ['meta', 'space', 'synchronization', 'cues', 'assets'],
  additionalProperties: false,
  properties: {
    meta: {
      type: 'object',
      required: ['title', 'author', 'duration', 'fps'],
      additionalProperties: true,
      properties: {
        title: { type: 'string' },
        author: { type: 'string' },
        duration: { type: 'number', minimum: 0 },
        fps: { type: 'number', minimum: 1 },
      },
    },
    space: {
      type: 'object',
      required: ['units', 'axes'],
      additionalProperties: false,
      properties: {
        units: {
          type: 'object',
          required: ['length', 'time', 'rotation', 'light_intensity'],
          additionalProperties: false,
          properties: {
            length: { type: 'string' },
            time: { type: 'string' },
            rotation: { type: 'string' },
            light_intensity: { type: 'string' },
          },
        },
        axes: {
          type: 'object',
          required: ['system', 'right', 'forward', 'up'],
          additionalProperties: false,
          properties: {
            system: { type: 'string' },
            right: { type: 'string' },
            forward: { type: 'string' },
            up: { type: 'string' },
          },
        },
      },
    },
    synchronization: {
      type: 'object',
      required: ['global_time_unit', 'point_sync_source', 'adaptive'],
      additionalProperties: false,
      properties: {
        global_time_unit: { const: 'seconds' },
        point_sync_source: { const: 'cues[]' },
        adaptive: {
          type: 'object',
          required: ['enabled', 'lateness_policy'],
          additionalProperties: false,
          properties: {
            enabled: { type: 'boolean' },
            lateness_policy: { const: 'hold_last_value' },
          },
        },
      },
    },
    cues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'start', 'end'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          start: { type: 'number', minimum: 0 },
          end: { type: 'number', minimum: 0 },
        },
      },
    },
    assets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'details', 'transform'],
        additionalProperties: true,
        properties: {
          name: { type: 'string', minLength: 1 },
          details: {
            type: 'object',
            required: ['type'],
            additionalProperties: true,
            properties: {
              type: {
                enum: ['Geometry', 'Rigging', 'Performer', 'Light', 'Projection'],
              },
            },
          },
          color: { type: 'string' },
          transform: {
            type: 'object',
            required: ['location', 'rotation_euler_deg', 'scale'],
            additionalProperties: false,
            properties: {
              location: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: { type: 'number' },
              },
              rotation_euler_deg: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: { type: 'number' },
              },
              scale: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const devicesSchema = {
  type: 'object',
  required: ['devices'],
  additionalProperties: false,
  properties: {
    devices: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'category', 'manufacturer', 'model'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', minLength: 1 },
          category: {
            enum: ['lighting_fixture', 'projection_system', 'audio_system'],
          },
          manufacturer: { type: 'string', minLength: 1 },
          model: { type: 'string', minLength: 1 },
          instance: { type: 'object' },
          control: { type: 'object' },
          video: { type: 'object' },
          channels: { type: 'object' },
        },
        allOf: [
          {
            oneOf: [
              {
                properties: {
                  category: { const: 'lighting_fixture' },
                  instance: { type: 'object' },
                  control: {
                    type: 'object',
                    required: ['protocol', 'universe', 'address', 'dmx_channels'],
                    additionalProperties: false,
                    properties: {
                      protocol: { const: 'DMX512' },
                      universe: { type: 'integer', minimum: 1 },
                      address: { type: 'integer', minimum: 1, maximum: 512 },
                      dmx_channels: { type: 'integer', minimum: 1 },
                      channel_map: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['ch', 'name', 'type'],
                          additionalProperties: false,
                          properties: {
                            ch: { type: 'integer', minimum: 1 },
                            name: { type: 'string' },
                            type: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
                required: ['instance', 'control'],
              },
              {
                properties: {
                  category: { const: 'projection_system' },
                  instance: { type: 'object' },
                  video: {
                    type: 'object',
                    required: ['resolution', 'frame_rate'],
                    additionalProperties: false,
                    properties: {
                      resolution: { type: 'string' },
                      frame_rate: { type: 'number', minimum: 1 },
                    },
                  },
                },
                required: ['instance', 'video'],
              },
              {
                properties: {
                  category: { const: 'audio_system' },
                  channels: { type: 'object' },
                  instance: {
                    type: 'object',
                    properties: {
                      sample_rate_hz: { type: 'number', minimum: 1 },
                    },
                    required: ['sample_rate_hz'],
                    additionalProperties: false,
                  },
                },
                required: ['channels', 'instance'],
              },
            ],
          },
        ],
      },
    },
  },
} as const;

export const validatePerformance = ajv.compile(performanceSchema);
export const validateDevices = ajv.compile(devicesSchema);

function pointerForAjv(err: ErrorObject): string {
  return err.instancePath && err.instancePath.length > 0 ? err.instancePath : '/';
}

function entityFromPointer(project: Project, pointer: string) {
  // Map JSON pointer to an entity for navigation.
  const m = pointer.match(/^\/(assets|cues|devices)\/(\d+)/);
  if (!m) return {};

  const list = m[1];
  const index = parseInt(m[2], 10);
  if (Number.isNaN(index)) return {};

  if (list === 'assets') {
    const asset = project.assets[index];
    if (asset) return { entityType: 'Asset', entityId: asset.id };
  }
  if (list === 'cues') {
    const cue = project.timeline.segments[index];
    if (cue) return { entityType: 'Segment', entityId: cue.id };
  }
  if (list === 'devices') {
    const device = project.devices?.devices?.[index];
    if (device) return { entityType: 'Device', entityId: device.id };
  }

  return {};
}

export function checkSchema(project: Project): ValidationItem[] {
  const items: ValidationItem[] = [];

  const perf = generatePerformanceJSON(project);
  const okPerf = validatePerformance(perf);
  if (!okPerf && Array.isArray(validatePerformance.errors)) {
    for (const err of validatePerformance.errors) {
      const pointer = pointerForAjv(err);
      const entity = entityFromPointer(project, pointer);
      items.push(
        createItem(
          'error',
          'SCHEMA_PERFORMANCE_INVALID',
          'Schema',
          `${pointer} ${err.message ?? 'is invalid'}`,
          { path: pointer, ...entity },
        ),
      );
    }
  }

  const dev = generateDevicesJSON(project);
  const okDev = validateDevices(dev);
  if (!okDev && Array.isArray(validateDevices.errors)) {
    for (const err of validateDevices.errors) {
      const pointer = pointerForAjv(err);
      const entity = entityFromPointer(project, pointer);
      items.push(
        createItem(
          'error',
          'SCHEMA_DEVICES_INVALID',
          'Schema',
          `${pointer} ${err.message ?? 'is invalid'}`,
          { path: pointer, ...entity },
        ),
      );
    }
  }

  return items;
}

export function checkReferences(project: Project): ValidationItem[] {
  const items: ValidationItem[] = [];

  // Cue name uniqueness + time constraints (cue-centric: use timeline.segments as cues[])
  const cueNameToIndex = new Map<string, number>();
  let maxCueEnd = 0;

  project.timeline.segments.forEach((cue, i) => {
    const pointerBase = `/cues/${i}`;
    const name = cue.name?.trim?.() ? cue.name.trim() : '';

    if (!name) {
      items.push(
        createItem('error', 'CUE_NAME_EMPTY', 'References', 'Cue name is required', {
          path: `${pointerBase}/name`,
          entityType: 'Segment',
          entityId: cue.id,
        }),
      );
    } else if (cueNameToIndex.has(name)) {
      items.push(
        createItem(
          'error',
          'CUE_NAME_DUPLICATE',
          'References',
          `Cue name must be unique: "${name}"`,
          {
            path: `${pointerBase}/name`,
            entityType: 'Segment',
            entityId: cue.id,
          },
        ),
      );
    } else {
      cueNameToIndex.set(name, i);
    }

    if (cue.start < 0) {
      items.push(
        createItem(
          'error',
          'CUE_TIME_INVALID',
          'Timeline',
          `Cue "${cue.name}" has start < 0`,
          { path: `${pointerBase}/start`, entityType: 'Segment', entityId: cue.id },
        ),
      );
    }

    if (cue.end < cue.start) {
      items.push(
        createItem(
          'error',
          'CUE_TIME_INVALID',
          'Timeline',
          `Cue "${cue.name}" end must be >= start`,
          { path: `${pointerBase}/end`, entityType: 'Segment', entityId: cue.id },
        ),
      );
    }

    maxCueEnd = Math.max(maxCueEnd, cue.end);
  });

  if (
    typeof project.meta.durationSec === 'number' &&
    project.meta.durationSec < maxCueEnd
  ) {
    items.push(
      createItem(
        'warning',
        'META_DURATION_MISMATCH',
        'Metadata',
        `meta.durationSec (${project.meta.durationSec}) is less than max cue end (${maxCueEnd.toFixed(
          1,
        )})`,
        { path: '/meta/duration', hint: 'Increase duration or adjust cues' },
      ),
    );
  }

  // Media references inside exported performance assets.
  const perf = generatePerformanceJSON(project) as any;
  const mediaFiles = new Set(project.media.map((m) => m.fileName));
  const geometryNames = new Set(
    project.assets.filter((a) => a.type === 'Geometry').map((a) => a.name),
  );

  (perf.assets ?? []).forEach((assetOut: any, i: number) => {
    const assetId = project.assets[i]?.id;
    const detailsType = assetOut?.details?.type;

    if (detailsType === 'Projection') {
      const target = assetOut?.projection?.target_surface;
      if (target && !geometryNames.has(target)) {
        items.push(
          createItem(
            'warning',
            'PROJ_TARGET_SURFACE_MISSING',
            'References',
            `projection.target_surface "${target}" is not a Geometry asset`,
            {
              path: `/assets/${i}/projection/target_surface`,
              entityType: 'Asset',
              entityId: assetId,
            },
          ),
        );
      }
      const file = assetOut?.projection?.media_ref?.file;
      if (file && !mediaFiles.has(file)) {
        items.push(
          createItem(
            'error',
            'REF_MEDIA_MISSING',
            'References',
            `Projection media_ref.file "${file}" not found in project media`,
            {
              path: `/assets/${i}/projection/media_ref/file`,
              entityType: 'Asset',
              entityId: assetId,
            },
          ),
        );
      }
    }

    if (detailsType === 'Performer') {
      const file = assetOut?.media_ref?.file;
      if (file && !mediaFiles.has(file)) {
        items.push(
          createItem(
            'error',
            'REF_MEDIA_MISSING',
            'References',
            `Performer media_ref.file "${file}" not found in project media`,
            {
              path: `/assets/${i}/media_ref/file`,
              entityType: 'Asset',
              entityId: assetId,
            },
          ),
        );
      }

      (assetOut?.cue_membership ?? []).forEach((m: any, j: number) => {
        const cueName = m?.cue;
        if (cueName && !cueNameToIndex.has(cueName)) {
          items.push(
            createItem(
              'error',
              'CUE_REF_MISSING',
              'References',
              `cue_membership.cue "${cueName}" does not exist`,
              {
                path: `/assets/${i}/cue_membership/${j}/cue`,
                entityType: 'Asset',
                entityId: assetId,
              },
            ),
          );
        }
      });
    }

    if (detailsType === 'Light') {
      const parent = assetOut?.mount?.parent;
      if (parent && !project.assets.some((a) => a.name === parent)) {
        items.push(
          createItem(
            'warning',
            'LIGHT_MOUNT_PARENT_MISSING',
            'References',
            `mount.parent "${parent}" does not exist`,
            {
              path: `/assets/${i}/mount/parent`,
              entityType: 'Asset',
              entityId: assetId,
            },
          ),
        );
      }
      const target = assetOut?.focus?.target;
      if (target && !project.assets.some((a) => a.name === target)) {
        items.push(
          createItem(
            'warning',
            'LIGHT_FOCUS_TARGET_MISSING',
            'References',
            `focus.target "${target}" does not exist`,
            {
              path: `/assets/${i}/focus/target`,
              entityType: 'Asset',
              entityId: assetId,
            },
          ),
        );
      }

      (assetOut?.cue_states ?? []).forEach((cs: any, j: number) => {
        const cueName = cs?.cue;
        if (cueName && !cueNameToIndex.has(cueName)) {
          items.push(
            createItem(
              'error',
              'CUE_REF_MISSING',
              'References',
              `cue_states.cue "${cueName}" does not exist`,
              {
                path: `/assets/${i}/cue_states/${j}/cue`,
                entityType: 'Asset',
                entityId: assetId,
              },
            ),
          );
        }
      });
    }
  });

  // Devices checks
  const devices = project.devices?.devices ?? [];
  const deviceIdToIndex = new Map<string, number>();

  devices.forEach((d, i) => {
    if (deviceIdToIndex.has(d.id)) {
      items.push(
        createItem(
          'error',
          'DEVICE_ID_DUPLICATE',
          'Devices',
          `Device id must be unique: "${d.id}"`,
          { path: `/devices/${i}/id`, entityType: 'Device', entityId: d.id },
        ),
      );
    } else {
      deviceIdToIndex.set(d.id, i);
    }

    if (d.category === 'lighting_fixture') {
      const c: any = d.control ?? {};
      const universe = c.universe;
      const address = c.address;
      const dmxChannels = c.dmx_channels;

      if (typeof universe !== 'number' || universe < 1) {
        items.push(
          createItem(
            'error',
            'DMX_UNIVERSE_INVALID',
            'Devices',
            'DMX universe must be >= 1',
            { path: `/devices/${i}/control/universe`, entityType: 'Device', entityId: d.id },
          ),
        );
      }

      if (typeof address !== 'number' || address < 1 || address > 512) {
        items.push(
          createItem(
            'error',
            'DMX_ADDRESS_INVALID',
            'Devices',
            'DMX address must be in 1..512',
            { path: `/devices/${i}/control/address`, entityType: 'Device', entityId: d.id },
          ),
        );
      }

      if (
        typeof address === 'number' &&
        typeof dmxChannels === 'number' &&
        address + dmxChannels - 1 > 512
      ) {
        items.push(
          createItem(
            'warning',
            'DMX_RANGE_OVERFLOW',
            'Devices',
            `DMX range exceeds universe: end=${
              address + dmxChannels - 1
            }`,
            { path: `/devices/${i}/control/dmx_channels`, entityType: 'Device', entityId: d.id },
          ),
        );
      }
    }
  });

  return items;
}

export function checkTimeline(_project: Project): ValidationItem[] {
  // Kept for backwards compatibility in runValidation; cue-centric checks are now in checkReferences().
  return [];
}

export function checkConsistency(_project: Project): ValidationItem[] {
  // Kept for backwards compatibility in runValidation; cue-centric checks are now in checkReferences().
  return [];
}

export function checkMedia(project: Project): ValidationItem[] {
  const items: ValidationItem[] = [];
  const fileNames: { [key: string]: number } = {};
  project.media.forEach((m) => {
    fileNames[m.fileName] = (fileNames[m.fileName] || 0) + 1;
  });
  Object.entries(fileNames).forEach(([fileName, count]) => {
    if (count > 1) {
      items.push(
        createItem(
          'warning',
          'MEDIA_DUPLICATE_NAME',
          'Media',
          `Media file "${fileName}" appears ${count} times`,
          { path: '/media' },
        ),
      );
    }
  });
  return items;
}

export function checkMeta(project: Project): ValidationItem[] {
  const items: ValidationItem[] = [];

  if (!project.meta.title || project.meta.title.trim() === '') {
    items.push(
      createItem(
        'warning',
        'META_TITLE_EMPTY',
        'Metadata',
        'Project title is empty',
        { path: '/meta/title' },
      ),
    );
  }

  return items;
}
