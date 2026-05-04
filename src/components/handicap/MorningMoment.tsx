/**
 * MorningMoment — placeholder per fix brief §4.
 *
 * Reserves visual space above the handicap sections on /handicap. The real
 * Weather + Friends Yesterday cards land in a follow-up Phase 3.5 brief once
 * `golf_courses` lat/lng and friend score RLS are confirmed.
 */
import React from 'react';

const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.10)';
const AMBER = '#F7931E';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
}

const MorningMoment: React.FC<Props> = () => {
  return (
    <section aria-label="Today" style={{ padding: '20px 16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER }} />
        <span
          style={{
            fontSize: 10, fontWeight: 800, color: INK_55,
            letterSpacing: '0.22em', fontFamily: FONT_GEIST,
          }}
        >
          TODAY
        </span>
      </div>

      <div
        style={{
          background: '#fff',
          border: `0.5px solid ${INK_10}`,
          borderRadius: 12,
          padding: '20px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: INK_55, fontFamily: FONT_GEIST }}>
          Daily insights coming soon
        </div>
        <div style={{ fontSize: 11, color: INK_55, marginTop: 4, fontFamily: FONT_GEIST }}>
          Weather, friends activity, and more.
        </div>
      </div>
    </section>
  );
};

export default MorningMoment;
