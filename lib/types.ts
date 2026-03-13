export type OaisAuxFile = {
  path: string;
  contentType?: string;
  data: string;
  binary?: boolean;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: 'creator' | 'archivist';
  schemaVersion: number;
  meta: {
    title: string;
    authors: string[];
    description: string;
    date?: string;
    tags?: string[];
    fps?: number;
    /**
     * Optional, used by v3 export/validation. If absent we compute from cues.
     */
    durationSec?: number;
    /**
     * Optional, used by OAIS-style ZIP import/export to preserve auxiliary files
     * such as media, mocap, docs, and metadata files.
     */
    oaisAuxFiles?: { [relativePath: string]: OaisAuxFile };
  };
  assets: Asset[];
  media: MediaItem[];
  timeline: {
    segments: Segment[];
    cues: Cue[];
  };
  snapshots: Snapshot[];
  lastValidation?: ValidationReport;
  devices?: DevicesDocument;
};

export type Asset = {
  id: string;
  name: string;
  type: 'Geometry' | 'Rigging' | 'Performer' | 'Light' | 'Projection';
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  relationships: {
    parentId?: string;
    mountId?: string;
    followTargetId?: string;
  };
  media_ref?: {
    kind: 'audio' | 'image' | 'video' | 'mocap';
    file: string;
    start_time: number;
  };
};

export type MediaItem = {
  id: string;
  fileName: string;
  kind: 'audio' | 'image' | 'video' | 'mocap';
  mimeType: string;
  size: number;
  uploadedAt: string;
  durationSec?: number;
};

export type Segment = {
  id: string;
  name: string;
  start: number;
  end: number;
};

export type Cue = {
  id: string;
  type: 'audio' | 'projection' | 'light' | 'mocap';
  name: string;
  start: number;
  end?: number;
  targetAssetId?: string;
  mediaFile?: string;
};

export type Snapshot = {
  id: string;
  createdAt: string;
  message: string;
  jsonText: string;
};

export type ValidationItem = {
  id: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  category: string;
  message: string;
  hint?: string;
  path?: string;
  entityType?: string;
  entityId?: string;
};

export type ValidationReport = {
  ranAt: number;
  summary: { errors: number; warnings: number; info: number };
  categories: { [key: string]: number };
  items: ValidationItem[];
};

export type DevicesDocument = {
  devices: Device[];
};

export type Device = {
  id: string;
  category: 'lighting_fixture' | 'projection_system' | 'audio_system';
  manufacturer: string;
  model: string;
  instance: Record<string, any>;
  control?: Record<string, any>;
  photometrics?: Record<string, any>;
  video?: Record<string, any>;
  channels?: Record<string, any>;
};
