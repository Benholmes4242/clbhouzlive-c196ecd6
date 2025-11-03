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
      className="rounded-2xl px-3.5 py-2 text-sm text-white/90 border border-white/15 hover:bg-white/10 transition shrink-0"
      style={{ maxWidth: 128, whiteSpace: 'nowrap' }}
      aria-label="View all"
    >
      View all →
    </button>
  );
}
