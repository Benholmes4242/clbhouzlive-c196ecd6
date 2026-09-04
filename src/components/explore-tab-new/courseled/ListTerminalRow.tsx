import { ChevronDown, ChevronRight } from 'lucide-react';

import { A, KICKER, SANS } from './tokens';

interface ListTerminalRowProps {
  label: string;
  onPress: () => void;
  expanded?: boolean;
}

/** Shared terminal action for the board and Courses Played lists. */
export function ListTerminalRow({ label, onPress, expanded }: ListTerminalRowProps) {
  const disclosure = expanded != null;
  return (
    <button
      type="button"
      onClick={onPress}
      aria-expanded={disclosure ? expanded : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: -1,
        padding: '14px 0',
        background: 'transparent',
        border: 'none',
        borderTop: `1px solid ${A.HAIRLINE}`,
        fontFamily: SANS,
        cursor: 'pointer',
        textAlign: 'left',
        color: A.BODY,
      }}
    >
      <span style={{ ...KICKER, color: A.BODY }}>{label}</span>
      {disclosure ? (
        <ChevronDown
          size={16}
          strokeWidth={2}
          color={A.MUTE}
          aria-hidden
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 160ms ease',
          }}
        />
      ) : (
        <ChevronRight size={16} strokeWidth={2} color={A.BODY} aria-hidden />
      )}
    </button>
  );
}
