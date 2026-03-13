'use client';
import { useStore } from '@/lib/store';
import { ProjectTree } from './ProjectTree';
import { TabsPanel } from './TabsPanel';
import { Inspector } from './Inspector';
import { ProblemsPanel } from './ProblemsPanel';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { exportProjectToOaisZip } from '@/lib/projectZip';

export function IDELayout() {
  const { project, runChecks, saveProject, problemsPanelOpen } = useStore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runChecks();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runChecks, saveProject]);

  if (!project) return null;

  const handleExport = async () => {
    try {
      const zip = await exportProjectToOaisZip(project);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName =
        (project.name || 'project')
          .toLowerCase()
          .replace(/[^a-z0-9\-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'project';
      a.href = url;
      a.download = `${safeName}-${project.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Project ZIP downloaded.',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error exporting project', err);
      toast({
        title: 'Export failed',
        description: 'Could not export project ZIP.',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-card border-b px-4 py-2 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold">{project.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs">Export ZIP</span>
          </Button>
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">
            Mode: {project.mode}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-card border-r overflow-y-auto">
          <ProjectTree />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TabsPanel />
          </div>
          {problemsPanelOpen && (
            <div className="h-64 border-t">
              <ProblemsPanel />
            </div>
          )}
        </div>

        <div className="w-80 bg-card border-l overflow-y-auto">
          <Inspector />
        </div>
      </div>
    </div>
  );
}
