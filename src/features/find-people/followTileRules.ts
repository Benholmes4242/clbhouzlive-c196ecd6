/**
 * FOLLOW TILE "when" LINE (BRIEF_FOLLOW_TILE_POSTED_AGE).
 *
 * get_follow_tile_media returns a person's latest photo or video of ANY age,
 * so the tile cannot reuse activityLine — that helper was written for the
 * active ring and calls anything 24 hours or older "Posted yesterday".
 * The active ring and FindPeoplePage keep activityLine unchanged; only the
 * follow tiles read this. Pure: the caller passes `now`.
 */
import type { ActivityLine } from './activeRingRules';

export function tilePostedLine(postedAt: string, now: Date): ActivityLine {
  const ms = Math.max(0, now.getTime() - new Date(postedAt).getTime());
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return { key: 'findPeople.active.postedJustNow', vars: {}, def: 'Posted just now' };
  if (minutes < 60) return { key: 'findPeople.active.postedMinutes', vars: { n: minutes }, def: `Posted ${minutes}m ago` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'findPeople.active.postedHours', vars: { n: hours }, def: `Posted ${hours}h ago` };
  const days = Math.floor(hours / 24);
  if (days < 2) return { key: 'findPeople.active.postedYesterday', vars: {}, def: 'Posted yesterday' };
  if (days < 7) return { key: 'findPeople.tile.postedDays', vars: { count: days }, def: `Posted ${days} days ago` };
  if (days < 35) {
    const weeks = Math.floor(days / 7);
    return { key: 'findPeople.tile.postedWeeks', vars: { count: weeks }, def: `Posted ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago` };
  }
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30));
    return { key: 'findPeople.tile.postedMonths', vars: { count: months }, def: `Posted ${months} ${months === 1 ? 'month' : 'months'} ago` };
  }
  return { key: 'findPeople.tile.postedOverYear', vars: {}, def: 'Posted over a year ago' };
}
