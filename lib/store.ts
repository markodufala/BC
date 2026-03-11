import { create } from 'zustand';
import { Project, Asset, MediaItem, Segment, Cue, Snapshot, Device } from './types';
import { storage } from './storage';
import { runValidation } from './validation';

type State = {
  project: Project | null;
  activeTab: string;
  selectedEntityId: string | null;
  selectedEntityType: string | null;
  problemsPanelOpen: boolean;
  playheadTime: number;
  timelineSubTab: 'visual' | 'segments' | 'cues';
  checksRunning: boolean;
  checksProgress: number;

  loadProject: (id: string) => void;
  saveProject: () => void;
  setProject: (project: Project) => void;
  updateMeta: (meta: Partial<Project['meta']>) => void;
  toggleMode: () => void;

  setActiveTab: (tab: string) => void;
  selectEntity: (type: string | null, id: string | null) => void;
  toggleProblemsPanel: () => void;
  setPlayheadTime: (time: number) => void;
  setTimelineSubTab: (tab: 'visual' | 'segments' | 'cues') => void;
  updateMedia: (id: string, data: Partial<MediaItem>) => void;

  addDevice: (device: Omit<Device, 'id'> & { id?: string }) => void;
  updateDevice: (id: string, data: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addMedia: (media: Omit<MediaItem, 'id'>) => void;
  deleteMedia: (id: string) => void;

  addSegment: (segment: Omit<Segment, 'id'>) => void;
  updateSegment: (id: string, data: Partial<Segment>) => void;
  deleteSegment: (id: string) => void;

  addCue: (cue: Omit<Cue, 'id'>) => void;
  updateCue: (id: string, data: Partial<Cue>) => void;
  deleteCue: (id: string) => void;

  addSnapshot: (message: string, jsonText: string) => void;

  runChecks: () => void;
};

export const useStore = create<State>((set, get) => ({
  project: null,
  activeTab: 'Dashboard',
  selectedEntityId: null,
  selectedEntityType: null,
  problemsPanelOpen: true,
  playheadTime: 0,
  timelineSubTab: 'visual',
  checksRunning: false,
  checksProgress: 0,

  loadProject: (id) => {
    // Load local immediately, then reconcile with DB (if configured).
    const local = storage.getProject(id);
    if (local) {
      set({
        project: local,
        activeTab: 'Dashboard',
        selectedEntityId: null,
        selectedEntityType: null,
      });
    }

    (async () => {
      const remote = await storage.getProjectRemote(id);
      if (remote) {
        set({
          project: remote,
          activeTab: 'Dashboard',
          selectedEntityId: null,
          selectedEntityType: null,
        });
        // Keep local in sync for offline/fast loads.
        storage.saveProject(remote);
      }
    })();
  },

  saveProject: () => {
    const { project } = get();
    if (project) {
      storage.saveProject(project);
    }
  },

  setProject: (project) => {
    set({ project });
    storage.saveProject(project);
  },

  updateMeta: (meta) => {
    const { project } = get();
    if (project) {
      const updated = { ...project, meta: { ...project.meta, ...meta } };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  toggleMode: () => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        mode: project.mode === 'creator' ? 'archivist' : 'creator',
      } as Project;
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  selectEntity: (type, id) =>
    set({ selectedEntityType: type, selectedEntityId: id }),

  toggleProblemsPanel: () =>
    set((state) => ({ problemsPanelOpen: !state.problemsPanelOpen })),

  setPlayheadTime: (time) => set({ playheadTime: Math.max(0, time) }),

  setTimelineSubTab: (tab) => set({ timelineSubTab: tab }),

  updateMedia: (id, data) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        media: project.media.map((m) =>
          m.id === id ? { ...m, ...data } : m
        ),
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addDevice: (device) => {
    const { project } = get();
    if (project) {
      const newDevice: Device = {
        id: device.id || crypto.randomUUID(),
        category: device.category,
        manufacturer: device.manufacturer,
        model: device.model,
        instance: device.instance ?? {},
        control: device.control,
        photometrics: device.photometrics,
        video: device.video,
        channels: device.channels,
      };
      const updated = {
        ...project,
        devices: {
          devices: [...(project.devices?.devices ?? []), newDevice],
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  updateDevice: (id, data) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        devices: {
          devices: (project.devices?.devices ?? []).map((d) =>
            d.id === id ? { ...d, ...data } : d,
          ),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  deleteDevice: (id) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        devices: {
          devices: (project.devices?.devices ?? []).filter((d) => d.id !== id),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addAsset: (asset) => {
    const { project } = get();
    if (project) {
      const newAsset = { ...asset, id: crypto.randomUUID() };
      const updated = {
        ...project,
        assets: [...project.assets, newAsset],
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  updateAsset: (id, data) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        assets: project.assets.map((a) =>
          a.id === id ? { ...a, ...data } : a
        ),
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  deleteAsset: (id) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        assets: project.assets.filter((a) => a.id !== id),
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addMedia: (media) => {
    const { project } = get();
    if (project) {
      const newMedia = { ...media, id: crypto.randomUUID() };
      const updated = {
        ...project,
        media: [...project.media, newMedia],
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  deleteMedia: (id) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        media: project.media.filter((m) => m.id !== id),
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addSegment: (segment) => {
    const { project } = get();
    if (project) {
      const newSegment = { ...segment, id: crypto.randomUUID() };
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          segments: [...project.timeline.segments, newSegment],
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  updateSegment: (id, data) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          segments: project.timeline.segments.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  deleteSegment: (id) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          segments: project.timeline.segments.filter((s) => s.id !== id),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addCue: (cue) => {
    const { project } = get();
    if (project) {
      const newCue = { ...cue, id: crypto.randomUUID() };
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          cues: [...project.timeline.cues, newCue],
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  updateCue: (id, data) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          cues: project.timeline.cues.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  deleteCue: (id) => {
    const { project } = get();
    if (project) {
      const updated = {
        ...project,
        timeline: {
          ...project.timeline,
          cues: project.timeline.cues.filter((c) => c.id !== id),
        },
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  addSnapshot: (message, jsonText) => {
    const { project } = get();
    if (project) {
      const snapshot: Snapshot = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        message,
        jsonText,
      };
      const updated = {
        ...project,
        snapshots: [...project.snapshots, snapshot],
      };
      set({ project: updated });
      storage.saveProject(updated);
    }
  },

  runChecks: () => {
    const { project } = get();
    if (!project) return;

    // Start a lightweight progress animation while checks run.
    set({ checksRunning: true, checksProgress: 10 });

    // Perform validation synchronously (fast) then animate completion.
    const validation = runValidation(project);
    const updated = { ...project, lastValidation: validation };
    storage.saveProject(updated);

    // Staggered progress updates so the user perceives a loop.
    setTimeout(() => {
      set((state) =>
        state.checksRunning ? { checksProgress: 55 } : state,
      );
    }, 200);

    setTimeout(() => {
      set((state) =>
        state.checksRunning ? { checksProgress: 85 } : state,
      );
    }, 400);

    setTimeout(() => {
      set({
        project: updated,
        checksRunning: false,
        checksProgress: 100,
      });
      // Let the bar rest at 100 briefly, then reset.
      setTimeout(() => {
        set((state) =>
          state.checksRunning ? state : { ...state, checksProgress: 0 },
        );
      }, 600);
    }, 650);
  },
}));
