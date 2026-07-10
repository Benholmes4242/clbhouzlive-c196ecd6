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
@keyframes ghostDriftA { 0%,100% { transform: translate(-6%, -3%) rotate(-4deg); } 50% { transform: translate(-2%, 1%) rotate(-2deg); } }
@keyframes ghostDriftB { 0%,100% { transform: translate(0%, 0%) rotate(0deg); } 50% { transform: translate(2%, -2%) rotate(1.5deg); } }
@keyframes ghostDriftC { 0%,100% { transform: translate(6%, 3%) rotate(4deg); } 50% { transform: translate(3%, -1%) rotate(2deg); } }
`;

export default function MediaStageV2({ item, index, total, onOpenAdjust, onOpenTrim, onOpenCover, onRequestAdd }: Props) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  if (!item) {
    return (
      <div style={{ flex: 1, background: '#0E1013', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ position: 'relative', width: 260, height: 220 }}>
          <Ghost
            style={{ left: '2%', top: '18%', width: 130, height: 160, animation: reduced ? undefined : 'ghostDriftA 4.2s ease-in-out infinite' }}
          />
          <Ghost
            style={{ left: '30%', top: '4%', width: 140, height: 180, animation: reduced ? undefined : 'ghostDriftB 4.8s ease-in-out infinite 0.4s' }}
            play
          />
          <Ghost
            style={{ right: '2%', top: '22%', width: 120, height: 150, animation: reduced ? undefined : 'ghostDriftC 4.5s ease-in-out infinite 0.9s' }}
          />
        </div>
        <button
          onClick={onRequestAdd}
          aria-label="Add media"
          style={{
            marginTop: 22,
            width: 60,
            height: 60,
            borderRadius: 999,
            background: '#F7931E',
            border: 0,
            color: '#15171F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(247,147,30,0.35), 0 2px 6px rgba(247,147,30,0.25)',
          }}
        >
          <Plus size={26} strokeWidth={2.4} />
        </button>
        <div style={{ marginTop: 18, color: 'rgba(255,255,255,0.5)', fontSize: 12.5, letterSpacing: 0.1 }}>
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
