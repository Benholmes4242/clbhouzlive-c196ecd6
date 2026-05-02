import React from 'react';

export type LeaderboardScope = 'all' | 'year' | 'month' | 'last8';

const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: 'all', label: 'All-Time' },
  { key: 'year', label: 'This Year' },
  { key: 'month', label: 'This Month' },
  { key: 'last8', label: 'Last 8' },
];

const AMBER = '#F7931E';
const INK = '#0F172A';
const HAIRLINE = 'rgba(15,23,42,0.08)';

interface Props {
  scope: LeaderboardScope;
  onChange: (next: LeaderboardScope) => void;
}

export const LeaderboardScopeChips: React.FC<Props> = ({ scope, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '0 20px 14px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      role="tablist"
      aria-label="Leaderboard time scope"
    >
      {SCOPES.map((s) => {
        const active = scope === s.key;
        return (
          <button
            key={s.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.key)}
            style={{
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 800,
              border: `1px solid ${active ? AMBER : HAIRLINE}`,
              background: active ? AMBER : '#FFFFFF',
              color: active ? '#fff' : INK,
              borderRadius: 999,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: '0.02em',
              transition: 'all 150ms ease',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

export default LeaderboardScopeChips;
