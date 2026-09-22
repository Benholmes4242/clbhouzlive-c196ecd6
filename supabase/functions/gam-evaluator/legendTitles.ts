// BRIEF_CONTESTED_TITLES — a title must be won against a field.
//
// gam_user_milestones(metric='legend_titles') used to count every current rank-1
// row a member held. With 14 categories, a course nobody else has played was
// worth 14 titles on its own — 150 of 258 all-time boards have exactly one
// claimant, and the metric named the wrong member as the most decorated player.
//
// The rule: a rank-1 row only counts when its board has MORE THAN ONE current
// claimant. Exactly `> 1` — no larger floor. Joint firsts COUNT: a shared record
// was still won against a field, and the field is what the rule tests.
//
// Pure helpers so the count and the badge tier can be derived from one number in
// one place, and so the rule is provable without a database.

export interface BoardKeyRow {
  course_id: string;
  category: string;
}

/** Stable key for one board (one course x one category). */
export function boardKey(row: BoardKeyRow): string {
  return `${row.course_id}|${row.category}`;
}

/**
 * Keys of the boards that have more than one current claimant.
 * `claimantRows` must be the CURRENT claimant rows for the boards under test —
 * every rank, not just rank 1, because the field is what makes a title contested.
 */
export function contestedBoardKeys(claimantRows: BoardKeyRow[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of claimantRows) {
    const key = boardKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const contested = new Set<string>();
  for (const [key, n] of counts) if (n > 1) contested.add(key);
  return contested;
}

/**
 * THE number. Both the gam_user_milestones write and the badge tier read this
 * single value — they are never computed separately.
 *
 * @param userRankOneBoards the member's own current rank-1 rows
 * @param claimantRows      every current claimant row on those boards
 */
export function countContestedTitles(
  userRankOneBoards: BoardKeyRow[],
  claimantRows: BoardKeyRow[],
): number {
  const contested = contestedBoardKeys(claimantRows);
  const seen = new Set<string>();
  for (const row of userRankOneBoards) {
    const key = boardKey(row);
    if (contested.has(key)) seen.add(key);
  }
  return seen.size;
}
