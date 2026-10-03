/**
 * MEDAL CLUSTER — one dot per tier PRESENT (gold, silver, bronze), overlapping,
 * then the total as a row figure. surfaceColor is the ground it sits on and is
 * always a prop: the ring must match Explore's canvas and the Scores list alike.
 */
import React from 'react';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { medalTierTone } from '@/lib/tokens/medals';

export interface MedalClusterProps {
  gold: number;
  silver: number;
  bronze: number;
  surfaceColor: string;
}

export function MedalCluster({ gold, silver, bronze, surfaceColor }: MedalClusterProps) {
  const total = gold + silver + bronze;
  if (total === 0) return null;
  const tiers = ([['gold', gold], ['silver', silver], ['bronze', bronze]] as const).filter(([, n]) => n > 0);
  return (
    <span data-medal-cluster="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center' }}>
        {tiers.map(([tier], i) => (
          <span key={tier} style={{ width: 10, height: 10, borderRadius: 999, background: medalTierTone(tier), marginLeft: i === 0 ? 0 : -3, boxShadow: `0 0 0 1.5px ${surfaceColor}` }} />
        ))}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: A.INK, fontVariantNumeric: 'tabular-nums' }}>{total}</span>
    </span>
  );
}

export default MedalCluster;
