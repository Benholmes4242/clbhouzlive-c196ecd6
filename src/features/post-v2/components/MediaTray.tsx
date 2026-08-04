// MediaTray - 82px filmstrip thumbnails with arrow-based reorder.
// Arrow reorder (not long-press drag) is deliberate: drag is fragile in the
// WebView. Enforces MAX_MEDIA=10 with a soft toast when exceeded.

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const TILE = 82;

export default function MediaTray({ media, activeIndex, onSelect, onRemove, onReorder, onAddFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => inputRef.current?.click();
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (media.length + files.length > MAX_MEDIA) {
      toast('Posts carry up to 10 photos or clips.');
    }
    await onAddFiles(files);
    e.target.value = '';
  };

  const canLeft = activeIndex > 0;
  const canRight = activeIndex < media.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
        {media.map((m, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={m.id}
              onClick={() => onSelect(i)}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: TILE,
                height: TILE,
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: active ? `0 0 0 2.5px ${CT_DARK.amber}` : `0 0 0 1px ${CT_DARK.line}`,
                cursor: 'pointer',
                background: CT_DARK.surface,
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
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  border: 0,
                  fontSize: 13,
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >×</button>
              <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 11, fontWeight: 700, color: CT_DARK.ink, textShadow: '0 1px 3px rgba(0,0,0,0.6)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</div>
            </div>
          );
        })}
        <button
          onClick={handleAdd}
          aria-label="Add photos or video"
          style={{
            flexShrink: 0,
            width: TILE,
            height: TILE,
            borderRadius: 14,
            border: `1px dashed ${CT_DARK.dim}`,
            background: 'transparent',
            color: CT_DARK.mute,
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >+</button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
      </div>

      {/* Reorder arrows + album order note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => canLeft && onReorder(activeIndex, activeIndex - 1)}
          disabled={!canLeft}
          aria-label="Move left"
          style={arrowStyle(canLeft)}
        >
          <ChevronLeft size={16} color={canLeft ? CT_DARK.ink : CT_DARK.dim} />
        </button>
        <button
          onClick={() => canRight && onReorder(activeIndex, activeIndex + 1)}
          disabled={!canRight}
          aria-label="Move right"
          style={arrowStyle(canRight)}
        >
          <ChevronRight size={16} color={canRight ? CT_DARK.ink : CT_DARK.dim} />
        </button>
        <div style={{ fontSize: 11, color: CT_DARK.mute, letterSpacing: '0.02em' }}>
          Tap a photo, then move it — this is the album order.
        </div>
        <div style={{ marginLeft: 'auto', color: CT_DARK.mute, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{media.length}/{MAX_MEDIA}</div>
      </div>
    </div>
  );
}

function arrowStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 999,
    background: 'rgba(248,250,252,0.08)',
    border: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'not-allowed',
    flex: 'none',
    opacity: enabled ? 1 : 0.5,
  };
}
