import { Project, ValidationReport, Asset, MediaItem, Segment, Cue } from '../types';
import {
  checkSchema,
  checkReferences,
  checkTimeline,
  checkConsistency,
  checkMedia,
  checkMeta,
} from './checks';

export function runValidation(project: Project): ValidationReport {
  const items = [
    ...checkSchema(project),
    ...checkReferences(project),
    ...checkTimeline(project),
    ...checkConsistency(project),
    ...checkMedia(project),
    ...checkMeta(project),
  ];

  const categories: { [key: string]: number } = {};
  items.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1;
  });

  const summary = items.reduce(
    (acc, item) => {
      if (item.severity === 'error') acc.errors++;
      else if (item.severity === 'warning') acc.warnings++;
      else acc.info++;
      return acc;
    },
    { errors: 0, warnings: 0, info: 0 }
  );

  return {
    ranAt: Date.now(),
    summary,
    categories,
    items,
  };
}

export function generatePerformanceJSON(project: Project) {
  const assets = Array.isArray(project.assets) ? project.assets : [];
  const assetNameById = new Map(assets.map((a) => [a.id, a.name]));

  const meta = project.meta ?? {};
  const authors = Array.isArray(meta.authors) ? meta.authors : [];

  const cues = project.timeline.segments.map((s) => ({
    name: s.name,
    start: s.start,
    end: typeof s.end === 'number' ? s.end : s.start,
  }));

  const maxCueEnd = cues.reduce((max, c) => Math.max(max, c.end), 0);
  const duration =
    typeof meta.durationSec === 'number' ? meta.durationSec : maxCueEnd;

  const author = authors.length > 0 ? authors.join(', ') : 'Unknown';

  const assetsOut = assets.map((asset) => {
    const base: any = {
      name: asset.name,
      details: { type: asset.type },
      transform: {
        location: [
          asset.transform.position.x,
          asset.transform.position.y,
          asset.transform.position.z,
        ],
        rotation_euler_deg: [
          asset.transform.rotation.x,
          asset.transform.rotation.y,
          asset.transform.rotation.z,
        ],
        scale: [
          asset.transform.scale.x,
          asset.transform.scale.y,
          asset.transform.scale.z,
        ],
      },
    };

    if (asset.type === 'Projection') {
      const targetSurface =
        (asset.relationships.followTargetId &&
          assetNameById.get(asset.relationships.followTargetId)) ||
        '';
      if (asset.media_ref && (asset.media_ref.kind === 'video' || asset.media_ref.kind === 'image')) {
        base.projection = {
          target_surface: targetSurface,
          media_ref: {
            kind: asset.media_ref.kind,
            file: asset.media_ref.file,
            start_time: asset.media_ref.start_time,
          },
        };
      } else {
        base.projection = { target_surface: targetSurface };
      }
      base.cue_states = [];
    }

    if (asset.type === 'Performer') {
      if (asset.media_ref && asset.media_ref.kind === 'mocap') {
        base.media_ref = {
          kind: 'mocap',
          file: asset.media_ref.file,
          start_time: asset.media_ref.start_time,
        };
      }
      base.cue_membership = [];
    }

    if (asset.type === 'Light') {
      if (asset.relationships.mountId) {
        const parentName = assetNameById.get(asset.relationships.mountId) || '';
        if (parentName) {
          base.mount = { parent: parentName, keep_world_transform: true };
        }
      }

      base.technical = { intensity_unit: 'lux' };

      if (asset.relationships.followTargetId) {
        const targetName =
          assetNameById.get(asset.relationships.followTargetId) || '';
        if (targetName) {
          base.focus = {
            target: targetName,
            mode: 'follow',
            offset: [0, 0, 0],
            aim: 'look_at_target',
          };
        }
      }

      base.cue_states = [];
    }

    return base;
  });

  return {
    meta: {
      title: (meta as any).title || project.name,
      author,
      duration,
      fps: typeof meta.fps === 'number' ? meta.fps : 30,
    },
    space: {
      units: { length: 'm', time: 's', rotation: 'deg', light_intensity: 'lux' },
      axes: {
        system: 'Blender default',
        right: 'X',
        forward: 'Y',
        up: 'Z',
      },
    },
    synchronization: {
      global_time_unit: 'seconds',
      point_sync_source: 'cues[]',
      adaptive: { enabled: true, lateness_policy: 'hold_last_value' },
    },
    cues,
    assets: assetsOut,
  };
}

export function generateDevicesJSON(project: Project) {
  return project.devices ?? { devices: [] };
}

function guessKindFromDetails(details: any): Asset['type'] {
  const t = details?.type;
  if (t === 'Geometry' || t === 'Rigging' || t === 'Performer' || t === 'Light' || t === 'Projection') {
    return t;
  }
  return 'Geometry';
}

function guessMediaKindFromString(kind: string | undefined): MediaItem['kind'] {
  if (kind === 'audio' || kind === 'image' || kind === 'video' || kind === 'mocap') {
    return kind;
  }
  return 'video';
}

function guessMimeType(fileName: string, kind: MediaItem['kind']): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (kind === 'audio') return 'audio/*';
  if (kind === 'image') return 'image/*';
  if (kind === 'video') return 'video/*';
  return 'application/octet-stream';
}

export function performanceJsonToProject(perf: any, existing: Project | null = null): Project {
  const nowIso = new Date().toISOString();
  const id = existing?.id ?? crypto.randomUUID();
  const title = typeof perf?.meta?.title === 'string'
    ? perf.meta.title
    : existing?.meta.title || existing?.name || 'Imported performance';
  const authorStr = typeof perf?.meta?.author === 'string' ? perf.meta.author : '';
  const authors =
    authorStr.length > 0
      ? authorStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : existing?.meta.authors ?? [];

  const cuesArr: any[] = Array.isArray(perf?.cues) ? perf.cues : [];
  const maxCueEnd = cuesArr.reduce(
    (max, c) =>
      Math.max(
        max,
        typeof c?.end === 'number'
          ? c.end
          : typeof c?.start === 'number'
            ? c.start
            : 0,
      ),
    0,
  );
  const durationSec =
    typeof perf?.meta?.duration === 'number'
      ? perf.meta.duration
      : maxCueEnd;
  const fps =
    typeof perf?.meta?.fps === 'number'
      ? perf.meta.fps
      : existing?.meta.fps ?? 30;

  const segments: Segment[] = cuesArr.map((c: any) => ({
    id: crypto.randomUUID(),
    name: typeof c?.name === 'string' && c.name.trim() ? c.name : 'Cue',
    start: typeof c?.start === 'number' ? c.start : 0,
    end:
      typeof c?.end === 'number'
        ? c.end
        : typeof c?.start === 'number'
          ? c.start
          : 0,
  }));
  const segmentsByName = new Map<string, Segment>(
    segments.map((s) => [s.name, s]),
  );

  const perfAssets: any[] = Array.isArray(perf?.assets) ? perf.assets : [];
  const nameToId = new Map<string, string>();
  perfAssets.forEach((a: any) => {
    const name = typeof a?.name === 'string' && a.name.trim()
      ? a.name
      : `Asset ${nameToId.size + 1}`;
    if (!nameToId.has(name)) {
      nameToId.set(name, crypto.randomUUID());
    }
  });

  const mediaItems: MediaItem[] = [];
  const mediaByFile = new Map<string, string>(); // file -> media.id

  const ensureMedia = (kind: MediaItem['kind'], file: string): MediaItem => {
    const existingId = mediaByFile.get(file);
    if (existingId) {
      const existingItem = mediaItems.find((m) => m.id === existingId);
      if (existingItem) return existingItem;
    }
    const id = crypto.randomUUID();
    const item: MediaItem = {
      id,
      fileName: file,
      kind,
      mimeType: guessMimeType(file, kind),
      size: 0,
      uploadedAt: nowIso,
    };
    mediaItems.push(item);
    mediaByFile.set(file, id);
    return item;
  };

  const assets: Asset[] = perfAssets.map((a: any) => {
    const name = typeof a?.name === 'string' && a.name.trim()
      ? a.name
      : `Asset ${nameToId.size + 1}`;
    const idForName = nameToId.get(name) ?? crypto.randomUUID();
    nameToId.set(name, idForName);

    const type = guessKindFromDetails(a.details);

    const loc = Array.isArray(a?.transform?.location)
      ? a.transform.location
      : [0, 0, 0];
    const rot = Array.isArray(a?.transform?.rotation_euler_deg)
      ? a.transform.rotation_euler_deg
      : [0, 0, 0];
    const scale = Array.isArray(a?.transform?.scale)
      ? a.transform.scale
      : [1, 1, 1];

    const relationships: Asset['relationships'] = {
      parentId: undefined,
      mountId: undefined,
      followTargetId: undefined,
    };

    if (a.mount?.parent && typeof a.mount.parent === 'string') {
      const parentId = nameToId.get(a.mount.parent);
      if (parentId) {
        relationships.mountId = parentId;
        relationships.parentId = parentId;
      }
    }

    if (a.focus?.target && typeof a.focus.target === 'string') {
      const followId = nameToId.get(a.focus.target);
      if (followId) {
        relationships.followTargetId = followId;
      }
    }

    let media_ref: Asset['media_ref'] | undefined = undefined;

    if (type === 'Projection' && a.projection?.media_ref?.file) {
      const ref = a.projection.media_ref;
      const kind = guessMediaKindFromString(ref.kind);
      const item = ensureMedia(kind, String(ref.file));
      media_ref = {
        kind: item.kind,
        file: item.fileName,
        start_time:
          typeof ref.start_time === 'number'
            ? ref.start_time
            : 0,
      };
    }

    if (type === 'Performer' && a.media_ref?.file) {
      const ref = a.media_ref;
      const kind = guessMediaKindFromString(ref.kind ?? 'mocap');
      const item = ensureMedia(kind, String(ref.file));
      media_ref = {
        kind: item.kind,
        file: item.fileName,
        start_time:
          typeof ref.start_time === 'number'
            ? ref.start_time
            : 0,
      };
    }

    return {
      id: idForName,
      name,
      type,
      transform: {
        position: {
          x: Number(loc[0] ?? 0),
          y: Number(loc[1] ?? 0),
          z: Number(loc[2] ?? 0),
        },
        rotation: {
          x: Number(rot[0] ?? 0),
          y: Number(rot[1] ?? 0),
          z: Number(rot[2] ?? 0),
        },
        scale: {
          x: Number(scale[0] ?? 1),
          y: Number(scale[1] ?? 1),
          z: Number(scale[2] ?? 1),
        },
      },
      relationships,
      media_ref,
    };
  });

  const cuesTimeline: Cue[] = [];

  // Create cues for lights and projections that reference cue names.
  assets.forEach((asset) => {
    const perfAsset = perfAssets.find((a: any) => a?.name === asset.name);
    if (!perfAsset) return;

    if (asset.type === 'Light' && Array.isArray(perfAsset.cue_states)) {
      perfAsset.cue_states.forEach((cs: any) => {
        if (!cs?.cue) return;
        const seg = segmentsByName.get(String(cs.cue));
        const start = seg?.start ?? 0;
        const end = seg?.end;
        cuesTimeline.push({
          id: crypto.randomUUID(),
          type: 'light',
          name: `${cs.cue} / ${asset.name}`,
          start,
          end,
          targetAssetId: asset.id,
          mediaFile: undefined,
        });
      });
    }

    if (asset.type === 'Projection') {
      if (Array.isArray(perfAsset.cue_states)) {
        perfAsset.cue_states.forEach((cs: any) => {
          if (!cs?.cue) return;
          const seg = segmentsByName.get(String(cs.cue));
          const start = seg?.start ?? 0;
          const end = seg?.end;
          cuesTimeline.push({
            id: crypto.randomUUID(),
            type: 'projection',
            name: `${cs.cue} / ${asset.name}`,
            start,
            end,
            targetAssetId: asset.id,
            mediaFile: asset.media_ref?.file,
          });
        });
      } else if (asset.media_ref) {
        // Fallback: one projection cue covering entire duration.
        cuesTimeline.push({
          id: crypto.randomUUID(),
          type: 'projection',
          name: `Projection / ${asset.name}`,
          start: 0,
          end: durationSec,
          targetAssetId: asset.id,
          mediaFile: asset.media_ref.file,
        });
      }
    }

    if (asset.type === 'Performer' && Array.isArray(perfAsset.cue_membership) && asset.media_ref) {
      perfAsset.cue_membership.forEach((m: any) => {
        if (!m?.cue) return;
        const seg = segmentsByName.get(String(m.cue));
        const start = seg?.start ?? 0;
        const end = seg?.end;
        cuesTimeline.push({
          id: crypto.randomUUID(),
          type: 'mocap',
          name: `${m.cue} / ${asset.name}`,
          start,
          end,
          targetAssetId: asset.id,
          mediaFile: asset.media_ref?.file,
        });
      });
    }
  });

  const project: Project = {
    id,
    name: title,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    mode: existing?.mode ?? 'creator',
    schemaVersion: 3,
    meta: {
      title,
      authors,
      description: existing?.meta.description ?? '',
      durationSec,
      fps,
    },
    assets,
    media: mediaItems,
    timeline: {
      segments,
      cues: cuesTimeline,
    },
    snapshots: existing?.snapshots ?? [],
    lastValidation: existing?.lastValidation,
    devices: existing?.devices ?? { devices: [] },
  };

  return project;
}

export function migrateProject(project: any): Project {
  let migrated = { ...project } as any;

  // Ensure core collections exist and asset transforms are well-formed.
  migrated.meta = migrated.meta ?? {};
  migrated.meta.authors = Array.isArray(migrated.meta.authors)
    ? migrated.meta.authors
    : [];
  migrated.meta.title = typeof migrated.meta.title === 'string'
    ? migrated.meta.title
    : migrated.name || '';
  migrated.meta.description =
    typeof migrated.meta.description === 'string'
      ? migrated.meta.description
      : '';

  migrated.assets = Array.isArray(migrated.assets) ? migrated.assets : [];
  migrated.assets = migrated.assets.map((asset: any) => {
    const t = asset.transform ?? {};
    const pos = t.position ?? {};
    const rot = t.rotation ?? {};
    const scale = t.scale ?? {};
    return {
      ...asset,
      transform: {
        position: {
          x: typeof pos.x === 'number' ? pos.x : 0,
          y: typeof pos.y === 'number' ? pos.y : 0,
          z: typeof pos.z === 'number' ? pos.z : 0,
        },
        rotation: {
          x: typeof rot.x === 'number' ? rot.x : 0,
          y: typeof rot.y === 'number' ? rot.y : 0,
          z: typeof rot.z === 'number' ? rot.z : 0,
        },
        scale: {
          x: typeof scale.x === 'number' ? scale.x : 1,
          y: typeof scale.y === 'number' ? scale.y : 1,
          z: typeof scale.z === 'number' ? scale.z : 1,
        },
      },
    };
  });

  migrated.timeline = migrated.timeline ?? {};
  migrated.timeline.segments = Array.isArray(migrated.timeline.segments)
    ? migrated.timeline.segments
    : [];
  migrated.timeline.cues = Array.isArray(migrated.timeline.cues)
    ? migrated.timeline.cues
    : [];

  // v2: normalize optional fields
  if (!migrated.schemaVersion || migrated.schemaVersion < 2) {
    migrated = {
      ...migrated,
      schemaVersion: 2,
      media:
        migrated.media?.map((m: any) => ({
          ...m,
          durationSec: m.durationSec || undefined,
        })) || [],
      timeline: {
        ...migrated.timeline,
        cues:
          migrated.timeline?.cues?.map((c: any) => ({
            ...c,
            mediaFile: c.mediaFile || undefined,
          })) || [],
      },
    };
  }

  // v3: devices + duration + cue-centric merge into segments
  if (migrated.schemaVersion < 3) {
    const segments = Array.isArray(migrated.timeline?.segments)
      ? migrated.timeline.segments
      : [];
    const oldCues = Array.isArray(migrated.timeline?.cues)
      ? migrated.timeline.cues
      : [];

    const byName = new Map<string, any>();
    segments.forEach((s: any) => {
      const name = typeof s.name === 'string' && s.name.trim() ? s.name : 'Cue';
      byName.set(name, {
        id: s.id || crypto.randomUUID(),
        name,
        start: typeof s.start === 'number' ? s.start : 0,
        end: typeof s.end === 'number' ? s.end : 0,
      });
    });

    // Merge old timeline "cues" by name into cue-ranges. Ensure end exists.
    oldCues.forEach((c: any) => {
      const name =
        typeof c.name === 'string' && c.name.trim()
          ? c.name
          : `Cue ${byName.size + 1}`;
      const start = typeof c.start === 'number' ? c.start : 0;
      const end =
        typeof c.end === 'number'
          ? c.end
          : typeof c.start === 'number'
            ? c.start
            : 0;

      const existing = byName.get(name);
      if (!existing) {
        byName.set(name, {
          id: crypto.randomUUID(),
          name,
          start,
          end,
        });
      } else {
        // Reconcile: expand range to cover both.
        existing.start = Math.min(existing.start, start);
        existing.end = Math.max(existing.end, end);
      }
    });

    const mergedCueRanges = Array.from(byName.values()).map((c: any) => ({
      ...c,
      end: typeof c.end === 'number' ? c.end : c.start,
    }));

    const durationSec = mergedCueRanges.reduce(
      (max: number, c: any) => Math.max(max, typeof c.end === 'number' ? c.end : 0),
      0,
    );

    migrated = {
      ...migrated,
      schemaVersion: 3,
      meta: {
        ...migrated.meta,
        durationSec: migrated.meta?.durationSec ?? durationSec,
      },
      timeline: {
        ...migrated.timeline,
        segments: mergedCueRanges,
      },
      devices: migrated.devices ?? { devices: [] },
    };
  }

  return migrated as Project;
}
