/** All-time legend categories eligible for the club golfer identity line. */
export const CLUB_RECORD_CATEGORIES = [
  'most_albatrosses_all_time',
  'most_aces_all_time',
  'most_eagles_all_time',
  'best_stableford_all_time',
  'most_birdies_all_time',
  'lowest_gross_all_time',
  'lowest_gross_women_all_time',
  'best_score_diff_all_time',
  'most_rounds_all_time',
] as const;

export type ClubRecordCategory = (typeof CLUB_RECORD_CATEGORIES)[number];

const RARITY = new Map<ClubRecordCategory, number>(
  CLUB_RECORD_CATEGORIES.map((category, index) => [category, index]),
);

export function isClubRecordCategory(value: string | null): value is ClubRecordCategory {
  return value != null && RARITY.has(value as ClubRecordCategory);
}

interface AssignmentCandidate {
  userId: string;
  recordCategories: readonly ClubRecordCategory[];
}

/**
 * Assign one distinct identity claim per visible golfer. Scarce claims keep
 * their only owner: golfers with fewer options choose first. Remaining choices
 * use the fixed base-wide rarity order above. Stable shelf position and user ID
 * break ties, so database/fetch order cannot alter the result.
 */
export function assignClubRecordCategories(
  golfers: readonly AssignmentCandidate[],
): Map<string, ClubRecordCategory> {
  const ordered = golfers
    .map((golfer, shelfIndex) => ({
      userId: golfer.userId,
      shelfIndex,
      options: [...new Set(golfer.recordCategories)]
        .filter(isClubRecordCategory)
        .sort((a, b) => (RARITY.get(a) ?? 99) - (RARITY.get(b) ?? 99)),
    }))
    .sort(
      (a, b) =>
        a.options.length - b.options.length ||
        a.shelfIndex - b.shelfIndex ||
        a.userId.localeCompare(b.userId),
    );

  const claimed = new Set<ClubRecordCategory>();
  const assignment = new Map<string, ClubRecordCategory>();
  for (const golfer of ordered) {
    const category = golfer.options.find((option) => !claimed.has(option));
    if (!category) continue;
    claimed.add(category);
    assignment.set(golfer.userId, category);
  }
  return assignment;
}
