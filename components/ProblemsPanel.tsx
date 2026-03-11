'use client';

import { useStore } from '@/lib/store';
import { Button } from './ui/button';
import { X, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Info } from 'lucide-react';

export function ProblemsPanel() {
  const { project, toggleProblemsPanel, setActiveTab, selectEntity } =
    useStore();

  if (!project) return null;

  const validation = project.lastValidation;

  const handleItemClick = (item: any) => {
    if (item.entityType === 'Asset') {
      setActiveTab('Assets');
      selectEntity('Asset', item.entityId);
    } else if (item.entityType === 'Segment') {
      setActiveTab('Timeline');
      selectEntity('Segment', item.entityId);
    } else if (item.entityType === 'Cue') {
      setActiveTab('Timeline');
      selectEntity('Cue', item.entityId);
    } else if (item.entityType === 'Device') {
      setActiveTab('Devices');
      selectEntity('Device', item.entityId);
    } else if (item.path?.includes('/media')) {
      setActiveTab('Media');
      if (item.entityType === 'MediaItem') {
        selectEntity('MediaItem', item.entityId);
      }
    } else {
      setActiveTab('Checks');
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Problems</h3>
          {validation && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                {validation.summary.errors}
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {validation.summary.warnings}
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <Info className="h-4 w-4" />
                {validation.summary.info}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleProblemsPanel}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!validation ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No validation results yet. Run checks to see problems.
          </div>
        ) : validation.items.length === 0 ? (
          <div className="text-center py-8 text-green-600 text-sm">
            No problems found!
          </div>
        ) : (
          <div className="space-y-1">
            {validation.items.map((item, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                className={`p-2 rounded text-sm cursor-pointer hover:bg-muted ${
                  item.severity === 'error'
                    ? 'border-l-2 border-red-500'
                    : item.severity === 'warning'
                      ? 'border-l-2 border-yellow-500'
                      : 'border-l-2 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  {item.severity === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : item.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div>{item.message}</div>
                    {item.path && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.path}
                      </div>
                    )}
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
