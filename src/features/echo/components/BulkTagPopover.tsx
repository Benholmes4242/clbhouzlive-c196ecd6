/**
 * BulkTagPopover - Popover for bulk tag operations
 * Allows adding or removing tags from multiple conversations at once
 */

import React, { useState } from 'react';
import { TagInput } from '@/features/echo/components/tags/TagInput';
import { cn } from '@/lib/utils';

type Props = {
  onAdd: (tags: string[]) => Promise<void> | void;
  onRemove: (tags: string[]) => Promise<void> | void;
  onClose: () => void;
};

export function BulkTagPopover({ onAdd, onRemove, onClose }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState<'add' | 'remove' | null>(null);

  return (
    <div
      role="dialog"
      aria-label="Bulk tag editor"
      className="absolute z-[1100] w-[340px] rounded-xl border backdrop-blur-xl shadow-2xl"
      style={{
        background: 'rgba(24,24,24,0.92)',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="p-4">
        <div className="text-body-md font-medium mb-3 text-white/90">
          Bulk tag selected conversations
        </div>

        <TagInput 
          value={tags} 
          onChange={setTags} 
          placeholder="Type tag, press Enter…" 
          autoFocus 
        />

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/10 text-body-md text-white/70 hover:text-white/90 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={tags.length === 0 || !!busy}
            onClick={async () => { 
              setBusy('remove'); 
              await onRemove(tags); 
              setBusy(null); 
              onClose(); 
            }}
            className={cn(
              "px-3 py-1.5 rounded-md text-body-md border border-white/10 hover:bg-white/10 text-white/70 hover:text-white/90 transition-colors",
              (tags.length === 0 || busy) && "opacity-40 cursor-not-allowed",
              busy === 'remove' && "opacity-60"
            )}
          >
            Remove
          </button>
          <button
            disabled={tags.length === 0 || !!busy}
            onClick={async () => { 
              setBusy('add'); 
              await onAdd(tags); 
              setBusy(null); 
              onClose(); 
            }}
            className={cn(
              "px-3 py-1.5 rounded-md text-body-md bg-white/10 hover:bg-white/14 border border-white/10 text-white/90 transition-colors",
              (tags.length === 0 || busy) && "opacity-40 cursor-not-allowed",
              busy === 'add' && "opacity-60"
            )}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
