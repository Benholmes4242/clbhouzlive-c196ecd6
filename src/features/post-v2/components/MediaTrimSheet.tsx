// MediaTrimSheet - filmstrip-lite scrubber. Writes trim_start / trim_end
// into StageMediaItem (finalized on upload to post_media). No duration cap.

import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import type { StageMediaItem } from '../hooks/useStageComposer';

interface Props {
  open: boolean;
  onClose: () => void;
  item: StageMediaItem | null;
  onApply: (trimStart: number, trimEnd: number) => void;
}

export default function MediaTrimSheet({ open, onClose, item, onApply }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);

  useEffect(() => {
    if (!open || !item || item.type !== 'video') return;
    setStart(item.trimStart ?? 0);
    setEnd(item.trimEnd ?? 0);
  }, [open, item]);

  if (!item || item.type !== 'video') return null;

  return (
    <BottomSheet open={open} title="Trim" onClose={onClose}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <video
          ref={videoRef}
          src={item.previewUrl}
          controls
          playsInline
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration || 0;
            setDuration(d);
            if (!item.trimEnd) setEnd(d);
          }}
          style={{ width: '100%', maxHeight: 240, background: '#0E1013', borderRadius: 10 }}
        />
        <label style={label}>Start: {start.toFixed(2)}s
          <input type="range" min={0} max={Math.max(duration, 0.01)} step={0.05} value={start} onChange={(e) => setStart(Math.min(Number(e.target.value), end))} />
        </label>
        <label style={label}>End: {end.toFixed(2)}s
          <input type="range" min={0} max={Math.max(duration, 0.01)} step={0.05} value={end} onChange={(e) => setEnd(Math.max(Number(e.target.value), start))} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={() => { onApply(start, end); onClose(); }} style={btnDark}>Apply</button>
        </div>
      </div>
    </BottomSheet>
  );
}

const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#1F2428' };
const btnGhost: React.CSSProperties = { flex: 1, background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '10px', fontSize: 14, cursor: 'pointer' };
const btnDark: React.CSSProperties = { flex: 1, background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 12, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
