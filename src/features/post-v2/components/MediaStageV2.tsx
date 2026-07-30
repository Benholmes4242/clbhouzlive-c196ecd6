// MediaStageV2 - full-bleed canvas for the active media item.
// Empty state: "The Clubhouse Wall" (see PostEmptyStage).

import { useEffect, useRef, useState } from 'react';
import type { StageMediaItem, FrameId } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';
import PostEmptyStage from './PostEmptyStage';
import { CT } from '@/features/_shared/composerTokens';

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

export default function MediaStageV2({ item, index, total, onOpenAdjust, onOpenCover, onRequestAdd }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item?.id]);

  if (!item) {
    return (
      <div ref={stageRef} style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <PostEmptyStage onRequestAdd={onRequestAdd} />
      </div>
    );
  }


  const ratio = FRAME_RATIO[item.frame];
  // Measured px box: for aspected frames compute boxW/boxH so the frame is
  // fully visible in the stage (the CSS aspectRatio + %-only sizing dropped
  // the ratio whenever height was the binding dimension - making pills look
  // dead even though the ratio IS baked into the posted file).
  const boxStyle: React.CSSProperties = ratio
    ? (() => {
        const stageW = stageSize.w || 0;
        const stageH = stageSize.h || 0;
        if (stageW === 0 || stageH === 0) return { width: 0, height: 0 };
        const boxW = Math.min(stageW, stageH * ratio);
        const boxH = boxW / ratio;
        return { width: boxW, height: boxH };
      })()
    : { width: '100%', height: '100%' };
  return (
    <div ref={stageRef} style={{ flex: 1, background: CT.dark, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ ...boxStyle, transition: 'width 250ms cubic-bezier(.2,.8,.2,1), height 250ms cubic-bezier(.2,.8,.2,1)' }}>
        {item.type === 'video' ? (
          <video src={item.previewUrl} playsInline muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CroppedImage item={item} />
        )}
      </div>
      {total > 1 && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', color: CT.onDark, fontSize: 12, padding: '4px 8px', borderRadius: 999 }}>
          {index + 1} / {total}
        </div>
      )}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
        {item.type === 'image' && (
          <button onClick={onOpenAdjust} style={chipStyle}>Adjust</button>
        )}
        {item.type === 'video' && (
          <button onClick={onOpenCover} style={chipStyle}>Cover</button>
        )}
      </div>
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  color: CT.onDark,
  border: 0,
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  cursor: 'pointer',
};
