'use client';

import { useStore } from '@/lib/store';
import { DashboardTab } from './tabs/DashboardTab';
import { AssetsTab } from './tabs/AssetsTab';
import { MediaTab } from './tabs/MediaTab';
import { TimelineTab } from './tabs/TimelineTab';
import { ChecksTab } from './tabs/ChecksTab';
import { JSONPreviewTab } from './tabs/JSONPreviewTab';
import { SnapshotsTab } from './tabs/SnapshotsTab';
import { DevicesTab } from './tabs/DevicesTab';

export function TabsPanel() {
  const { activeTab } = useStore();

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      {activeTab === 'Dashboard' && <DashboardTab />}
      {activeTab === 'Assets' && <AssetsTab />}
      {activeTab === 'Media' && <MediaTab />}
      {activeTab === 'Timeline' && <TimelineTab />}
      {activeTab === 'Checks' && <ChecksTab />}
      {activeTab === 'Devices' && <DevicesTab />}
      {activeTab === 'JSON Preview' && <JSONPreviewTab />}
      {activeTab === 'Snapshots' && <SnapshotsTab />}
    </div>
  );
}
