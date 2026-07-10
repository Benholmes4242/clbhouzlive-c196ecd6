// MediaStageV2 - full-bleed dark canvas for the active media item.
// Renders the item with the current frame aspect (crop is stored as
// transform metadata; a P3 pass will bake it at upload for images).

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
}

export default function MediaStageV2({ item, index, total, onOpenAdjust, onOpenTrim, onOpenCover }: Props) {
  if (!item) {
    return (
      <div style={{ flex: 1, background: '#0E1013', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9099', fontSize: 14 }}>
        Add media to get started.
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

const chipStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  color: '#F5F6F7',
  border: 0,
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  cursor: 'pointer',
};
