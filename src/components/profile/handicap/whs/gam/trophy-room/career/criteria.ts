/**
 * Criteria helpers for the career record.
 *
 * NAMED PARTS: some counters are a set of named things rather than a number.
 * Four Seasons is the case that matters -- "3" is opaque, "Spring, Summer,
 * Autumn so far" is an instruction. Parts are derived from the rounds the
 * sheet ALREADY holds (gam_round_stats play dates). NO NEW QUERY.
 *
 * Globetrotter (distinct_countries) and Continental (distinct_continents)
 * are NOT derivable here: gam_round_stats carries no country or continent
 * column, so those rows fall back to the count line.
 *
 * Season naming is northern-hemisphere here because the round rows carry no
 * country to pick a hemisphere from; seasonClock.ts owns the hemisphere-aware
 * naming used by the Ascent season surfaces.
 */
import type { CareerRoundRow } from '@/hooks/gam/useCareerRounds';

const SEASON_ORDER = ['Winter', 'Spring', 'Summer', 'Autumn'] as const;

function seasonOfMonth(month: number): (typeof SEASON_ORDER)[number] {
  if (month <= 1 || month === 11) return 'Winter';
  if (month <= 4) return 'Spring';
  if (month <= 7) return 'Summer';
  return 'Autumn';
}

function monthOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (m) return Number(m[2]) - 1;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getMonth();
}

export interface NamedParts {
  /** Parts reached, in a stable order. */
  parts: string[];
  /** Total parts in the set, so the caller knows when it is complete. */
  total: number;
}

/**
 * Named parts for a badge, or null when the set is not derivable from the
 * loaded rounds. Returning null is deliberate: the row falls back to the
 * count rather than asserting a set it cannot see.
 */
export function namedPartsFor(
  badgeId: string,
  rounds: CareerRoundRow[],
): NamedParts | null {
  if (badgeId !== 'four_seasons') return null;
  const hit = new Set<string>();
  for (const row of rounds) {
    const month = monthOf(row.play_date);
    if (month === null) continue;
    hit.add(seasonOfMonth(month));
  }
  return {
    parts: SEASON_ORDER.filter((s) => hit.has(s)),
    total: SEASON_ORDER.length,
  };
}

export interface SeasonCut {
  year: number;
  rounds: number;
  birdies: number;
  /** Lowest gross posted this season, or null when nothing is scored. */
  best: number | null;
}

/**
 * The current-season cut. The boundary is the CALENDAR YEAR: the app's own
 * season definition (seasonClock.ts) is a calendar QUARTER, which does not
 * match a "SEASON {year}" heading, so the year is used and reported.
 */
export function seasonCut(rounds: CareerRoundRow[], year: number): SeasonCut {
  let count = 0;
  let birdies = 0;
  let best: number | null = null;
  for (const row of rounds) {
    const m = /^(\d{4})/.exec(row.play_date ?? '');
    if (!m || Number(m[1]) !== year) continue;
    count += 1;
    birdies += Number(row.birdies ?? 0);
    const gross = row.gross_score;
    if (gross && (best === null || gross < best)) best = gross;
  }
  return { year, rounds: count, birdies, best };
}
