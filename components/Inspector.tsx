'use client';

import { useStore } from '@/lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function Inspector() {
  const {
    project,
    selectedEntityId,
    selectedEntityType,
    updateAsset,
    updateMeta,
    toggleMode,
    updateMedia,
    updateCue,
    updateDevice,
  } = useStore();

  if (!project) return null;

  const isReadOnly = project.mode === 'archivist';

  if (!selectedEntityId || !selectedEntityType) {
    return (
      <div className="p-4">
        <h3 className="font-semibold mb-4">Inspector</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Mode</label>
            <Button onClick={toggleMode} className="w-full" size="sm">
              {project.mode === 'creator'
                ? 'Switch to Archivist'
                : 'Switch to Creator'}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={project.meta.title}
              onChange={(e) => updateMeta({ title: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              value={project.meta.description}
              onChange={(e) => updateMeta({ description: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Authors (comma-separated)
            </label>
            <Input
              value={project.meta.authors.join(', ')}
              onChange={(e) =>
                updateMeta({
                  authors: e.target.value
                    .split(',')
                    .map((a) => a.trim())
                    .filter((a) => a),
                })
              }
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date</label>
            <Input
              value={project.meta.date || ''}
              onChange={(e) => updateMeta({ date: e.target.value })}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Tags (comma-separated)
            </label>
            <Input
              value={project.meta.tags?.join(', ') || ''}
              onChange={(e) =>
                updateMeta({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t),
                })
              }
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">FPS</label>
            <Input
              type="number"
              value={project.meta.fps || ''}
              onChange={(e) =>
                updateMeta({
                  fps: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectedEntityType === 'Asset') {
    const asset = project.assets.find((a) => a.id === selectedEntityId);
    if (!asset) return null;

    const availableMedia = project.media.filter((m) =>
      asset.media_ref ? m.kind === asset.media_ref.kind : true
    );

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-4">Asset Inspector</h3>

        <div>
          <label className="text-sm font-medium mb-2 block">Name</label>
          <Input
            value={asset.name}
            onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select
            value={asset.type}
            onValueChange={(value) =>
              updateAsset(asset.id, { type: value as any })
            }
            disabled={isReadOnly}
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
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Transform</label>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Position</div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={asset.transform.position.x}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        position: {
                          ...asset.transform.position,
                          x: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="X"
                />
                <Input
                  type="number"
                  value={asset.transform.position.y}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        position: {
                          ...asset.transform.position,
                          y: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Y"
                />
                <Input
                  type="number"
                  value={asset.transform.position.z}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        position: {
                          ...asset.transform.position,
                          z: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Z"
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Rotation</div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={asset.transform.rotation.x}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        rotation: {
                          ...asset.transform.rotation,
                          x: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="X"
                />
                <Input
                  type="number"
                  value={asset.transform.rotation.y}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        rotation: {
                          ...asset.transform.rotation,
                          y: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Y"
                />
                <Input
                  type="number"
                  value={asset.transform.rotation.z}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        rotation: {
                          ...asset.transform.rotation,
                          z: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Z"
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Scale</div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={asset.transform.scale.x}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        scale: {
                          ...asset.transform.scale,
                          x: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="X"
                />
                <Input
                  type="number"
                  value={asset.transform.scale.y}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        scale: {
                          ...asset.transform.scale,
                          y: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Y"
                />
                <Input
                  type="number"
                  value={asset.transform.scale.z}
                  onChange={(e) =>
                    updateAsset(asset.id, {
                      transform: {
                        ...asset.transform,
                        scale: {
                          ...asset.transform.scale,
                          z: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  disabled={isReadOnly}
                  placeholder="Z"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Relationships
          </label>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Parent (hierarchy)
              </div>
              <Select
                value={asset.relationships.parentId || 'none'}
                onValueChange={(value) =>
                  updateAsset(asset.id, {
                    relationships: {
                      ...asset.relationships,
                      parentId: value === 'none' ? undefined : value,
                    },
                  })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Parent Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {project.assets
                    .filter((a) => a.id !== asset.id)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Mount (physical support / rig)
              </div>
              <Select
                value={asset.relationships.mountId || 'none'}
                onValueChange={(value) =>
                  updateAsset(asset.id, {
                    relationships: {
                      ...asset.relationships,
                      mountId: value === 'none' ? undefined : value,
                    },
                  })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mount Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {project.assets
                    .filter((a) => a.id !== asset.id)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Follow target (what this tracks)
              </div>
              <Select
                value={asset.relationships.followTargetId || 'none'}
                onValueChange={(value) =>
                  updateAsset(asset.id, {
                    relationships: {
                      ...asset.relationships,
                      followTargetId: value === 'none' ? undefined : value,
                    },
                  })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Follow Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {project.assets
                    .filter((a) => a.id !== asset.id)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Media Ref</label>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Kind (audio / image / video / mocap)
              </div>
              <Select
                value={asset.media_ref?.kind || 'none'}
                onValueChange={(value) =>
                  updateAsset(asset.id, {
                    media_ref:
                      value === 'none'
                        ? undefined
                        : {
                            kind: value as any,
                            file: asset.media_ref?.file || '',
                            start_time: asset.media_ref?.start_time || 0,
                          },
                  })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Media Kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="mocap">Mocap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {asset.media_ref && (
              <>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Media file (from Media tab)
                  </div>
                  <Select
                    value={asset.media_ref.file || 'none'}
                    onValueChange={(value) =>
                      updateAsset(asset.id, {
                        media_ref: {
                          ...asset.media_ref!,
                          file: value === 'none' ? '' : value,
                        },
                      })
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select file" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableMedia.map((m) => (
                        <SelectItem key={m.id} value={m.fileName}>
                          {m.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Start time (seconds, relative to timeline)
                  </div>
                  <Input
                    type="number"
                    placeholder="Start time"
                    value={asset.media_ref.start_time}
                    onChange={(e) =>
                      updateAsset(asset.id, {
                        media_ref: {
                          ...asset.media_ref!,
                          start_time: parseFloat(e.target.value),
                        },
                      })
                    }
                    disabled={isReadOnly}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedEntityType === 'MediaItem') {
    const media = project.media.find((m) => m.id === selectedEntityId);
    if (!media) return null;

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-4">Media Inspector</h3>

        <div>
          <label className="text-sm font-medium mb-2 block">File Name</label>
          <div className="text-sm text-muted-foreground">{media.fileName}</div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Kind</label>
          <div className="text-sm text-muted-foreground capitalize">
            {media.kind}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Duration (sec)
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={media.durationSec || ''}
            onChange={(e) =>
              updateMedia(media.id, {
                durationSec: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            disabled={isReadOnly}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Size</label>
          <div className="text-sm text-muted-foreground">
            {(media.size / 1024).toFixed(2)} KB
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Uploaded</label>
          <div className="text-sm text-muted-foreground">
            {new Date(media.uploadedAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  if (selectedEntityType === 'Device') {
    const device = project.devices?.devices?.find((d) => d.id === selectedEntityId);
    if (!device) return null;

    const control = (device.control ?? {}) as any;
    const isLighting = device.category === 'lighting_fixture';

    const universe =
      typeof control.universe === 'number' ? control.universe : 1;
    const address =
      typeof control.address === 'number' ? control.address : 1;
    const dmxChannels =
      typeof control.dmx_channels === 'number' ? control.dmx_channels : 1;

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-4">Device Inspector</h3>

        <div>
          <label className="text-sm font-medium mb-2 block">ID</label>
          <div className="text-xs font-mono text-muted-foreground">
            {device.id}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="text-sm text-muted-foreground">{device.category}</div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Manufacturer</label>
          <Input
            value={device.manufacturer}
            onChange={(e) => updateDevice(device.id, { manufacturer: e.target.value })}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Model</label>
          <Input
            value={device.model}
            onChange={(e) => updateDevice(device.id, { model: e.target.value })}
            disabled={isReadOnly}
          />
        </div>

        {isLighting && (
          <div className="space-y-3">
            <div className="text-sm font-medium">DMX Patch</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Universe</div>
                <Input
                  type="number"
                  min={1}
                  value={universe}
                  onChange={(e) =>
                    updateDevice(device.id, {
                      control: {
                        ...control,
                        protocol: 'DMX512',
                        universe: parseInt(e.target.value || '1', 10),
                      },
                    })
                  }
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Address</div>
                <Input
                  type="number"
                  min={1}
                  max={512}
                  value={address}
                  onChange={(e) =>
                    updateDevice(device.id, {
                      control: {
                        ...control,
                        protocol: 'DMX512',
                        address: parseInt(e.target.value || '1', 10),
                      },
                    })
                  }
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">DMX Channels</div>
                <Input
                  type="number"
                  min={1}
                  max={512}
                  value={dmxChannels}
                  onChange={(e) =>
                    updateDevice(device.id, {
                      control: {
                        ...control,
                        protocol: 'DMX512',
                        dmx_channels: parseInt(e.target.value || '1', 10),
                      },
                    })
                  }
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Instance (JSON)</label>
          <Textarea
            value={JSON.stringify(device.instance ?? {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateDevice(device.id, { instance: parsed });
              } catch {
                // ignore parse errors while typing
              }
            }}
            disabled={isReadOnly}
            className="font-mono text-xs min-h-40"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Control (JSON)</label>
          <Textarea
            value={JSON.stringify(device.control ?? {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateDevice(device.id, { control: parsed });
              } catch {
                // ignore parse errors while typing
              }
            }}
            disabled={isReadOnly}
            className="font-mono text-xs min-h-40"
          />
        </div>
      </div>
    );
  }

  if (selectedEntityType === 'Cue') {
    const cue = project.timeline.cues.find((c) => c.id === selectedEntityId);
    if (!cue) return null;

    const computedEnd =
      cue.type === 'audio' && !cue.end && cue.mediaFile
        ? (() => {
            const media = project.media.find((m) => m.fileName === cue.mediaFile);
            return media?.durationSec ? cue.start + media.durationSec : undefined;
          })()
        : undefined;

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-4">Cue Inspector</h3>

        <div>
          <label className="text-sm font-medium mb-2 block">Name</label>
          <Input
            value={cue.name}
            onChange={(e) => updateCue(cue.id, { name: e.target.value })}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select
            value={cue.type}
            onValueChange={(value) => updateCue(cue.id, { type: value as any })}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="projection">Projection</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="mocap">Mocap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Start (sec)</label>
          <Input
            type="number"
            step="0.1"
            value={cue.start}
            onChange={(e) =>
              updateCue(cue.id, { start: parseFloat(e.target.value) })
            }
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">End (sec)</label>
          <Input
            type="number"
            step="0.1"
            value={cue.end || ''}
            onChange={(e) =>
              updateCue(cue.id, {
                end: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            disabled={isReadOnly}
            placeholder="Optional"
          />
        </div>

        {computedEnd && (
          <div className="text-xs text-blue-600">
            Computed end: {computedEnd.toFixed(1)}s
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Media File (optional)
          </label>
          <Select
            value={cue.mediaFile || 'none'}
            onValueChange={(value) =>
              updateCue(cue.id, {
                mediaFile: value === 'none' ? undefined : value,
              })
            }
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {project.media.map((m) => (
                <SelectItem key={m.id} value={m.fileName}>
                  {m.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Target Asset (optional)
          </label>
          <Select
            value={cue.targetAssetId || 'none'}
            onValueChange={(value) =>
              updateCue(cue.id, {
                targetAssetId: value === 'none' ? undefined : value,
              })
            }
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {project.assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Inspector</h3>
      <div className="text-sm text-muted-foreground">
        Selected: {selectedEntityType} ({selectedEntityId})
      </div>
    </div>
  );
}
