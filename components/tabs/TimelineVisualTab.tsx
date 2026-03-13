'use client';

import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function TimelineVisualTab() {
  const { project, playheadTime, setPlayheadTime, selectEntity, updateSegment } =
    useStore();
  const [zoom, setZoom] = useState(100);
  const [draggingSegmentId, setDraggingSegmentId] = useState<string | null>(
    null
  );
  const [dragOffsetSec, setDragOffsetSec] = useState(0);
  const [currentDragStart, setCurrentDragStart] = useState<number | null>(null);
  const [resizingSegmentId, setResizingSegmentId] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);

  const timelineRef = useRef<HTMLDivElement | null>(null);

  if (!project) return null;

  const isReadOnly = project.mode === 'archivist';

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

  const handlePlayheadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setPlayheadTime(x / pxPerSec);
  };

  const handleSegmentMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    segmentId: string
  ) => {
    if (isReadOnly || resizingSegmentId) return;
    e.stopPropagation();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const segment = project.timeline.segments.find((s) => s.id === segmentId);
    if (!segment) return;
    const offsetSec = clickX / pxPerSec - segment.start;
    setDraggingSegmentId(segmentId);
    setDragOffsetSec(offsetSec);
    setCurrentDragStart(segment.start);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingSegmentId && !resizingSegmentId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (draggingSegmentId) {
      const segment = project.timeline.segments.find(
        (s) => s.id === draggingSegmentId
      );
      if (!segment) return;
      const newStart = Math.max(0, x / pxPerSec - dragOffsetSec);
      setCurrentDragStart(newStart);
    } else if (resizingSegmentId && resizeEdge) {
      const segment = project.timeline.segments.find(
        (s) => s.id === resizingSegmentId
      );
      if (!segment) return;
      const timeAtCursor = Math.max(0, x / pxPerSec);
      if (resizeEdge === 'start') {
        const clamped = Math.min(timeAtCursor, segment.end - 0.1);
        updateSegment(segment.id, { start: clamped });
      } else {
        const clamped = Math.max(timeAtCursor, segment.start + 0.1);
        updateSegment(segment.id, { end: clamped });
      }
    }
  };

  const handleTimelineMouseUp = () => {
    if (draggingSegmentId && currentDragStart !== null) {
      const segment = project.timeline.segments.find(
        (s) => s.id === draggingSegmentId
      );
      if (segment) {
        const duration = segment.end - segment.start;
        const newStart = Math.max(0, currentDragStart);
        const newEnd = newStart + duration;
        updateSegment(segment.id, { start: newStart, end: newEnd });
      }
    }
    setDraggingSegmentId(null);
    setCurrentDragStart(null);
    setResizingSegmentId(null);
    setResizeEdge(null);
  };

  useEffect(() => {
    const handleWindowMouseUp = () => {
      handleTimelineMouseUp();
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Timeline Visualization</h3>
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
            ref={timelineRef}
            onClick={handlePlayheadClick}
            onMouseMove={handleTimelineMouseMove}
          >
            {segmentsByTrack.map((segment) => {
              const isDragging = draggingSegmentId === segment.id;
              const start =
                isDragging && currentDragStart !== null
                  ? currentDragStart
                  : segment.start;
              const width = Math.max(2, (segment.end - segment.start) * pxPerSec);

              return (
                <div
                  key={segment.id}
                  className="absolute"
                  style={{
                    left: start * pxPerSec,
                    width,
                    height: 30,
                    top: 10,
                  }}
                >
                  {!isReadOnly && (
                    <>
                      <div
                        className="absolute left-0 top-0 h-full w-1 bg-blue-600 cursor-ew-resize opacity-0 hover:opacity-100"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingSegmentId(segment.id);
                          setResizeEdge('start');
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 h-full w-1 bg-blue-600 cursor-ew-resize opacity-0 hover:opacity-100"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingSegmentId(segment.id);
                          setResizeEdge('end');
                        }}
                      />
                    </>
                  )}
                  <div
                    className={`h-full bg-blue-200 border border-blue-400 opacity-70 hover:opacity-100 ${
                      isReadOnly ? 'cursor-pointer' : 'cursor-move'
                    }`}
                    onMouseDown={(e) => handleSegmentMouseDown(e, segment.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectEntity('Segment', segment.id);
                    }}
                    title={segment.name}
                  >
                    <div className="text-xs px-1 truncate">{segment.name}</div>
                  </div>
                </div>
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

          {/* cues visualization removed to focus on time segments */}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Playhead: {playheadTime.toFixed(1)}s
      </div>
    </div>
  );
}
