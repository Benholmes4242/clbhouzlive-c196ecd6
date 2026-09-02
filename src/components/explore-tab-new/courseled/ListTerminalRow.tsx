import { ChevronRight } from 'lucide-react';

import { A, KICKER, SANS } from './tokens';

interface ListTerminalRowProps {
  label: string;
  onPress: () => void;
}

/** Shared terminal action for the board and Courses Played lists. */
export function ListTerminalRow({ label, onPress }: ListTerminalRowProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
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
      <ChevronRight size={16} strokeWidth={2} color={A.BODY} aria-hidden />
    </button>
  );
}
