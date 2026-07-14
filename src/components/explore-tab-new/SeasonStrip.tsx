import { useMemo } from 'react';
import { SPACE } from '@/lib/spacing';
import { DEEP_AMBER, FONT } from './gamingLightTokens';

// Season = calendar quarter for v1 (Q1..Q4 -> Season 1..4).
function computeSeason(now: Date): { number: number; daysLeft: number } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0..11
  const quarter = Math.floor(m / 3); // 0..3
  const endMonth = quarter * 3 + 3; // exclusive; e.g. Q3 -> month 9 (Oct)
  const end = Date.UTC(y, endMonth, 1);
  const daysLeft = Math.max(
    0,
    Math.ceil((end - now.getTime()) / 86_400_000),
  );
  return { number: quarter + 1, daysLeft };
}

export function SeasonStrip() {
  const { number, daysLeft } = useMemo(() => computeSeason(new Date()), []);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `18px ${SPACE.pagePadX}px 0`,
        fontFamily: FONT,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: DEEP_AMBER,
        }}
      >
        Season {number} · Official WHS
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#94A3B8',
        }}
      >
        {daysLeft} days left
      </span>
    </div>
  );
}

export default SeasonStrip;
