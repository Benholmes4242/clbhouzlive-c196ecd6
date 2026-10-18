/** REVIEWS_STATE_3: consume only communitySample's excluding rows and means.
 * Ben's caution ruling supersedes the inclusive spread sentence in the mock.
 * A meaningful category contrast is at least one displayed tenth wider; ties
 * preserve Design/Condition/Clubhouse/Facilities order. No deferred statistics. */
import type { reviewsCommunitySample } from './communitySample';
import { hasCommunityAverage } from './sampleRules';

export type ReviewsCommunity = ReturnType<typeof reviewsCommunitySample>;
export const spelledRatings = (count: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][count] ?? String(count);
export const capitalizedRatings = (count: number) => { const word = spelledRatings(count); return word.charAt(0).toUpperCase() + word.slice(1); };

export function fewReviewFacts(community: ReviewsCommunity) {
  if (!hasCommunityAverage(community.ratingCount) || community.score == null) return null;
  const ratings = community.communityRows.flatMap(row => row.rating == null ? [] : [row.rating]);
  const spread = Math.round((Math.max(...ratings) - Math.min(...ratings)) * 10) / 10;
  const count = spelledRatings(community.ratingCount);
  const caution = spread === 0
    ? `${capitalizedRatings(community.ratingCount)} people agreeing is not the same as a course being an ${community.score.toFixed(1)}.`
    : `They sit inside ${spread.toFixed(1)} of each other, but ${count} people agreeing is not the same as a course being an ${community.score.toFixed(1)}.`;
  const keys = [
    ['design', 'design_score', 'Design'], ['condition', 'condition_score', 'Condition'],
    ['clubhouse', 'clubhouse_score', 'Clubhouse'], ['facilities', 'facilities_score', 'Facilities'],
  ] as const;
  const bands = keys.flatMap(([key, field, label]) => {
    const values = community.communityRows.map(row => row[field]).filter((value): value is number => value != null && Number.isFinite(value));
    const mean = community.categories[key];
    if (!values.length || mean == null) return [];
    const low = Math.min(...values), high = Math.max(...values);
    return [{ key, label, mean, low, high, gap: Math.round((high - low) * 10) / 10 }];
  });
  const byGap = [...bands].sort((a, b) => a.gap - b.gap);
  const tightest = byGap[0];
  const widest = byGap.find(band => band.gap === byGap.at(-1)?.gap);
  const finding = tightest && widest && widest.gap - tightest.gap >= 0.099
    ? { tightest, widest } : null;
  const highest = [...bands].sort((a, b) => b.mean - a.mean)[0];
  return { count: community.ratingCount, spread, caution, bands, finding, highest };
}

export function partitionKnownReviews<T extends { user_id: string }>(rows: readonly T[], knownIds: ReadonlySet<string>) {
  return { known: rows.filter(row => knownIds.has(row.user_id)), others: rows.filter(row => !knownIds.has(row.user_id)) };
}