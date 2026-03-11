'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Asset } from '@/lib/types';
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

export function AssetsTab() {
  const { project, addAsset, deleteAsset, selectEntity } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Geometry' as Asset['type'],
  });

  if (!project) return null;

  const isReadOnly = project.mode === 'archivist';

  const filteredAssets = project.assets.filter((asset) => {
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAdd = () => {
    if (newAsset.name.trim()) {
      addAsset({
        name: newAsset.name.trim(),
        type: newAsset.type,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        relationships: {},
      });
      setNewAsset({ name: '', type: 'Geometry' });
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assets</h2>
        {!isReadOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Asset name"
                  value={newAsset.name}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, name: e.target.value })
                  }
                />
                <Select
                  value={newAsset.type}
                  onValueChange={(value) =>
                    setNewAsset({ ...newAsset, type: value as Asset['type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geometry">Geometry</SelectItem>
                    <SelectItem value="Rigging">Rigging</SelectItem>
                    <SelectItem value="Performer">Performer</SelectItem>
                    <SelectItem value="Light">Light</SelectItem>
                    <SelectItem value="Projection">Projection</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="w-full">
                  Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Geometry">Geometry</SelectItem>
            <SelectItem value="Rigging">Rigging</SelectItem>
            <SelectItem value="Performer">Performer</SelectItem>
            <SelectItem value="Light">Light</SelectItem>
            <SelectItem value="Projection">Projection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No assets found
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-t hover:bg-muted/60 cursor-pointer"
                  onClick={() => selectEntity('Asset', asset.id)}
                >
                  <td className="px-4 py-2">{asset.name}</td>
                  <td className="px-4 py-2">{asset.type}</td>
                  <td className="px-4 py-2">
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this asset?')) {
                            deleteAsset(asset.id);
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
  );
}
