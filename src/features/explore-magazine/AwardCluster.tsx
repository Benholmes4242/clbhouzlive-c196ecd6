/**
 * MEDAL CLUSTER — ONE dot, of the best tier the round reached (gold, then
 * silver, then bronze), followed by THAT TIER'S count. Never the total.
 *
 * Why: the figure must mean one thing. Silver (matched_best) is half of all
 * awards and bronze top_tens can stack to a dozen on one round, so a total
 * ranks rounds backwards — twelve top-ten placings must not print a bigger
 * number than a course record. The colour says which kind of medal, the
 * figure says how many of that kind; the full list lives in RoundResults in
 * the scorecard sheet. Do not "fix" this back into a sum.
 *
 * Hue alone carries tier, so the wrapper carries a counted aria-label.
 * surfaceColor is always a prop (Explore canvas vs Scores list ground).
 * scale: 'row' matches 15px row figures (Explore); 'pill' matches 9px pills (Scores).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { medalTierTone } from '@/lib/tokens/medals';

export interface MedalClusterProps {
  gold: number;
  silver: number;
  bronze: number;
  surfaceColor: string;
  scale?: 'row' | 'pill';
}

const SCALES = {
  row: { dot: 10, figure: 15 },
  pill: { dot: 8, figure: 11.5 },
} as const;

const DEFAULTS = { gold: '{{count}} gold', silver: '{{count}} silver', bronze: '{{count}} bronze' } as const;

export function MedalCluster({ gold, silver, bronze, surfaceColor, scale = 'row' }: MedalClusterProps) {
  const { t } = useTranslation('courses');
  const top = gold > 0 ? (['gold', gold] as const) : silver > 0 ? (['silver', silver] as const) : bronze > 0 ? (['bronze', bronze] as const) : null;
  if (!top) return null;
  const [tier, count] = top;
  const s = SCALES[scale];
  return (
    <span
      data-medal-cluster={tier}
      role="img"
      aria-label={t(`amateur.stream.medals.${tier}`, { count, defaultValue: DEFAULTS[tier] })}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <span aria-hidden style={{ width: s.dot, height: s.dot, borderRadius: 999, background: medalTierTone(tier), boxShadow: `0 0 0 1.5px ${surfaceColor}`, flex: 'none' }} />
      <span aria-hidden style={{ fontSize: s.figure, fontWeight: 700, color: A.INK, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </span>
  );
}

export default MedalCluster;
