/**
 * ViewAllPill Component
 * Consistent "View all" button that never wraps
 */

import React from 'react';

interface ViewAllPillProps {
  onClick: () => void;
}

export function ViewAllPill({ onClick }: ViewAllPillProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl px-3.5 py-2 text-sm transition shrink-0"
      style={{ 
        maxWidth: 128, 
        whiteSpace: 'nowrap',
        border: '1px solid var(--hub-stroke-subtle)',
        color: 'var(--hub-text-body)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-subtle)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      aria-label="View all"
    >
      View all →
    </button>
  );
}
