// MediaStageV2 - full-bleed canvas for the active media item.
// Empty state is a minimal dark tap target so the picker cancellation
// never leaves a dead screen.

import { useEffect, useRef, useState } from 'react';
import { Plus, Volume2, VolumeX } from 'lucide-react';
import type { StageMediaItem, FrameId } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';
import { CT_DARK } from '@/features/_shared/composerTokens';
import { useSessionAudio } from '@/audio/sessionAudioStore';


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

export default function MediaStageV2({ item, index, total, onRequestAdd }: Props) {
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
      <div ref={stageRef} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: CT_DARK.surface }}>
        <button
          type="button"
          onClick={onRequestAdd}
          aria-label="Add photos or video"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: CT_DARK.elev,
            border: `1px dashed ${CT_DARK.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Plus size={24} color={CT_DARK.ink} />
        </button>
      </div>
    );
  }

  // The parent (StageComposer page 1) owns the frame aspect ratio, so the
  // media box simply fills it — no second letterbox pass here.
  const boxStyle: React.CSSProperties = { width: '100%', height: '100%' };

  return (
    <div ref={stageRef} style={{ flex: 1, background: CT_DARK.surface, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ ...boxStyle, transition: 'width 250ms cubic-bezier(.2,.8,.2,1), height 250ms cubic-bezier(.2,.8,.2,1)' }}>
        {item.type === 'video' ? (
          <video src={item.previewUrl} playsInline muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CroppedImage item={item} />
        )}
      </div>
      {total > 1 && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', color: CT_DARK.ink, fontSize: 12, padding: '4px 8px', borderRadius: 999 }}>
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}
