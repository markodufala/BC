'use client';

import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  Box,
  Film,
  Clock,
  CheckCircle,
  FileJson,
  Camera,
  Cpu,
} from 'lucide-react';

const treeItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Assets', label: 'Assets', icon: Box },
  { id: 'Media', label: 'Media', icon: Film },
  { id: 'Timeline', label: 'Timeline', icon: Clock },
  { id: 'Checks', label: 'Checks', icon: CheckCircle },
  { id: 'Devices', label: 'Devices', icon: Cpu },
  { id: 'JSON Preview', label: 'JSON Preview', icon: FileJson },
  { id: 'Snapshots', label: 'Snapshots', icon: Camera },
];

export function ProjectTree() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="p-2">
      <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
        PROJECT
      </div>
      <div className="space-y-1">
        {treeItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
