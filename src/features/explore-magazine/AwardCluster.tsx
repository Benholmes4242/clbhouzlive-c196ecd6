/**
 * AWARD CLUSTER — one AwardMark per tier PRESENT (gold, silver, bronze order,
 * overlapping by 4px with a 1.5px separator in surfaceColor), followed by the
 * TOTAL number of awards across all three tiers. Null when all are zero.
 *
 * Why a total is safe: hole units earn only a new best (gold) or a first
 * birdie (bronze) — no matched-best, top-three or top-ten placings — under the
 * rule in supabase/functions/gam-evaluator/awards.ts (resolveAwards). That rule
 * is what stops a round stacking a dozen hole placings into a figure bigger
 * than a course record. If that rule is ever loosened, revisit this figure.
 * The full list lives in RoundResults in the scorecard sheet.
 *
 * The aria-label joins the counted tier keys: "4 gold, 11 silver".
 * scale: 'row' beside 15px figures (Explore); 'pill' beside 11.5px (Scores).
 */
import { useTranslation } from 'react-i18next';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { AwardMark, type AwardTier } from '@/components/awards/AwardMark';

export interface AwardClusterProps {
  gold: number;
  silver: number;
  bronze: number;
  surfaceColor: string;
  scale?: 'row' | 'pill';
}

const FIGURE = { row: 15, pill: 11.5 } as const;
const DEFAULTS = { gold: '{{count}} gold', silver: '{{count}} silver', bronze: '{{count}} bronze' } as const;

export function AwardCluster({ gold, silver, bronze, surfaceColor, scale = 'row' }: AwardClusterProps) {
  const { t } = useTranslation('courses');
  const tiers = ([['gold', gold], ['silver', silver], ['bronze', bronze]] as Array<[AwardTier, number]>).filter(([, n]) => n > 0);
  if (tiers.length === 0) return null;
  const total = gold + silver + bronze;
  const label = tiers.map(([tier, count]) => t(`amateur.stream.medals.${tier}`, { count, defaultValue: DEFAULTS[tier] })).join(', ');
  return (
    <span data-award-cluster={tiers.map(([k]) => k).join(' ')} role="img" aria-label={label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center' }}>
        {tiers.map(([tier], i) => (
          <AwardMark key={tier} tier={tier} size={scale} ring={surfaceColor} style={{ marginLeft: i === 0 ? 0 : -4, position: 'relative', zIndex: tiers.length - i }} />
        ))}
      </span>
      <span aria-hidden style={{ fontSize: FIGURE[scale], fontWeight: 700, color: A.INK, fontVariantNumeric: 'tabular-nums' }}>{total}</span>
    </span>
  );
}

export default AwardCluster;
