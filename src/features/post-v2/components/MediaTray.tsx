// MediaTray - add-tile + thumbnails. Reorder via HTML5 drag.
// Enforces MAX_MEDIA=10 with a soft toast when exceeded.

import { useRef } from 'react';
import { toast } from '@/lib/toast';
import { MAX_MEDIA, type StageMediaItem } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';

interface Props {
  media: StageMediaItem[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
  onReorder: (from: number, to: number) => void;
  onAddFiles: (files: File[]) => void;
}

export default function MediaTray({ media, activeIndex, onSelect, onRemove, onReorder, onAddFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);

  const handleAdd = () => inputRef.current?.click();
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (media.length + files.length > MAX_MEDIA) {
      toast('Posts carry up to 10 photos or clips.');
    }
    onAddFiles(files);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '12px', background: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
      <button
        onClick={handleAdd}
        style={{ minWidth: 56, height: 56, borderRadius: 12, border: '1px dashed rgba(0,0,0,0.2)', background: '#fff', color: '#1F2428', fontSize: 22, cursor: 'pointer' }}
      >+</button>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
      {media.map((m, i) => {
        const active = i === activeIndex;
        return (
          <div
            key={m.id}
            draggable
            onDragStart={() => { dragFrom.current = i; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null && dragFrom.current !== i) onReorder(dragFrom.current, i);
              dragFrom.current = null;
            }}
            onClick={() => onSelect(i)}
            style={{ position: 'relative', minWidth: 56, height: 56, borderRadius: 12, overflow: 'hidden', boxShadow: active ? '0 0 0 2px #F7931E' : '0 0 0 1px rgba(0,0,0,0.07)', cursor: 'grab', background: '#15171F' }}
          >
            {m.type === 'video' ? (
              <video src={m.previewUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <CroppedImage item={m} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              aria-label="Remove"
              style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 999, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer' }}
            >×</button>
          </div>
        );
      })}
      <div style={{ marginLeft: 'auto', color: '#8A9099', fontSize: 12 }}>{media.length}/{MAX_MEDIA}</div>
    </div>
  );
}
