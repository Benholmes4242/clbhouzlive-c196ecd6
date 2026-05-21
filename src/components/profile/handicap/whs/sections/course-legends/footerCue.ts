import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';

export type FooterCueIntent = 'defend' | 'chase' | 'neutral';

export interface FooterCue {
  label: string;
  intent: FooterCueIntent;
}

const CAT_LABEL: Record<LegendCategory, string> = {
  best_score_diff: 'Score',
  most_birdies_90d: 'Birdie',
  most_rounds_90d: 'Visitor',
  lowest_gross: 'Gross',
  best_stableford_90d: 'Stableford',
};

const STROKE_CATS: LegendCategory[] = ['lowest_gross'];
const POINT_CATS: LegendCategory[] = ['best_stableford_90d'];
const BIRDIE_CATS: LegendCategory[] = ['most_birdies_90d'];
const ROUND_CATS: LegendCategory[] = ['most_rounds_90d'];

function gapUnit(category: LegendCategory, count: number): string {
  const s = count === 1;
  if (STROKE_CATS.includes(category)) return s ? 'stroke' : 'strokes';
  if (POINT_CATS.includes(category)) return 'pts';
  if (BIRDIE_CATS.includes(category)) return s ? 'birdie' : 'birdies';
  if (ROUND_CATS.includes(category)) return s ? 'round' : 'rounds';
  return 'vs hcp';
}

/**
 * Picks the best footer cue for a course given the holders + user context.
 * Pure function.
 */
export function getFooterCue(
  holders: Map<LegendCategory, CourseLegendHolderRow>,
): FooterCue {
  const rows = Array.from(holders.values());
  const youCount = rows.filter((r) => r.is_self).length;

  if (youCount === 5) {
    return { label: 'You hold all 5 records', intent: 'defend' };
  }
  if (youCount >= 2) {
    return { label: `Defend your ${youCount} records`, intent: 'defend' };
  }
  if (youCount === 1) {
    return { label: 'Defend your record', intent: 'defend' };
  }

  const podiumRows = rows
    .filter((r) => r.your_rank != null && r.your_rank > 1 && r.your_rank <= 3)
    .sort((a, b) => (a.your_rank ?? 99) - (b.your_rank ?? 99));

  if (podiumRows.length > 0) {
    const row = podiumRows[0];
    const catLabel = CAT_LABEL[row.category];
    if (row.your_gap_to_first != null && row.your_gap_to_first > 0) {
      const gap = row.your_gap_to_first;
      const gapNum =
        row.category === 'best_score_diff' ? gap : Math.round(gap);
      const unit = gapUnit(row.category, gapNum);
      const gapStr =
        row.category === 'best_score_diff' ? gap.toFixed(1) : String(Math.round(gap));
      return {
        label: `${gapStr} ${unit} from ${catLabel} #1`,
        intent: 'chase',
      };
    }
    return { label: `You're #${row.your_rank} in ${catLabel}`, intent: 'chase' };
  }

  const anyRanked = rows.some((r) => r.your_rank != null);
  if (anyRanked) {
    return { label: 'See full leaderboards', intent: 'neutral' };
  }

  return { label: 'See who holds the records', intent: 'neutral' };
}

export const FOOTER_INTENT_STYLE: Record<
  FooterCueIntent,
  { color: string; dotColor: string }
> = {
  defend: { color: '#FBBC2E', dotColor: '#FBBC2E' },
  chase: { color: '#F7931E', dotColor: '#F7931E' },
  neutral: { color: 'var(--hcp-t-60)', dotColor: 'var(--hcp-t-40)' },
};
