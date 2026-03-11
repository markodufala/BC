import { Project, Asset, MediaItem, Segment, Device } from './types';

export function applyExternalJsonToProjectFromText(
  project: Project,
  performanceText: string,
  devicesText: string,
): Project {
  let perf: any = null;
  let dev: any = null;

  try {
    perf = performanceText ? JSON.parse(performanceText) : null;
  } catch {
    // ignore, validation should have caught this
  }
  try {
    dev = devicesText ? JSON.parse(devicesText) : null;
  } catch {
    // ignore
  }

  if (!perf) return project;

  const next: Project = {
    ...project,
    schemaVersion: 3,
    meta: {
      ...project.meta,
      title: perf.meta?.title ?? project.meta.title,
      authors:
        typeof perf.meta?.author === 'string'
          ? [perf.meta.author]
          : project.meta.authors,
      fps: typeof perf.meta?.fps === 'number' ? perf.meta.fps : project.meta.fps,
      durationSec:
        typeof perf.meta?.duration === 'number'
          ? perf.meta.duration
          : project.meta.durationSec,
    },
  };

  // Cues -> timeline.segments
  if (Array.isArray(perf.cues)) {
    const segments: Segment[] = perf.cues.map((c: any) => ({
      id: crypto.randomUUID(),
      name: c.name ?? 'Cue',
      start: typeof c.start === 'number' ? c.start : 0,
      end: typeof c.end === 'number' ? c.end : c.start ?? 0,
    }));
    next.timeline = {
      ...next.timeline,
      segments,
    };
  }

  // Assets
  if (Array.isArray(perf.assets)) {
    const assets: Asset[] = perf.assets.map((a: any) => ({
      id: crypto.randomUUID(),
      name: a.name ?? 'Asset',
      type: a.details?.type ?? 'Geometry',
      transform: {
        position: {
          x: a.transform?.location?.[0] ?? 0,
          y: a.transform?.location?.[1] ?? 0,
          z: a.transform?.location?.[2] ?? 0,
        },
        rotation: {
          x: a.transform?.rotation_euler_deg?.[0] ?? 0,
          y: a.transform?.rotation_euler_deg?.[1] ?? 0,
          z: a.transform?.rotation_euler_deg?.[2] ?? 0,
        },
        scale: {
          x: a.transform?.scale?.[0] ?? 1,
          y: a.transform?.scale?.[1] ?? 1,
          z: a.transform?.scale?.[2] ?? 1,
        },
      },
      relationships: {},
      media_ref: a.media_ref,
    }));
    next.assets = assets;
  }

  // Media inferred from media_ref files
  const mediaFiles = new Set<string>();
  next.assets.forEach((a) => {
    if (a.media_ref?.file) mediaFiles.add(a.media_ref.file);
  });
  const media: MediaItem[] = Array.from(mediaFiles).map((file) => ({
    id: crypto.randomUUID(),
    fileName: file,
    kind: 'video',
    mimeType: 'application/octet-stream',
    size: 0,
    uploadedAt: new Date().toISOString(),
  }));
  next.media = media;

  // Devices
  if (dev && Array.isArray(dev.devices)) {
    const devices: Device[] = dev.devices.map((d: any) => ({
      id: d.id ?? crypto.randomUUID(),
      category: d.category ?? 'lighting_fixture',
      manufacturer: d.manufacturer ?? '',
      model: d.model ?? '',
      instance: d.instance ?? {},
      control: d.control ?? {},
      photometrics: d.photometrics ?? {},
      video: d.video ?? {},
      channels: d.channels ?? {},
    }));
    next.devices = { devices };
  }

  return next;
}

