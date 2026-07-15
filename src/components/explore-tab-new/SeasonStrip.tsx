import { useMemo } from 'react';
import { SPACE } from '@/lib/spacing';
import { AMBER, FONT } from './gamingLightTokens';
import { quarterOf, daysLeft, seasonName } from '@/lib/gam/seasonClock';
import { useViewerHemisphere } from '@/hooks/gam/useViewerHemisphere';

export function SeasonStrip() {
  const hemi = useViewerHemisphere();
  const { name, left } = useMemo(() => {
    const now = new Date();
    const { quarter } = quarterOf(now);
    return { name: seasonName(quarter, hemi), left: daysLeft(now) };
  }, [hemi]);

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
          color: AMBER,
        }}
      >
        {name} · Official WHS
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
        {left} days left
      </span>
    </div>
  );
}

export default SeasonStrip;
