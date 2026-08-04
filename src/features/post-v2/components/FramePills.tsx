// FramePills - Original / 4:5 / 1:1 / 9:16 chooser overlaid on the stage.

import type { FrameId } from '../hooks/useStageComposer';
import { CT_DARK } from '@/features/_shared/composerTokens';

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
    <div style={{ display: 'flex', gap: 6 }}>
      {ALL.map(p => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            style={{
              background: active ? CT_DARK.ink : 'rgba(15, 18, 24, 0.72)',
              color: active ? CT_DARK.bg : CT_DARK.ink,
              border: '1px solid rgba(248,250,252,0.10)',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              padding: '5px 10px',
              borderRadius: 999,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
