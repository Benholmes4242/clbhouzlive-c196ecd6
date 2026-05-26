import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onOpen: () => void;
}

export const FindPlayerRow: React.FC<Props> = ({ onOpen }) => (
  <div style={{ padding: '16px 20px 0', fontFamily: FONT }}>
    <div
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 13,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '34%',
          background: 'rgba(247,147,30,0.10)',
          color: '#F7931E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Search size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--hcp-t-100)', lineHeight: 1.25 }}>
          Find any player's handicap
        </div>
        <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 2, lineHeight: 1.3 }}>
          Search friends and other golfers
        </div>
      </div>
      <ChevronRight size={18} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
    </div>
  </div>
);

export default FindPlayerRow;
