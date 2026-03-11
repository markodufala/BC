'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { IDELayout } from '@/components/IDELayout';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { loadProject, project } = useStore();

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      loadProject(id);
    }
  }, [params.id, loadProject]);

  useEffect(() => {
    if (!project && params.id) {
      const timer = setTimeout(() => {
        if (!project) {
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [project, params.id, router]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return <IDELayout />;
}
