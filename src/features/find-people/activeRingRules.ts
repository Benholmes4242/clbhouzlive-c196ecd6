/**
 * ACTIVE RING — the short orange "when" line under a ringed avatar
 * (active-ring-signed-off.html). Pure: the caller passes `now`.
 */
import { shortCourseName } from '@/lib/courses/shortCourseName';

export type RecentActivityKind = 'round' | 'review' | 'post';

export interface RecentActivity {
  actor_id: string;
  kind: RecentActivityKind;
  post_id: string;
  created_at: string;
  course_name: string | null;
}

export interface ActivityLine {
  key: string;
  vars: Record<string, string | number>;
  def: string;
}

export function activityLine(activity: RecentActivity, now: Date): ActivityLine {
  const course = activity.course_name ? shortCourseName(activity.course_name) : '';
  if (activity.kind === 'round') {
    return course
      ? { key: 'findPeople.active.played', vars: { course }, def: `Played ${course}` }
      : { key: 'findPeople.active.playedRound', vars: {}, def: 'Played a round' };
  }
  if (activity.kind === 'review') {
    return course
      ? { key: 'findPeople.active.reviewed', vars: { course }, def: `Reviewed ${course}` }
      : { key: 'findPeople.active.postedReview', vars: {}, def: 'Posted a review' };
  }
  const ms = Math.max(0, now.getTime() - new Date(activity.created_at).getTime());
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return { key: 'findPeople.active.postedJustNow', vars: {}, def: 'Posted just now' };
  if (minutes < 60) {
    return { key: 'findPeople.active.postedMinutes', vars: { n: minutes }, def: `Posted ${minutes}m ago` };
  }
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return { key: 'findPeople.active.postedYesterday', vars: {}, def: 'Posted yesterday' };
  return { key: 'findPeople.active.postedHours', vars: { n: hours }, def: `Posted ${hours}h ago` };
}
