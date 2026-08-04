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
              background: active ? CT_DARK.ink : CT_DARK.surface,
              color: active ? '#11131A' : CT_DARK.mute,
              border: `1px solid ${active ? 'transparent' : CT_DARK.line}`,
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              padding: '5px 10px',
              borderRadius: 999,
              cursor: 'pointer',
              flex: 'none',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
