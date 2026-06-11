import { GAM } from '../../../gam/tokens';
import React from 'react';
import { Crown } from 'lucide-react';
import { EmptyStateTile } from '@/components/profile/handicap/gam/_shared/EmptyStateTile';

const INK = 'var(--hcp-t-100)';
const SLATE = 'var(--hcp-t-60)';

/** No legends in ANY window — the true empty. */
export const ChampionsEmptyState: React.FC<{ courseName: string | null }> = ({ courseName }) => (
  <div style={{ padding: '44px 28px 48px', textAlign: 'center', fontFamily: GAM.FONT_GEIST }}>
    <EmptyStateTile tint="amber">
      <Crown size={30} color={GAM.AMBER} strokeWidth={1.8} />
    </EmptyStateTile>
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: 'var(--hcp-t-100)',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      Champions
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
      Be the first legend
    </div>
    <div style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.55, maxWidth: 300, margin: '0 auto' }}>
      No one's posted a round at{' '}
      <strong style={{ color: INK, fontWeight: 700 }}>{courseName ?? 'this course'}</strong> yet.
      Post your first and you'll top every leaderboard — gross, birdies, stableford — until someone beats you.
    </div>
  </div>
);

/** Active window empty, but the other window has data. */
export const ChampionsWindowEmptyState: React.FC<{
  window: '90d' | 'all_time';
  onSwitch: () => void;
}> = ({ window, onSwitch }) => (
  <div style={{ padding: '40px 28px 44px', textAlign: 'center', fontFamily: GAM.FONT_GEIST }}>
    <EmptyStateTile tint="slate">
      <Crown size={30} color="#64748b" strokeWidth={1.8} />
    </EmptyStateTile>
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        color: INK,
        letterSpacing: '-0.02em',
        marginBottom: 8,
        lineHeight: 1.2,
      }}
    >
      {window === '90d' ? 'No legends in the last 90 days' : 'No all-time legends yet'}
    </div>
    <div style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.55, maxWidth: 290, margin: '0 auto 18px' }}>
      {window === '90d'
        ? 'No rounds posted here recently — but the all-time leaderboards are stacked.'
        : 'Nothing in this window yet.'}
    </div>
    <button
      onClick={onSwitch}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--hcp-t-100, #0F172A)',
        color: '#fff',
        border: 'none',
        borderRadius: 999,
        padding: '9px 18px',
        fontSize: 12.5,
        fontWeight: 800,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      {window === '90d' ? 'View all-time' : 'View last 90 days'}{' '}
      <span style={{ fontSize: 14 }}>→</span>
    </button>
  </div>
);
