import React from 'react';
import './nearby.css';

interface PullToRefreshIndicatorProps {
  state: 'idle' | 'pull' | 'ready' | 'loading';
  pullDistance?: number;
}

export function PullToRefreshIndicator({ state, pullDistance = 0 }: PullToRefreshIndicatorProps) {
  if (state === 'idle') return null;

  return (
    <div className="flex justify-center items-center py-4">
      <div
        className="ptr-flag text-4xl"
        data-state={state}
        style={{ '--y': pullDistance } as React.CSSProperties}
        aria-label={state === 'loading' ? 'Refreshing' : 'Pull to refresh'}
        role="status"
      >
        🚩
      </div>
    </div>
  );
}
