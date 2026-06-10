import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';

export type FooterCueIntent = 'defend' | 'chase' | 'neutral';

export interface FooterCue {
  label: string;
  intent: FooterCueIntent;
}

const CAT_LABEL: Record<LegendCategory, string> = {
  best_score_diff_90d:      'Score',
  best_score_diff_all_time: 'Score',
  most_birdies_90d:         'Birdie',
  most_birdies_all_time:    'Birdie',
  lowest_gross_90d:         'Gross',
  lowest_gross_all_time:    'Gross',
  best_stableford_90d:      'Stableford',
  best_stableford_all_time: 'Stableford',
  most_eagles_90d:          'Eagle',
  most_eagles_all_time:     'Eagle',
  most_aces_90d:            'Ace',
  most_aces_all_time:       'Ace',
  most_albatrosses_90d:     'Albatross',
  most_albatrosses_all_time:'Albatross',
};

function isAlbatrosses(c: LegendCategory): boolean {
  return c === 'most_albatrosses_90d' || c === 'most_albatrosses_all_time';
}

function isScoreDiff(c: LegendCategory): boolean {
  return c === 'best_score_diff_90d' || c === 'best_score_diff_all_time';
}
function isGross(c: LegendCategory): boolean {
  return c === 'lowest_gross_90d' || c === 'lowest_gross_all_time';
}
function isStableford(c: LegendCategory): boolean {
  return c === 'best_stableford_90d' || c === 'best_stableford_all_time';
}
function isBirdies(c: LegendCategory): boolean {
  return c === 'most_birdies_90d' || c === 'most_birdies_all_time';
}
function isEagles(c: LegendCategory): boolean {
  return c === 'most_eagles_90d' || c === 'most_eagles_all_time';
}
function isAces(c: LegendCategory): boolean {
  return c === 'most_aces_90d' || c === 'most_aces_all_time';
}

function gapUnit(category: LegendCategory, count: number): string {
  const s = count === 1;
  if (isGross(category)) return s ? 'stroke' : 'strokes';
  if (isStableford(category)) return 'pts';
  if (isBirdies(category)) return s ? 'birdie' : 'birdies';
  
  if (isEagles(category)) return s ? 'eagle' : 'eagles';
  if (isAces(category)) return s ? 'ace' : 'aces';
  if (isAlbatrosses(category)) return s ? 'albatross' : 'albatrosses';
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
  const total = rows.length;
  const youCount = rows.filter((r) => r.is_self).length;

  if (total > 0 && youCount === total) {
    return { label: `You hold all ${total} records`, intent: 'defend' };
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
      const gapNum = isScoreDiff(row.category) ? gap : Math.round(gap);
      const unit = gapUnit(row.category, gapNum);
      const gapStr = isScoreDiff(row.category)
        ? gap.toFixed(1)
        : String(Math.round(gap));
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
