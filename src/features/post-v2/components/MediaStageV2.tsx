// MediaStageV2 - full-bleed dark canvas for the active media item.
// Empty state: "ghost collage" - three dashed drifting frames + amber add CTA.

import { Plus, Play } from 'lucide-react';
import { useMemo } from 'react';
import type { StageMediaItem, FrameId } from '../hooks/useStageComposer';

const FRAME_RATIO: Record<FrameId, number | null> = {
  original: null,
  '4:5': 4 / 5,
  '1:1': 1,
  '9:16': 9 / 16,
};

interface Props {
  item: StageMediaItem | null;
  index: number;
  total: number;
  onOpenAdjust?: () => void;
  onOpenTrim?: () => void;
  onOpenCover?: () => void;
  onRequestAdd?: () => void;
}

const KEYFRAMES = `
@keyframes ghostFloaty {
  0%,100% { transform: translateY(0) rotate(var(--r)); }
  50% { transform: translateY(-6px) rotate(var(--r)); }
}
`;

interface FrameDef {
  w: number; h: number; x: number; y: number; r: number; delay: number; play?: boolean;
}

const FRAMES: FrameDef[] = [
  { w: 96,  h: 120, x: -78, y: -34, r: -7, delay: 0 },
  { w: 110, h: 82,  x: 34,  y: -66, r: 4,  delay: 0.4, play: true },
  { w: 86,  h: 104, x: 52,  y: 40,  r: 9,  delay: 0.8 },
];

export default function MediaStageV2({ item, index, total, onOpenAdjust, onOpenTrim, onOpenCover, onRequestAdd }: Props) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  if (!item) {
    return (
      <div style={{ flex: 1, background: '#0E1013', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <style>{KEYFRAMES}</style>
        <button
          onClick={onRequestAdd}
          aria-label="Add media"
          style={{
            position: 'relative',
            width: 260,
            height: 260,
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {FRAMES.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${f.x}px - ${f.w / 2}px)`,
                top: `calc(50% + ${f.y}px - ${f.h / 2}px)`,
                width: f.w,
                height: f.h,
                borderRadius: 12,
                border: '1.5px dashed rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ['--r' as any]: `${f.r}deg`,
                transform: `rotate(${f.r}deg)`,
                animation: reduced ? undefined : `ghostFloaty 4s ${f.delay}s ease-in-out infinite`,
              }}
            >
              {f.play && (
                <Play size={12} color="rgba(255,255,255,0.3)" style={{ marginLeft: 1 }} />
              )}
              {f.play && (
                <div
                  style={{
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              )}
            </div>
          ))}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 52,
              height: 52,
              borderRadius: 999,
              background: '#F7931E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(247,147,30,0.4)',
            }}
          >
            <Plus size={24} strokeWidth={2} color="#FFFFFF" />
          </div>
        </button>
        <div style={{ marginTop: 46, color: 'rgba(255,255,255,0.5)', fontSize: 12.5, letterSpacing: 0.1 }}>
          Every round has a highlight.
        </div>
      </div>
    );
  }

  const ratio = FRAME_RATIO[item.frame];
  const boxStyle: React.CSSProperties = ratio
    ? { aspectRatio: `${ratio}`, width: '100%', maxHeight: '100%' }
    : { width: '100%', height: '100%' };
  return (
    <div style={{ flex: 1, background: '#0E1013', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'all 250ms cubic-bezier(.2,.8,.2,1)' }}>
      <div style={boxStyle}>
        {item.type === 'video' ? (
          <video src={item.previewUrl} playsInline muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      {total > 1 && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', color: '#F5F6F7', fontSize: 12, padding: '4px 8px', borderRadius: 999 }}>
          {index + 1} / {total}
        </div>
      )}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
        {item.type === 'image' && (
          <button onClick={onOpenAdjust} style={chipStyle}>Adjust</button>
        )}
        {item.type === 'video' && (
          <>
            <button onClick={onOpenTrim} style={chipStyle}>Trim</button>
            <button onClick={onOpenCover} style={chipStyle}>Cover</button>
          </>
        )}
      </div>
    </div>
  );
}

function Ghost({ style, play }: { style: React.CSSProperties; play?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 16,
        border: '1.5px dashed rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {play && (
        <div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={16} color="rgba(255,255,255,0.55)" fill="rgba(255,255,255,0.35)" />
        </div>
      )}
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  color: '#F5F6F7',
  border: 0,
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  cursor: 'pointer',
};
