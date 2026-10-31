/** THE POST PAGE, REBUILT AROUND GOLF — pure rules shared by the composer,
 * the feed card and their tests. No reads, no writes: every figure here comes
 * from the caller, so the page, the preview and the feed card cannot drift.
 *
 * - One tag per photo: a hole OR a place, never both.
 * - Course from date: a capture day with EXACTLY ONE distinct synced-round
 *   course pre-tags it; none or two-plus pre-tag nothing. The round only finds
 *   the course — it is never attached, and no whs_score_id is ever set.
 * - Played with: up to MAX_PLAYED_WITH people, never the poster.
 */
import type { CoursePlace } from '@/lib/courseMedia/places';
import { PLACE_LABELS } from '@/components/course-media-tab/ShotTagChoices';

export type ShotTag = { hole: number } | { place: CoursePlace };
export const MAX_PLAYED_WITH = 8;
export const MAX_RECENT_COURSES = 4;

/** post_visibility values create_post_v2 accepts, with their member labels. */
export const VISIBILITY_OPTIONS = [
  { value: 'anyone', label: 'Everyone' },
  { value: 'followers', label: 'Followers' },
  { value: 'private', label: 'Only you' },
] as const;
export type PostVisibility = typeof VISIBILITY_OPTIONS[number]['value'];
export const visibilityLabel = (v: PostVisibility) => VISIBILITY_OPTIONS.find((o) => o.value === v)?.label ?? 'Everyone';

export const isHoleTag = (t: ShotTag | null | undefined): t is { hole: number } => !!t && 'hole' in t;
export function shotTagLabel(t: ShotTag | null | undefined): string | null {
  if (!t) return null;
  return isHoleTag(t) ? `Hole ${t.hole}` : PLACE_LABELS[t.place];
}

/** "Sundridge Park Golf Club (West Course)" -> "Sundridge Park". */
export function shortCourseName(name: string): string {
  return name.replace(/ \(.*\)/, '').replace(/ Golf Club$/i, '').replace(' Golf Club', '').trim();
}

export function holeLine(courseName: string | null, holeShots: number): { count: string | null; text: string } | null {
  if (!courseName) return null;
  if (holeShots === 0) return { count: null, text: "Tap a photo to say what's in it. Hole shots also appear on that hole's page." };
  const one = holeShots === 1;
  return {
    count: `${holeShots} ${one ? 'shot' : 'shots'}`,
    text: ` will also appear on ${shortCourseName(courseName)}'s hole ${one ? 'page' : 'pages'}, credited to you.`,
  };
}

export function shareSubLine(names: readonly string[], holeShots: number): string {
  const bits: string[] = [];
  if (names.length) bits.push(`${names.join(', ')} will be notified`);
  if (holeShots) bits.push(`${holeShots} hole ${holeShots === 1 ? 'shot' : 'shots'} added to the course`);
  return bits.join(' · ') || 'Shares to your Clubhouse feed';
}

/** One distinct course that day pre-tags; anything else pre-tags nothing. */
export function roundCourseForDay(rows: ReadonlyArray<{ course_id: string | null }>): string | null {
  const ids = [...new Set(rows.map((r) => r.course_id).filter((id): id is string => !!id))];
  return ids.length === 1 ? ids[0] : null;
}

/** "Your round on Sat 25 Oct, the day these were taken". Day is YYYY-MM-DD. */
export function roundReason(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  return `Your round on ${wd} ${date.getDate()} ${mo}, the day these were taken`;
}

export interface WithCandidate { id: string; name: string; avatarUrl: string | null; sameRound: boolean; lastInteraction: string }
/** Same course + same day first, then most recent mutual interaction; never self; cap eight. */
export function rankPlayedWith(rows: readonly WithCandidate[], selfId: string | null): WithCandidate[] {
  return rows.filter((r) => r.id !== selfId)
    .sort((a, b) => Number(b.sameRound) - Number(a.sameRound) || b.lastInteraction.localeCompare(a.lastInteraction))
    .slice(0, MAX_PLAYED_WITH);
}

/** Toggle a member in the tagged list: never self, never past eight. */
export function toggleWith<T extends { id: string }>(list: readonly T[], person: T, selfId: string | null): T[] {
  if (person.id === selfId) return [...list];
  if (list.some((p) => p.id === person.id)) return list.filter((p) => p.id !== person.id);
  if (list.length >= MAX_PLAYED_WITH) return [...list];
  return [...list, person];
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
/** "with Danny" / "with Danny and Thomas" / "with Danny and 2 others". */
export function withLine(names: readonly string[]): string | null {
  const f = names.map(firstName);
  if (f.length === 0) return null;
  if (f.length === 1) return `with ${f[0]}`;
  if (f.length === 2) return `with ${f[0]} and ${f[1]}`;
  return `with ${f[0]} and ${f.length - 1} others`;
}

export interface SlideTag { hole?: number; par?: number | null; place?: CoursePlace }
/** "Hole 7 · Par 4" (par only when known) or the place label. */
export function slideChip(t: SlideTag | null | undefined): string | null {
  if (!t) return null;
  if (t.hole != null) return t.par ? `Hole ${t.hole} · Par ${t.par}` : `Hole ${t.hole}`;
  return t.place ? PLACE_LABELS[t.place] : null;
}
