import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onOpen: () => void;
}

export const FindPlayerRow: React.FC<Props> = ({ onOpen }) => (
  <div style={{ padding: '14px 20px 0', fontFamily: FONT }}>
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        width: '100%',
        background: 'transparent',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
      }}
    >
      <Search size={15} color="var(--hcp-t-60)" />
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--hcp-t-100)' }}>
        Find any player's handicap
      </span>
      <ArrowRight size={14} color="var(--hcp-t-60)" />
    </button>
  </div>
);

export default FindPlayerRow;
