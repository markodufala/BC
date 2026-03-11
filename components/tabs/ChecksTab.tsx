'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import {
  CircleAlert as AlertCircle,
  TriangleAlert as AlertTriangle,
  Info,
  Copy,
  Download,
} from 'lucide-react';
import { computeMilestones, getNextFixes } from '@/lib/ux';
import { useToast } from '@/hooks/use-toast';

export function ChecksTab() {
  const {
    project,
    runChecks,
    checksRunning,
    checksProgress,
    setActiveTab,
    selectEntity,
  } = useStore();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const { toast } = useToast();

  if (!project) return null;

  const validation = project.lastValidation;

  const milestones = useMemo(
    () => computeMilestones(validation, project),
    [validation, project],
  );

  const nextFixes = useMemo(() => getNextFixes(validation), [validation]);

  useEffect(() => {
    if (!validation) return;
    if (validation.summary.errors !== 0) return;

    const key = `perf-editor-zero-errors-${project.id}`;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(key)) return;

    window.localStorage.setItem(key, '1');
    toast({
      title: 'Nice, archive-ready.',
      description: 'All checks passed with 0 errors.',
    });
  }, [validation, project?.id, toast]);

  const filteredItems = validation?.items.filter((item) => {
    const severityMatch = filterSeverity === 'all' || item.severity === filterSeverity;
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const searchMatch = item.message.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase());
    return severityMatch && categoryMatch && searchMatch;
  }) || [];

  const categories = validation?.categories ? Object.keys(validation.categories) : [];

  const handleFixClick = (itemId: string) => {
    if (!validation) return;
    const item = validation.items.find((i) => i.id === itemId);
    if (!item) return;

    // Mirror ProblemsPanel navigation so behavior is consistent.
    if (item.entityType === 'Asset') {
      setActiveTab('Assets');
      selectEntity('Asset', item.entityId || null);
    } else if (item.entityType === 'Segment') {
      setActiveTab('Timeline');
      selectEntity('Segment', item.entityId || null);
    } else if (item.entityType === 'Cue') {
      setActiveTab('Timeline');
      selectEntity('Cue', item.entityId || null);
    } else if (item.entityType === 'Device') {
      setActiveTab('Devices');
      selectEntity('Device', item.entityId || null);
    } else if (item.path?.includes('/media')) {
      setActiveTab('Media');
      if (item.entityType === 'MediaItem') {
        selectEntity('MediaItem', item.entityId || null);
      } else {
        selectEntity(null, null);
      }
    } else {
      setActiveTab('Checks');
      selectEntity(null, null);
    }
  };

  const handleExportReport = () => {
    if (!validation) return;
    const json = JSON.stringify(validation, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPath = (path?: string) => {
    if (path) navigator.clipboard.writeText(path);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Validation Checks</h2>
          {validation && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${
                  milestones.fixityReady
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {milestones.fixityReady ? 'Fixity ready' : 'Needs fixity'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${
                  milestones.interpretabilityReady
                    ? 'border-sky-500 text-sky-400'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {milestones.interpretabilityReady
                  ? 'Interpretability ready'
                  : 'Needs duration'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${
                  milestones.timelineConsistent
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {milestones.timelineConsistent
                  ? 'Timeline consistent'
                  : 'Needs timeline'}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport} disabled={!validation}>
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
          <Button onClick={runChecks}>
            Run Checks
            <span className="ml-2 text-[10px] opacity-70">
              (Ctrl/Cmd+Enter)
            </span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full bg-primary transition-[width] ${
              checksRunning ? 'duration-150' : 'duration-300'
            }`}
            style={{ width: `${checksProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {checksRunning
              ? 'Running checks…'
              : validation
                ? 'Checks complete'
                : 'No checks run yet'}
          </span>
          {validation && (
            <span className="uppercase tracking-wide text-[10px]">
              Stamp: {milestones.stampLabel}
            </span>
          )}
        </div>
        {validation && (
          <div className="grid grid-cols-5 gap-2 text-[10px]">
            {['Schema', 'References', 'Timeline', 'Consistency', 'Media'].map(
              (label, index) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/70 transition-[width] duration-300"
                      style={{
                        width: validation
                          ? `${Math.min(
                              100,
                              checksProgress + (index + 1) * 5,
                            )}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {validation ? (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {validation.summary.errors}
                </span>
              </div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {validation.summary.warnings}
                </span>
              </div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {validation.summary.info}
                </span>
              </div>
              <div className="text-sm text-blue-600">Info</div>
            </div>
          </div>

          {nextFixes.length > 0 && (
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Next fixes
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextFixes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleFixClick(item.id)}
                      className="text-xs px-2 py-1 rounded-full border border-border/60 hover:border-primary/60 hover:bg-muted transition-colors"
                    >
                      <span className="font-mono mr-1">{item.code}</span>
                      {item.message}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFixClick(nextFixes[0].id)}
              >
                Fix next
              </Button>
            </div>
          )}

          <div className="mb-4 space-y-3">
            <div className="flex gap-2 text-sm">
              {['all', 'error', 'warning', 'info'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev as any)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filterSeverity === sev
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium">Severity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Message</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Path</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      {validation.items.length === 0 ? 'All checks passed!' : 'No matching issues'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/60">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {item.severity === 'error' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : item.severity === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="text-xs">{item.severity}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">{item.code}</td>
                      <td className="px-3 py-2 text-xs">{item.message}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {item.path && (
                          <button
                            onClick={() => handleCopyPath(item.path)}
                            title="Copy path"
                            className="hover:bg-muted p-1 rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div>
              Last run: {new Date(validation.ranAt).toLocaleString()}
            </div>
            <div>
              Errors {validation.summary.errors} · Warnings{' '}
              {validation.summary.warnings} · Info {validation.summary.info}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No validation has been run yet. Click "Run Checks" to start.
        </div>
      )}
    </div>
  );
}
