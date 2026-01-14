/**
 * HubCountFooterPill - Summary pill for remaining items
 * "+3 games and 2 trips to come"
 */

import React from 'react';

interface HubCountFooterPillProps {
  gamesCount: number;
  tripsCount: number;
  onClick?: () => void;
}

export function HubCountFooterPill({ gamesCount, tripsCount, onClick }: HubCountFooterPillProps) {
  if (gamesCount === 0 && tripsCount === 0) return null;

  let text = '';
  if (gamesCount > 0 && tripsCount > 0) {
    text = `+${gamesCount} game${gamesCount > 1 ? 's' : ''} and ${tripsCount} trip${tripsCount > 1 ? 's' : ''} to come`;
  } else if (gamesCount > 0) {
    text = `+${gamesCount} more game${gamesCount > 1 ? 's' : ''} to come`;
  } else if (tripsCount > 0) {
    text = `+${tripsCount} more trip${tripsCount > 1 ? 's' : ''} to come`;
  }

  if (!text) return null;

  return (
    <button
      onClick={onClick}
      className="flex justify-center py-2"
    >
      <div 
        className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-150 active:scale-[0.98]"
        style={{
          background: 'transparent',
          border: '1px dashed rgba(15, 23, 42, 0.12)',
          color: 'var(--hub-text-dim)',
        }}
      >
        {text}
      </div>
    </button>
  );
}
