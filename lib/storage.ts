import { Project } from './types';
import { migrateProject } from './validation';

const STORAGE_KEY = 'performance-editor-projects';

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchRemoteProjects(): Promise<Project[] | null> {
  try {
    const res = await fetch('/api/projects', { method: 'GET' });
    if (!res.ok) return null;
    const json = await safeJson(res);
    const projects = Array.isArray(json?.projects) ? json.projects : null;
    if (!projects) return null;
    return projects.map((p: any) => migrateProject(p));
  } catch {
    return null;
  }
}

async function fetchRemoteProject(id: string): Promise<Project | null> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    const json = await safeJson(res);
    return json?.project ? migrateProject(json.project) : null;
  } catch {
    return null;
  }
}

function saveRemoteProject(project: Project) {
  // Fire-and-forget remote save. Local storage remains the source of truth if DB isn't configured.
  fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ project }),
  }).catch(() => {});
}

function deleteRemoteProject(id: string) {
  fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export const storage = {
  getAllProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    const projects = data ? JSON.parse(data) : [];
    return projects.map((p: any) => migrateProject(p));
  },

  async getAllProjectsRemote(): Promise<Project[] | null> {
    if (typeof window === 'undefined') return null;
    return await fetchRemoteProjects();
  },

  getProject(id: string): Project | null {
    const projects = this.getAllProjects();
    const project = projects.find((p) => p.id === id);
    return project ? migrateProject(project) : null;
  },

  async getProjectRemote(id: string): Promise<Project | null> {
    if (typeof window === 'undefined') return null;
    return await fetchRemoteProject(id);
  },

  saveProject(project: Project): void {
    const projects = this.getAllProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();

    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    saveRemoteProject(project);
  },

  deleteProject(id: string): void {
    const projects = this.getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    deleteRemoteProject(id);
  },

  duplicateProject(id: string): Project | null {
    const project = this.getProject(id);
    if (!project) return null;

    const newProject: Project = {
      ...JSON.parse(JSON.stringify(project)),
      id: crypto.randomUUID(),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveProject(newProject);
    return newProject;
  },

  createProject(name: string): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'creator',
      schemaVersion: 3,
      meta: {
        title: '',
        authors: [],
        description: '',
      },
      assets: [],
      media: [],
      timeline: {
        segments: [],
        cues: [],
      },
      snapshots: [],
      devices: { devices: [] },
    };

    this.saveProject(project);
    return project;
  },
};
