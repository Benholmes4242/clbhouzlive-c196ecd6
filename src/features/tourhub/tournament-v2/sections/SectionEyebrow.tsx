/**
 * SectionEyebrow — TD1 section header: kicker + optional right action.
 * Dispatch grammar: 3px rule marker + 9px caps + right chevron affordance.
 */
import { FONT, INK, INK_MUTE, INK_FAINT } from '../../_shared/tokens';

interface Props {
  kicker: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionEyebrow({ kicker, actionLabel, onAction }: Props) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px 8px', fontFamily: FONT,
      }}
    >
      <div style={{ width: 3, height: 12, background: INK, borderRadius: 1, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 9, fontWeight: 900, color: INK,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}
      >
        {kicker}
      </span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginLeft: 'auto', background: 'transparent', border: 'none',
            fontSize: 11, fontWeight: 700, color: INK_MUTE,
            cursor: 'pointer', padding: 0, fontFamily: FONT,
          }}
          className="active:opacity-70 transition-opacity"
        >
          {actionLabel} <span style={{ color: INK_FAINT }}>›</span>
        </button>
      )}
    </div>
  );
}
