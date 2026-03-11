'use client';

import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

export function TimelineVisualTab() {
  const { project, playheadTime, setPlayheadTime, selectEntity } = useStore();
  const [zoom, setZoom] = useState(100);

  if (!project) return null;

  const maxEnd = Math.max(
    ...project.timeline.segments.map((s) => s.end),
    ...project.timeline.cues.map((c) => {
      if (c.mediaFile && c.type === 'audio') {
        const media = project.media.find((m) => m.fileName === c.mediaFile);
        if (media?.durationSec) return c.start + media.durationSec;
      }
      return c.end || c.start + 0.5;
    }),
    1
  );

  const pxPerSec = (zoom / 100) * 100;
  const timelineWidth = maxEnd * pxPerSec;

  const segmentsByTrack = project.timeline.segments;
  const cuesByType: { [key: string]: typeof project.timeline.cues } = {};
  project.timeline.cues.forEach((cue) => {
    if (!cuesByType[cue.type]) cuesByType[cue.type] = [];
    cuesByType[cue.type].push(cue);
  });

  const handlePlayheadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setPlayheadTime(x / pxPerSec);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Timeline Visualization (Read-Only)</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.max(25, zoom - 50))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 py-1">{zoom}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.min(400, zoom + 50))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto">
        <div className="p-4 space-y-6" style={{ minWidth: timelineWidth + 100 }}>
          <div className="relative" style={{ height: 40 }}>
            <div
              className="absolute top-0 bg-muted border-b pb-2"
              style={{ width: timelineWidth }}
            >
              {Array.from({ length: Math.ceil(maxEnd / 10) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: i * 10 * pxPerSec }}
                >
                  {i * 10}s
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative bg-primary/10 border rounded"
            style={{ height: 200, width: timelineWidth }}
            onClick={handlePlayheadClick}
          >
            {segmentsByTrack.map((segment) => (
              <div
                key={segment.id}
                className="absolute bg-blue-200 border border-blue-400 opacity-70 hover:opacity-100 cursor-pointer"
                style={{
                  left: segment.start * pxPerSec,
                  width: Math.max(2, (segment.end - segment.start) * pxPerSec),
                  height: 30,
                  top: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectEntity('Segment', segment.id);
                }}
                title={segment.name}
              >
                <div className="text-xs px-1 truncate">{segment.name}</div>
              </div>
            ))}

            <div
              className="absolute w-0.5 bg-red-500 pointer-events-none"
              style={{
                left: playheadTime * pxPerSec,
                height: '100%',
                top: 0,
              }}
            />
          </div>

          {Object.entries(cuesByType).map(([type, cues]) => (
            <div key={type}>
              <div className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
                {type} Cues
              </div>
              <div
                className="relative bg-muted border rounded"
                style={{ height: 80, width: timelineWidth }}
                onClick={handlePlayheadClick}
              >
                {cues.map((cue) => {
                  const computed =
                    cue.type === 'audio' && !cue.end && cue.mediaFile
                      ? (() => {
                          const media = project.media.find(
                            (m) => m.fileName === cue.mediaFile
                          );
                          return media?.durationSec
                            ? cue.start + media.durationSec
                            : undefined;
                        })()
                      : undefined;

                  const end = cue.end || computed;

                  return end ? (
                    <div
                      key={cue.id}
                      className="absolute bg-green-200 border border-green-400 opacity-70 hover:opacity-100 cursor-pointer text-xs overflow-hidden"
                      style={{
                        left: cue.start * pxPerSec,
                        width: Math.max(
                          2,
                          (end - cue.start) * pxPerSec
                        ),
                        height: 30,
                        top: 10,
                        borderStyle: computed ? 'dashed' : 'solid',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectEntity('Cue', cue.id);
                      }}
                      title={cue.name}
                    >
                      <div className="px-1 truncate">{cue.name}</div>
                    </div>
                  ) : (
                    <div
                      key={cue.id}
                      className="absolute w-1 bg-orange-400 hover:bg-orange-500 cursor-pointer"
                      style={{
                        left: cue.start * pxPerSec,
                        height: '100%',
                        top: 0,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectEntity('Cue', cue.id);
                      }}
                      title={cue.name}
                    />
                  );
                })}

                <div
                  className="absolute w-0.5 bg-red-500 pointer-events-none"
                  style={{
                    left: playheadTime * pxPerSec,
                    height: '100%',
                    top: 0,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Playhead: {playheadTime.toFixed(1)}s
      </div>
    </div>
  );
}
