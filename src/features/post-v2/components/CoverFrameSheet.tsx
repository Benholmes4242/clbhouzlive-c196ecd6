// CoverFrameSheet - scrubber that captures poster_timestamp (seconds).

import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import type { StageMediaItem } from '../hooks/useStageComposer';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  item: StageMediaItem | null;
  onApply: (posterTimestamp: number) => void;
}

export default function CoverFrameSheet({ open, onClose, item, onApply }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [ts, setTs] = useState<number>(0);

  useEffect(() => {
    if (!open || !item || item.type !== 'video') return;
    setTs(item.posterTimestamp ?? 0);
  }, [open, item]);

  if (!item || item.type !== 'video') return null;

  return (
    <BottomSheet open={open} title="Cover frame" onClose={onClose}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <video
          ref={videoRef}
          src={item.previewUrl}
          playsInline
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          style={{ width: '100%', maxHeight: 240, background: CT.dark, borderRadius: 12 }}
        />
        <label style={{ fontSize: 12, color: CT.ink, display: 'flex', flexDirection: 'column', gap: 6 }}>
          Poster time: {ts.toFixed(2)}s
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.05}
            value={ts}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTs(v);
              if (videoRef.current) videoRef.current.currentTime = v;
            }}
            style={{ width: '100%', accentColor: CT.dark, cursor: 'pointer' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(248,250,252,0.06)', color: CT.ink, border: `1px solid ${CT.hairlineStrong}`, borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onApply(ts); onClose(); }} style={{ flex: 1, background: CT.dark, color: CT.onDark, border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>
    </BottomSheet>
  );
}
