'use client';

import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import { generateDevicesJSON, generatePerformanceJSON } from '@/lib/validation';
import { useState } from 'react';

export function DashboardTab() {
  const { project, runChecks, addSnapshot } = useStore();
  const [openingBlender, setOpeningBlender] = useState(false);

  if (!project) return null;

  const assetsByType = project.assets.reduce(
    (acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const mediaByKind = project.media.reduce(
    (acc, media) => {
      acc[media.kind] = (acc[media.kind] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleExport = () => {
    const json = generatePerformanceJSON(project);
    const label =
      project.lastValidation?.summary.errors === 0
        ? 'READY'
        : 'EXPORT WITH WARNINGS';

    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance.json';
    a.click();
    URL.revokeObjectURL(url);

    // Also export devices.json for convenience.
    const devices = generateDevicesJSON(project);
    const blob2 = new Blob([JSON.stringify(devices, null, 2)], {
      type: 'application/json',
    });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = 'devices.json';
    a2.click();
    URL.revokeObjectURL(url2);

    // no toast here yet; will be wired into UX feedback module later
    void label;
  };

  const handleCreateSnapshot = () => {
    const message = prompt('Snapshot message:');
    if (message) {
      addSnapshot(message, JSON.stringify(project, null, 2));
    }
  };

  const handleOpenInBlender = async () => {
    if (!project) return;
    try {
      setOpeningBlender(true);
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '0.0.0.0');

      if (isLocalhost) {
        const res = await fetch('/api/blender', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ project }),
        });
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error('Failed to open Blender', await res.text());
          alert('Failed to open Blender. Check the server logs for details.');
        }
      } else {
        const perfJson = generatePerformanceJSON(project);
        const blob = new Blob([JSON.stringify(perfJson, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'performance-for-blender.json';
        a.click();
        URL.revokeObjectURL(url);
        alert(
          'Downloaded performance-for-blender.json. Open it with your local Blender bootstrap script.',
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error calling /api/blender', err);
      alert('Error calling /api/blender. See console for details.');
    } finally {
      setOpeningBlender(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="text-2xl font-bold">{project.assets.length}</div>
            <div className="text-sm text-muted-foreground">Total Assets</div>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold">{project.media.length}</div>
            <div className="text-sm text-muted-foreground">Total Media</div>
          </div>
          <div className="bg-orange-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {project.timeline.segments.length}
            </div>
            <div className="text-sm text-muted-foreground">Timeline Segments</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Assets by Type</h3>
            {Object.keys(assetsByType).length > 0 ? (
              <ul className="space-y-1 text-sm">
                {Object.entries(assetsByType).map(([type, count]) => (
                  <li key={type}>
                    {type}: {count}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No assets yet</div>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Media by Kind</h3>
            {Object.keys(mediaByKind).length > 0 ? (
              <ul className="space-y-1 text-sm">
                {Object.entries(mediaByKind).map(([kind, count]) => (
                  <li key={kind}>
                    {kind}: {count}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No media yet</div>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Project Meta</h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Title:</span>{' '}
              {project.meta.title || 'Not set'}
            </div>
            <div>
              <span className="font-medium">Authors:</span>{' '}
              {project.meta.authors.length > 0
                ? project.meta.authors.join(', ')
                : 'None'}
            </div>
            <div>
              <span className="font-medium">Description:</span>{' '}
              {project.meta.description || 'Not set'}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={runChecks}>Run Checks</Button>
          <Button variant="outline" onClick={handleExport}>
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenInBlender}
            disabled={openingBlender}
          >
            {openingBlender ? 'Opening Blender…' : 'Open in Blender'}
          </Button>
          <Button variant="outline" onClick={handleCreateSnapshot}>
            Create Snapshot
          </Button>
        </div>
      </div>
    </div>
  );
}
