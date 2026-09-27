import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

/**
 * WHERE YOU STAND — the rules, in one place, reading ONLY RPC columns.
 *
 * THE UI COMPUTES NOTHING. No medal is inferred, no field size is counted, no
 * gap is reconstructed from a rank. The single arithmetic this file performs is
 * the one the brief names — tied_with, and the absolute difference between two
 * columns that are both returned.
 */

/** The only derived number, and the brief defines it exactly. */
export function tiedWith(row: MemberStandingRow): number {
  return row.field_size - row.behind_count - row.ahead_count - 1;
}

export type DiscState = 'gold' | 'silver' | 'bronze' | 'placed' | 'plain';

/**
 * FOUR STATES, driven ONLY by medal_earned and rank.
 *
 * 'placed' is NOT optional: without it 5th of 17 — twelve players beaten —
 * renders identically to 1st of 1, the exact inversion this design prevents.
 */
export function discState(row: MemberStandingRow): DiscState {
  if (!row.medal_earned) return 'plain';
  if (row.rank === 1) return 'gold';
  if (row.rank === 2) return 'silver';
  if (row.rank === 3) return 'bronze';
  return 'placed';
}

/** Score differentials carry one decimal; everything else is a whole number. */
function decimals(category: string): number {
  return category.includes('score_diff') ? 1 : 0;
}

/** Stableford is the ONLY category carrying a unit. */
function unit(category: string): string {
  return category.includes('stableford') ? ' pts' : '';
}

export function formatValue(row: MemberStandingRow): string {
  if (row.value == null) return '—';
  return `${row.value.toFixed(decimals(row.category))}${unit(row.category)}`;
}

/**
 * A gap is a difference between two returned columns, at the value's own
 * precision. BARE NUMBER — the VALUE above already carries its unit, and the
 * margin never does.
 */
function gap(row: MemberStandingRow, other: number | null): string | null {
  if (row.value == null || other == null) return null;
  return Math.abs(row.value - other).toFixed(decimals(row.category));
}

/**
 * ONE line under the value, picked in the brief's order. Returns null only when
 * a named column the chosen line needs is absent, so nothing is ever guessed.
 */
export function standingLine(row: MemberStandingRow): string | null {
  const tied = tiedWith(row);
  if (row.field_size === 1) return 'Only card on this board';
  if (row.ahead_count === 0 && row.behind_count === 0) return 'Level with everyone here';
  if (row.ahead_count === 0) {
    const clear = gap(row, row.next_value);
    if (tied > 0) return clear ? `Shared with ${tied} · clear by ${clear}` : `Shared with ${tied}`;
    return clear ? `Clear by ${clear}` : null;
  }
  const off = gap(row, row.better_value);
  if (!off) return null;
  let line = `${off} off the player above`;
  if (row.leader_value != null && row.better_value != null && row.leader_value !== row.better_value) {
    const lead = gap(row, row.leader_value);
    if (lead) line += ` · ${lead} off the lead`;
  }
  return line;
}

export type StandingWindow = 'all' | '90d';

/** The seven boards, in the order the You-tab grid renders them. */
export const BOARD_ORDER = [
  'lowest_gross',
  'best_score_diff',
  'best_stableford',
  'most_birdies',
  'most_eagles',
  'most_aces',
  'most_rounds',
] as const;
export type BoardKey = (typeof BOARD_ORDER)[number];

export const BOARD_LABELS: Record<BoardKey, string> = {
  lowest_gross: 'Lowest gross',
  best_score_diff: 'Best differential',
  best_stableford: 'Best stableford',
  most_birdies: 'Birdies',
  most_eagles: 'Eagles',
  most_aces: 'Holes in one',
  most_rounds: 'Rounds played',
};

/** category -> the board it belongs to and the window it covers. ONE table. */
export const CATEGORY_BOARD: Record<string, { board: BoardKey; window: StandingWindow }> = {
  lowest_gross_all_time: { board: 'lowest_gross', window: 'all' },
  lowest_gross_90d: { board: 'lowest_gross', window: '90d' },
  best_score_diff_all_time: { board: 'best_score_diff', window: 'all' },
  best_score_diff_90d: { board: 'best_score_diff', window: '90d' },
  best_stableford_all_time: { board: 'best_stableford', window: 'all' },
  best_stableford_90d: { board: 'best_stableford', window: '90d' },
  most_rounds_all_time: { board: 'most_rounds', window: 'all' },
  most_rounds_90d: { board: 'most_rounds', window: '90d' },
  most_birdies_all_time: { board: 'most_birdies', window: 'all' },
  most_birdies_90d: { board: 'most_birdies', window: '90d' },
  most_eagles_all_time: { board: 'most_eagles', window: 'all' },
  most_eagles_90d: { board: 'most_eagles', window: '90d' },
  most_aces_all_time: { board: 'most_aces', window: 'all' },
};

/** Derived from the two tables above — Trophy Room strings stay byte-identical. */
export function categoryLabel(category: string): string {
  const m = CATEGORY_BOARD[category];
  if (!m) return category.replace(/_/g, ' ');
  return m.window === '90d' ? `${BOARD_LABELS[m.board]} · 90 days` : BOARD_LABELS[m.board];
}

export interface StandingsCourseGroup {
  courseId: string;
  courseName: string;
  /** is_tenure = false. Competitive placings. */
  standings: MemberStandingRow[];
  /** is_tenure = true. Attendance: shown, never awarded. */
  tenure: MemberStandingRow[];
}

/**
 * Courses in the order the RPC returns them — the first row of a course sets
 * its position, and the rows inside a course keep their arrival order too.
 */
export function groupStandings(rows: MemberStandingRow[]): StandingsCourseGroup[] {
  const order: string[] = [];
  const byCourse = new Map<string, StandingsCourseGroup>();
  for (const row of rows) {
    let group = byCourse.get(row.course_id);
    if (!group) {
      group = { courseId: row.course_id, courseName: row.course_name, standings: [], tenure: [] };
      byCourse.set(row.course_id, group);
      order.push(row.course_id);
    }
    (row.is_tenure ? group.tenure : group.standings).push(row);
  }
  return order.map((id) => byCourse.get(id)!);
}

/**
 * The course sub-line, from the data only. Board count is the rows themselves,
 * and the best placing is the first row's own rank and field_size — no round
 * count is invented, because the RPC does not return one.
 */
export function courseSubline(group: StandingsCourseGroup): string {
  const rows = [...group.standings, ...group.tenure];
  const boards = `${rows.length} ${rows.length === 1 ? 'board' : 'boards'}`;
  const best = group.standings[0];
  if (!best) return boards;
  return `${boards} · best ${best.rank} of ${best.field_size}`;
}
