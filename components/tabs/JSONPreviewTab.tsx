'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import { generateDevicesJSON, generatePerformanceJSON, migrateProject, performanceJsonToProject } from '@/lib/validation';
import { Copy, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function JSONPreviewTab() {
  const { project, setProject } = useStore();
  const { toast } = useToast();
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingDevices, setIsImportingDevices] = useState(false);

  if (!project) return null;

  const performance = generatePerformanceJSON(project);
  const performanceText = JSON.stringify(performance, null, 2);

  const devices = generateDevicesJSON(project);
  const devicesText = JSON.stringify(devices, null, 2);

  const handleCopyPerformance = () => {
    navigator.clipboard.writeText(performanceText);
  };

  const handleDownloadPerformance = () => {
    const blob = new Blob([performanceText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'performance.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDevices = () => {
    navigator.clipboard.writeText(devicesText);
  };

  const handleDownloadDevices = () => {
    const blob = new Blob([devicesText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devices.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const parsed = JSON.parse(importText);
      // Allow either a raw Project-like object, a wrapper { project: {...} }, or an external performance.json.
      const candidate = parsed?.project ?? parsed;
      const looksLikePerformanceJson =
        candidate &&
        !candidate.schemaVersion &&
        Array.isArray(candidate.cues) &&
        Array.isArray(candidate.assets) &&
        candidate.meta &&
        candidate.space &&
        candidate.synchronization;

      const baseProject = looksLikePerformanceJson
        ? performanceJsonToProject(candidate, project)
        : candidate;

      const migrated = migrateProject(baseProject);
      // Preserve current id if the pasted JSON is missing one.
      if (!migrated.id && project.id) {
        migrated.id = project.id;
      }
      setProject(migrated);
      toast({
        title: 'Import successful',
        description: 'Project JSON imported and timeline rebuilt.',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to import project JSON', err);
      toast({
        title: 'Import failed',
        description: 'Could not parse or migrate the provided JSON.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportDevices = () => {
    if (!importText.trim()) return;
    setIsImportingDevices(true);
    try {
      const parsed = JSON.parse(importText);
      // Accept either { devices: [...] } or a raw devices array.
      const devicesBlock = Array.isArray(parsed)
        ? { devices: parsed }
        : parsed?.devices
          ? { devices: parsed.devices }
          : null;

      if (!devicesBlock || !Array.isArray(devicesBlock.devices)) {
        throw new Error('No devices array found');
      }

      setProject({
        ...project,
        devices: { devices: devicesBlock.devices },
      });

      toast({
        title: 'Devices imported',
        description: 'devices.json has been applied to this project.',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to import devices JSON', err);
      toast({
        title: 'Import failed',
        description: 'Could not parse devices.json (expecting { "devices": [...] }).',
      });
    } finally {
      setIsImportingDevices(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">JSON Preview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
            <div className="text-sm font-semibold">performance.json</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyPerformance}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPerformance}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="bg-muted p-4 overflow-auto max-h-[calc(50vh-180px)]">
            <pre className="text-xs">{performanceText}</pre>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
            <div className="text-sm font-semibold">devices.json</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyDevices}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDevices}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="bg-muted p-4 overflow-auto max-h-[calc(50vh-180px)]">
            <pre className="text-xs">{devicesText}</pre>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Import full project JSON</span>
            <span className="text-xs text-muted-foreground">
              Paste a project JSON in the same shape (or wrapped as {"{ project: {{...}} }"}) to overwrite this project.
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleImport}
              disabled={isImporting || isImportingDevices || !importText.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing…' : 'Import JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportDevices}
              disabled={isImporting || isImportingDevices || !importText.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImportingDevices ? 'Importing…' : 'Import devices.json'}
            </Button>
          </div>
        </div>
        <textarea
          className="w-full min-h-[180px] max-h-[320px] p-3 text-xs font-mono bg-background outline-none resize-y"
          placeholder='Paste your full project JSON (or devices.json as { "devices": [...] }).'
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
      </div>
    </div>
  );
}
