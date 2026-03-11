'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
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
import type { Device } from '@/lib/types';

export function DevicesTab() {
  const { project, addDevice, deleteDevice, selectEntity } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [draft, setDraft] = useState<Omit<Device, 'id'>>({
    category: 'lighting_fixture',
    manufacturer: '',
    model: '',
    instance: {},
    control: {
      protocol: 'DMX512',
      universe: 1,
      address: 1,
      dmx_channels: 1,
      channel_map: [],
    },
  });

  if (!project) return null;
  const isReadOnly = project.mode === 'archivist';

  const devices = project.devices?.devices ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      return (
        d.id.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
  }, [devices, search]);

  const handleAdd = () => {
    if (isReadOnly) return;
    if (!draft.manufacturer.trim() || !draft.model.trim()) return;
    addDevice({
      ...draft,
      manufacturer: draft.manufacturer.trim(),
      model: draft.model.trim(),
      instance: draft.instance ?? {},
    });
    setDialogOpen(false);
    setDraft({
      category: 'lighting_fixture',
      manufacturer: '',
      model: '',
      instance: {},
      control: {
        protocol: 'DMX512',
        universe: 1,
        address: 1,
        dmx_channels: 1,
        channel_map: [],
      },
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (confirm('Delete this device?')) {
      deleteDevice(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Devices</h2>
        {!isReadOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Device</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Device</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Category</label>
                  <Select
                    value={draft.category}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        category: value as Device['category'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lighting_fixture">
                        lighting_fixture
                      </SelectItem>
                      <SelectItem value="projection_system">
                        projection_system
                      </SelectItem>
                      <SelectItem value="audio_system">audio_system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block">
                    Manufacturer
                  </label>
                  <Input
                    value={draft.manufacturer}
                    onChange={(e) =>
                      setDraft({ ...draft, manufacturer: e.target.value })
                    }
                    placeholder="e.g. ETC"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block">Model</label>
                  <Input
                    value={draft.model}
                    onChange={(e) =>
                      setDraft({ ...draft, model: e.target.value })
                    }
                    placeholder="e.g. Source Four LED"
                  />
                </div>

                <Button onClick={handleAdd} className="w-full">
                  Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Input
        placeholder="Search devices…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Category
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Manufacturer
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium">Model</th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No devices yet
                </td>
              </tr>
            ) : (
              filtered.map((device) => (
                <tr
                  key={device.id}
                  className="border-t hover:bg-muted/60 cursor-pointer"
                  onClick={() => selectEntity('Device', device.id)}
                >
                  <td className="px-4 py-2 font-mono text-xs">{device.id}</td>
                  <td className="px-4 py-2 text-sm">{device.category}</td>
                  <td className="px-4 py-2 text-sm">{device.manufacturer}</td>
                  <td className="px-4 py-2 text-sm">{device.model}</td>
                  <td className="px-4 py-2">
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(device.id);
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
  );
}

