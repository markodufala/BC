'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Segment, Cue } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Trash2 } from 'lucide-react';
import { TimelineVisualTab } from './TimelineVisualTab';

export function TimelineTab() {
  const {
    project,
    addSegment,
    deleteSegment,
    addCue,
    deleteCue,
    selectEntity,
    timelineSubTab,
    setTimelineSubTab,
  } = useStore();

  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [cueDialogOpen, setCueDialogOpen] = useState(false);

  const [newSegment, setNewSegment] = useState({
    name: '',
    start: 0,
    end: 0,
  });

  const [newCue, setNewCue] = useState({
    name: '',
    type: 'audio' as Cue['type'],
    start: 0,
    end: undefined as number | undefined,
    targetAssetId: undefined as string | undefined,
  });

  if (!project) return null;

  const isReadOnly = project.mode === 'archivist';

  const handleAddSegment = () => {
    if (newSegment.name.trim()) {
      addSegment(newSegment);
      setNewSegment({ name: '', start: 0, end: 0 });
      setSegmentDialogOpen(false);
    }
  };

  const handleAddCue = () => {
    if (newCue.name.trim()) {
      addCue(newCue);
      setNewCue({
        name: '',
        type: 'audio',
        start: 0,
        end: undefined,
        targetAssetId: undefined,
      });
      setCueDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTimelineSubTab('visual')}
          className={`px-4 py-2 ${
            timelineSubTab === 'visual'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setTimelineSubTab('segments')}
          className={`px-4 py-2 ${
            timelineSubTab === 'segments'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          Time Segments
        </button>
      </div>

      {timelineSubTab === 'visual' && <TimelineVisualTab />}

      {timelineSubTab === 'segments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Time Segments</h3>
            {!isReadOnly && (
              <Dialog
                open={segmentDialogOpen}
                onOpenChange={setSegmentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Add Time Segment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Time Segment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Segment name"
                      value={newSegment.name}
                      onChange={(e) =>
                        setNewSegment({ ...newSegment, name: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Start time (sec)"
                      step="0.1"
                      value={newSegment.start}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          start: parseFloat(e.target.value),
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="End time (sec)"
                      step="0.1"
                      value={newSegment.end}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          end: parseFloat(e.target.value),
                        })
                      }
                    />
                    <Button onClick={handleAddSegment} className="w-full">
                      Add
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Start
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    End
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.timeline.segments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No segments yet
                    </td>
                  </tr>
                ) : (
                  project.timeline.segments.map((segment) => (
                    <tr
                      key={segment.id}
                      className="border-t hover:bg-muted/60 cursor-pointer"
                      onClick={() => selectEntity('Segment', segment.id)}
                    >
                      <td className="px-4 py-2">{segment.name}</td>
                      <td className="px-4 py-2">{segment.start.toFixed(1)}</td>
                      <td className="px-4 py-2">{segment.end.toFixed(1)}</td>
                      <td className="px-4 py-2">
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this segment?')) {
                                deleteSegment(segment.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
