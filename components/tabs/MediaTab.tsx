'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';

export function MediaTab() {
  const { project, addMedia, deleteMedia, selectEntity } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!project) return null;

  const isReadOnly = project.mode === 'archivist';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let kind: 'audio' | 'image' | 'video' | 'mocap' = 'mocap';
      if (file.type.startsWith('audio/')) kind = 'audio';
      else if (file.type.startsWith('image/')) kind = 'image';
      else if (file.type.startsWith('video/')) kind = 'video';

      addMedia({
        fileName: file.name,
        kind,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUsedByCount = (fileName: string) => {
    return project.assets.filter((a) => a.media_ref?.file === fileName).length;
  };

  const handleDelete = (id: string, fileName: string) => {
    const usedBy = getUsedByCount(fileName);
    const confirmMsg =
      usedBy > 0
        ? `This media is referenced by ${usedBy} asset(s). Delete anyway?`
        : 'Delete this media?';

    if (confirm(confirmMsg)) {
      deleteMedia(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Media</h2>
        {!isReadOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Add Media Metadata
            </Button>
          </>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">
                File Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium">Kind</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Size</th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Used By
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {project.media.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No media yet
                </td>
              </tr>
            ) : (
              project.media.map((media) => (
                <tr
                  key={media.id}
                  className="border-t hover:bg-muted/60 cursor-pointer"
                  onClick={() => selectEntity('MediaItem', media.id)}
                >
                  <td className="px-4 py-2">{media.fileName}</td>
                  <td className="px-4 py-2">{media.kind}</td>
                  <td className="px-4 py-2">
                    {(media.size / 1024).toFixed(2)} KB
                  </td>
                  <td className="px-4 py-2">
                    {getUsedByCount(media.fileName)}
                  </td>
                  <td className="px-4 py-2">
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(media.id, media.fileName);
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
