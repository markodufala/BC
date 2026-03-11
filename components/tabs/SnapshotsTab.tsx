'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export function SnapshotsTab() {
  const { project } = useStore();
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<[string, string]>([
    '',
    '',
  ]);

  if (!project) return null;

  const snapshot1 = project.snapshots.find(
    (s) => s.id === selectedSnapshots[0]
  );
  const snapshot2 = project.snapshots.find(
    (s) => s.id === selectedSnapshots[1]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Snapshots</h2>
        {project.snapshots.length >= 2 && (
          <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Compare Snapshots
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Compare Snapshots</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Snapshot 1
                    </label>
                    <select
                      className="w-full border rounded p-2"
                      value={selectedSnapshots[0]}
                      onChange={(e) =>
                        setSelectedSnapshots([
                          e.target.value,
                          selectedSnapshots[1],
                        ])
                      }
                    >
                      <option value="">Select...</option>
                      {project.snapshots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.message} - {new Date(s.createdAt).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Snapshot 2
                    </label>
                    <select
                      className="w-full border rounded p-2"
                      value={selectedSnapshots[1]}
                      onChange={(e) =>
                        setSelectedSnapshots([
                          selectedSnapshots[0],
                          e.target.value,
                        ])
                      }
                    >
                      <option value="">Select...</option>
                      {project.snapshots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.message} - {new Date(s.createdAt).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {snapshot1 && snapshot2 && (
                  <div className="grid grid-cols-2 gap-4 max-h-96 overflow-auto">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {snapshot1.message}
                    </h4>
                    <pre className="text-xs bg-muted p-4 rounded border overflow-auto">
                        {snapshot1.jsonText}
                      </pre>
                    </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      {snapshot2.message}
                    </h4>
                    <pre className="text-xs bg-muted p-4 rounded border overflow-auto">
                        {snapshot2.jsonText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {project.snapshots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No snapshots yet. Create one from the Dashboard.
        </div>
      ) : (
        <div className="grid gap-4">
          {project.snapshots.map((snapshot) => (
            <div key={snapshot.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{snapshot.message}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(snapshot.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                  View JSON
                </summary>
                <pre className="text-xs bg-muted p-4 rounded border mt-2 overflow-auto max-h-64">
                  {snapshot.jsonText}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
