import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BG_2, T100, LINE_2, AMBER, FONT } from './_shared/tokens';

interface Props {
  primaryLabel: string;
  primaryOnClick: () => void;
  onViewProfile: () => void;
  onMessage: () => void;
}

export const SheetActionFooter: React.FC<Props> = ({
  primaryLabel,
  primaryOnClick,
  onViewProfile,
  onMessage,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      fontFamily: FONT,
    }}
  >
    <button
      type="button"
      onClick={onMessage}
      aria-label="Message"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: `1px solid ${LINE_2}`,
        background: 'transparent',
        color: T100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <MessageCircle size={18} strokeWidth={2} />
    </button>
    <button
      type="button"
      onClick={onViewProfile}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 12,
        border: `1px solid ${LINE_2}`,
        background: 'transparent',
        color: T100,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      View profile
    </button>
    <button
      type="button"
      onClick={primaryOnClick}
      style={{
        flex: 1.2,
        height: 44,
        borderRadius: 12,
        border: 'none',
        background: AMBER,
        color: '#0A0E14',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      {primaryLabel}
    </button>
  </div>
);
