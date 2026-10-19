/** REVIEWS_STATE_3: consume only communitySample's excluding rows and means.
 * REVIEWS_HEADER_1 retains count, overall spread and ordered min/max/mean bands;
 * fixed category headings leave no consumer for finding, highest or gap ranking. */
import type { reviewsCommunitySample } from './communitySample';
import { hasCommunityAverage } from './sampleRules';

export type ReviewsCommunity = ReturnType<typeof reviewsCommunitySample>;
export const spelledRatings = (count: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][count] ?? String(count);
export const capitalizedRatings = (count: number) => { const word = spelledRatings(count); return word.charAt(0).toUpperCase() + word.slice(1); };

export function fewReviewFacts(community: ReviewsCommunity) {
  if (!hasCommunityAverage(community.ratingCount) || community.score == null) return null;
  const ratings = community.communityRows.flatMap(row => row.rating == null ? [] : [row.rating]);
  const spread = Math.round((Math.max(...ratings) - Math.min(...ratings)) * 10) / 10;
  const keys = [
    ['design', 'design_score', 'Design'], ['condition', 'condition_score', 'Condition'],
    ['clubhouse', 'clubhouse_score', 'Clubhouse'], ['facilities', 'facilities_score', 'Facilities'],
  ] as const;
  const bands = keys.flatMap(([key, field, label]) => {
    const values = community.communityRows.map(row => row[field]).filter((value): value is number => value != null && Number.isFinite(value));
    const mean = community.categories[key];
    if (!values.length || mean == null) return [];
    const low = Math.min(...values), high = Math.max(...values);
    return [{ key, label, mean, low, high }];
  });
  return { count: community.ratingCount, spread, bands };
}

export function partitionKnownReviews<T extends { user_id: string }>(rows: readonly T[], knownIds: ReadonlySet<string>) {
  return { known: rows.filter(row => knownIds.has(row.user_id)), others: rows.filter(row => !knownIds.has(row.user_id)) };
}