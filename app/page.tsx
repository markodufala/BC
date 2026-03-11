'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Copy, FolderOpen } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const loadProjects = () => {
    setProjects(storage.getAllProjects());
  };

  useEffect(() => {
    loadProjects();
    (async () => {
      const remote = await storage.getAllProjectsRemote();
      if (!remote) return;
      // Merge remote into local list by id (remote wins).
      const local = storage.getAllProjects();
      const byId = new Map<string, Project>();
      local.forEach((p) => byId.set(p.id, p));
      remote.forEach((p) => byId.set(p.id, p));
      const merged = Array.from(byId.values()).sort(
        (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
      );
      setProjects(merged);
      // Persist merged locally for offline.
      merged.forEach((p) => storage.saveProject(p));
    })();
  }, []);

  const handleCreate = () => {
    if (newProjectName.trim()) {
      const project = storage.createProject(newProjectName.trim());
      setNewProjectName('');
      setDialogOpen(false);
      loadProjects();
      router.push(`/project/${project.id}`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project?')) {
      storage.deleteProject(id);
      loadProjects();
    }
  };

  const handleDuplicate = (id: string) => {
    storage.duplicateProject(id);
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Performance Editor</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <Button onClick={handleCreate} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Updated: {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicate(project.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
