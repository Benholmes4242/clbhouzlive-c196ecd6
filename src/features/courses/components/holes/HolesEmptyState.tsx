import React from 'react';
import { Flag } from 'lucide-react';
import { EmptyStateTile } from '@/components/profile/handicap/gam/_shared/EmptyStateTile';
import { AMBER, DEEP_AMBER, FONT, INK } from './_constants';
import { HAIRLINE_INK_8, INK_TINT_06 } from '@/features/courses/_shared/tokens';

const SLATE = 'var(--hcp-t-60, #64748b)';

export const HolesEmptyState: React.FC<{ courseName: string | null }> = ({ courseName }) => (
  <div style={{ padding: '40px 24px 0', textAlign: 'center', fontFamily: FONT }}>
    <EmptyStateTile tint="amber">
      <Flag size={28} color={AMBER} strokeWidth={1.8} />
    </EmptyStateTile>
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: DEEP_AMBER,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginBottom: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: AMBER,
          display: 'inline-block',
        }}
      />
      Official hole data
    </div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: INK,
        letterSpacing: '-0.02em',
        marginBottom: 8,
        lineHeight: 1.15,
      }}
    >
      Hole insights are coming
    </div>
    <div style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.55, maxWidth: 310, margin: '0 auto 24px' }}>
      When global golfers holding official WHS handicaps log rounds with hole scores at{' '}
      <strong style={{ color: INK, fontWeight: 700 }}>{courseName ?? 'this course'}</strong>, we'll
      break down every hole — average score, hardest and easiest, and the full birdie-to-double spread.
    </div>
    <div
      style={{ maxWidth: 280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.5 }}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '34%',
              background: HAIRLINE_INK_8,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: INK_TINT_06 }} />
        </div>
      ))}
    </div>
  </div>
);

export default HolesEmptyState;
