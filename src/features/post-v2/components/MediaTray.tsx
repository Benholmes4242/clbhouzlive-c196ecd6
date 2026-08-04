// MediaTray - 46px filmstrip thumbnails with long-press drag reorder.
// Enforces MAX_MEDIA=10 with a soft toast when exceeded.

import { useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { MAX_MEDIA, type StageMediaItem } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';
import { CT_DARK } from '@/features/_shared/composerTokens';

interface Props {
  media: StageMediaItem[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
  onReorder: (from: number, to: number) => void;
  onAddFiles: (files: File[]) => void | Promise<void>;
}

const TILE = 46;
const LONG_PRESS_MS = 350;

export default function MediaTray({ media, activeIndex, onSelect, onRemove, onReorder, onAddFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleAdd = () => inputRef.current?.click();
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (media.length + files.length > MAX_MEDIA) {
      toast('Posts carry up to 10 photos or clips.');
    }
    await onAddFiles(files);
    e.target.value = '';
  };

  const startLongPress = (i: number) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setDraggingIndex(i);
      dragFrom.current = i;
    }, LONG_PRESS_MS);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div style={{ padding: 0, background: CT_DARK.bg, display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
      <button
        onClick={handleAdd}
        style={{
          flexShrink: 0,
          width: TILE,
          height: TILE,
          borderRadius: 10,
          border: `1px dashed ${CT_DARK.dim}`,
          background: CT_DARK.surface,
          color: CT_DARK.ink,
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >+</button>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
      {media.map((m, i) => {
        const active = i === activeIndex;
        const isDragging = draggingIndex === i;
        return (
          <div
            key={m.id}
            draggable={draggingIndex === i}
            onDragStart={() => { dragFrom.current = i; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null && dragFrom.current !== i) onReorder(dragFrom.current, i);
              dragFrom.current = null;
              setDraggingIndex(null);
            }}
            onDragEnd={() => { dragFrom.current = null; setDraggingIndex(null); }}
            onMouseDown={() => startLongPress(i)}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={() => startLongPress(i)}
            onTouchEnd={clearLongPress}
            onClick={() => onSelect(i)}
            style={{
              position: 'relative',
              flexShrink: 0,
              width: TILE,
              height: TILE,
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: active ? `0 0 0 2px ${CT_DARK.amber}` : `0 0 0 1px ${CT_DARK.line}`,
              cursor: isDragging ? 'grabbing' : 'grab',
              background: CT_DARK.surface,
              opacity: isDragging ? 0.7 : 1,
            }}
          >
            {m.type === 'video' ? (
              <video src={m.previewUrl} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <CroppedImage item={m} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              aria-label="Remove"
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 0,
                fontSize: 11,
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >×</button>
          </div>
        );
      })}
      <div style={{ marginLeft: 'auto', color: CT_DARK.mute, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{media.length}/{MAX_MEDIA}</div>
    </div>
  );
}
