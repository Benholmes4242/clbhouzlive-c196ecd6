// MediaTray - 82px filmstrip thumbnails with arrow-based reorder.
// Arrow reorder (not long-press drag) is deliberate: drag is fragile in the
// WebView. Selection is LIGHT-BASED (unselected tiles dim) per the wizard
// contract - no amber ring anywhere in this composer. Enforces MAX_MEDIA=10
// with a soft toast when exceeded.

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/lib/toast';
import { MAX_MEDIA, type StageMediaItem } from '../hooks/useStageComposer';
import SlideThumb from './SlideThumb';
import { CT_DARK } from '@/features/_shared/composerTokens';
import { CHIP_GLASS_CLASS, SCRIM_STANDOUT } from '@/styles/photoScrim';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                cursor: 'pointer',
                background: CT_DARK.surface,
                opacity: active ? 1 : 0.5,
                transition: 'opacity 150ms ease',
              }}
            >
              <SlideThumb item={m} />
              {/* Active slide carries a bottom scrim with the album position;
                  resting slides get a small numeral chip. */}
              {active ? (
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', background: SCRIM_STANDOUT, display: 'flex', alignItems: 'flex-end', padding: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                </span>
              ) : (
                <span className={CHIP_GLASS_CLASS} style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', borderRadius: 999, padding: '2px 6px', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                aria-label="Remove"
                className={CHIP_GLASS_CLASS}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  color: '#fff',
                  fontSize: 12,
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >×</button>
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
            fontSize: 26,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >+</button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
      </div>

      {/* Album-order note + reorder arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: CT_DARK.dim, letterSpacing: '0.01em' }}>
          Tap a photo, then move it — this is the album order.
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            onClick={() => canLeft && onReorder(activeIndex, activeIndex - 1)}
            disabled={!canLeft}
            aria-label="Move left"
            style={arrowStyle(canLeft)}
          >
            <ChevronLeft size={14} color={canLeft ? CT_DARK.ink : CT_DARK.dim} />
          </button>
          <button
            onClick={() => canRight && onReorder(activeIndex, activeIndex + 1)}
            disabled={!canRight}
            aria-label="Move right"
            style={arrowStyle(canRight)}
          >
            <ChevronRight size={14} color={canRight ? CT_DARK.ink : CT_DARK.dim} />
          </button>
        </div>
      </div>
    </div>
  );
}

function arrowStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'rgba(248,250,252,0.08)',
    border: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'not-allowed',
    flex: 'none',
    opacity: enabled ? 1 : 0.5,
    padding: 0,
  };
}
