import React from 'react';
import { Users, Search } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  onOpenSearch: () => void;
}

export const PulseEmpty: React.FC<Props> = ({ onOpenSearch }) => (
  <div style={{ padding: '16px 16px 0', fontFamily: FONT }}>
    <div
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 13,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '34%',
          background: 'rgba(247,147,30,0.10)',
          color: '#F7931E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Users size={20} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--hcp-t-100)', lineHeight: 1.3 }}>
          No friends played this week
        </div>
        <div style={{ fontSize: 12, color: 'var(--hcp-t-60)', marginTop: 4, lineHeight: 1.4 }}>
          Find players to follow — see their handicap and form.
        </div>
      </div>
      <button
        onClick={onOpenSearch}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: 'var(--hcp-bg-2)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 999,
          color: 'var(--hcp-t-100)',
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Search size={13} />
        Find a player
      </button>
    </div>
  </div>
);

export default PulseEmpty;
