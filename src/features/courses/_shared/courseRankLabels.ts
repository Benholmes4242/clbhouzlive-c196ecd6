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
/** RankList -> on-screen list name. The one home for these four names. */
export const RANK_LIST_LABEL: Record<RankList, string> = {
  global: 'World',
  gbi: 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

export function courseRankLabels(entries: Array<{ list: RankList; rank: number }>): string[] {
  return entries
    .filter((e) => Number.isFinite(e.rank) && e.rank >= 1 && e.rank <= 100)
    .sort((a, b) => ORDER.indexOf(a.list) - ORDER.indexOf(b.list))
    .map((e) => `#${e.rank} ${RANK_LIST_LABEL[e.list]}`);
}

/**
 * THE ONE MASTHEAD KICKER RULE (BRIEF_REVIEW_STEP_ONE_COURSE_HERO §2).
 *
 * Every course masthead — the course page's CourseTitleOverlay and the review
 * composer's photo hero — builds its kicker here: the sub-country (or region),
 * then the rank labels, joined with " · ". The country decides what "regional"
 * means (the rule CourseRankBadges established): GB&I countries read the GB&I
 * list, the USA reads the USA list, Continental Europe reads the Europe list.
 * Moved out of CourseTitleOverlay so the two surfaces can never disagree.
 */
export interface MastheadKickerCourse {
  sub_country?: string | null;
  region?: string | null;
  country?: string | null;
}
export interface MastheadKickerStanding {
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
}

const GBI_COUNTRIES = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'];
const USA_COUNTRIES = ['United States', 'USA'];

export function courseMastheadKicker(
  course: MastheadKickerCourse,
  standing: MastheadKickerStanding | null | undefined,
): string | null {
  const entries: Array<{ list: RankList; rank: number }> = [];
  if (standing?.globalRank) entries.push({ list: 'global', rank: standing.globalRank });
  const c = course.country ?? '';
  if (GBI_COUNTRIES.includes(c) && standing?.regionalRank) entries.push({ list: 'gbi', rank: standing.regionalRank });
  else if (USA_COUNTRIES.includes(c) && standing?.usaRank) entries.push({ list: 'usa', rank: standing.usaRank });
  else if (c === 'Continental Europe' && standing?.regionalRank) entries.push({ list: 'europe', rank: standing.regionalRank });
  return [course.sub_country || course.region, ...courseRankLabels(entries)].filter(Boolean).join(' · ') || null;
}
