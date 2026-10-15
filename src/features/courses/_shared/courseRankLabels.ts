/**
 * THE ONE COURSE RANK FORM (BRIEF_COURSE_RANK_ONE_FORM).
 *
 * Course ranks print as TEXT ("#16 World", "#14 GB&I"), never as a flag beside
 * a number. Do not re-add flags: GB&I is a golf region, not a country, so any
 * flag (the Union Flag included) misstates courses in the Republic of Ireland,
 * and an EU flag misstates Switzerland, Norway and Turkey. A bare glyph plus a
 * number also does not say "rank", and flags do not extend to new lists.
 *
 * Rules carried over from CourseRankBadges: only ranks 1-100 count; global
 * first, then the regional one; [] when nothing qualifies.
 */
export type RankList = 'global' | 'gbi' | 'usa' | 'europe';

/** Database list slug -> RankList. The one home for this map. */
export const RANK_LIST_BY_SLUG: Record<string, RankList> = { global: 'global', 'gb-i': 'gbi', usa: 'usa', europe: 'europe' };

const ORDER: RankList[] = ['global', 'gbi', 'usa', 'europe'];
const LABEL: Record<RankList, string> = {
  global: 'World',
  gbi: 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

export function courseRankLabels(entries: Array<{ list: RankList; rank: number }>): string[] {
  return entries
    .filter((e) => Number.isFinite(e.rank) && e.rank >= 1 && e.rank <= 100)
    .sort((a, b) => ORDER.indexOf(a.list) - ORDER.indexOf(b.list))
    .map((e) => `#${e.rank} ${LABEL[e.list]}`);
}
