import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
  hiddenCount: number;
  onClick: () => void;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const SeeFullFooter: React.FC<Props> = ({ hiddenCount, onClick }) => {
  if (hiddenCount <= 0) return null;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '11px 12px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        cursor: 'pointer',
        color: 'var(--hcp-accent-util)',
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        fontFamily: FONT,
      }}
    >
      See full leaderboard
      <span style={{ color: 'var(--hcp-t-60)', fontWeight: 600, marginLeft: 4 }}>
        ({hiddenCount} more)
      </span>
      <ChevronRight size={14} strokeWidth={2.4} style={{ marginLeft: 2 }} />
    </button>
  );
};
