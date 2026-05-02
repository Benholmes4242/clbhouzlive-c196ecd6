import React from 'react';
import { Clock } from 'lucide-react';
import type { LeaderboardScope } from './LeaderboardScopeChips';

interface Props {
  scope: LeaderboardScope;
}

const COPY: Record<LeaderboardScope, { title: string; body: string }> = {
  all: { title: '', body: '' },
  year: {
    title: 'No rounds this year yet',
    body: 'Friends need at least 3 rounds in 2026 to appear here. Check back as the season ramps up.',
  },
  month: {
    title: 'No rounds this month yet',
    body: 'Friends need at least 3 rounds this month to appear. The board fills up as everyone plays.',
  },
  last8: {
    title: 'Not enough recent rounds',
    body: 'Friends need at least 3 of their last 8 rounds with a differential. Check back soon.',
  },
};

const HAIRLINE_STRONG = 'rgba(15,23,42,0.12)';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const AMBER_TINT = 'rgba(247,147,30,0.10)';
const AMBER = '#F7931E';

export const EmptyScopeState: React.FC<Props> = ({ scope }) => {
  const copy = COPY[scope];
  return (
    <div
      style={{
        margin: '0 20px',
        padding: '32px 20px',
        background: '#FFFFFF',
        border: `1px dashed ${HAIRLINE_STRONG}`,
        borderRadius: 14,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: AMBER_TINT,
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Clock size={22} color={AMBER} strokeWidth={2} />
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 800,
          color: INK,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.01em',
        }}
      >
        {copy.title}
      </h3>
      <p
        style={{
          margin: '6px auto 0',
          maxWidth: 280,
          fontSize: 12,
          lineHeight: 1.45,
          color: INK_MUTE,
        }}
      >
        {copy.body}
      </p>
    </div>
  );
};

export default EmptyScopeState;
