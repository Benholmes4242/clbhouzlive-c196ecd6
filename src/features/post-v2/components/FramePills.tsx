// FramePills - Original / 4:5 / 1:1 / 9:16 chooser overlaid on the stage.

import type { FrameId } from '../hooks/useStageComposer';
import { CT } from '@/features/_shared/composerTokens';

const ALL: { id: FrameId; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: '4:5', label: '4:5' },
  { id: '1:1', label: '1:1' },
  { id: '9:16', label: '9:16' },
];

interface Props {
  value: FrameId;
  onChange: (v: FrameId) => void;
}

export default function FramePills({ value, onChange }: Props) {
  return (
    <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 6 }}>
      {ALL.map(p => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{
              background: active ? CT.onDark : 'rgba(0,0,0,0.55)',
              color: active ? CT.dark : CT.onDark,
              border: 0,
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              padding: '6px 10px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
