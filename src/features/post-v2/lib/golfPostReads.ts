/** Composer reads for the golf post page. Pure decisions live in
 * golfPostRules.ts; this file only fetches.
 *
 * THE SUGGESTION QUERY (Played with):
 *   1. follows where follower_actor_type='personal', follower_actor_id=me,
 *      following_actor_type='personal'            -> people I follow
 *   2. follows where following_actor_type='personal', following_actor_id=me,
 *      follower_actor_type='personal', follower_actor_id IN (1)
 *                                                 -> of those, who follow me back
 *   3. when the page found a round course/day: gam_round_stats where
 *      user_id IN (2), course_id = that course, play_date = that day
 *                                                 -> sameRound
 *   4. user_profiles for names/avatars.
 *   Rank: sameRound first, then most recent mutual interaction — the later of
 *   the two follow rows' created_at. Eight at most, never the poster.
 */
import { supabase } from '@/integrations/supabase/client';
import { searchMentionMembers } from '@/components/mentions/MentionsComposerInput';
import { readHolePhotoExif } from '@/lib/courseMedia/holePhotoExif';
import type { StageCourse } from '../hooks/useStageComposer';
import { MAX_RECENT_COURSES, rankPlayedWith, roundCourseForDay, type WithCandidate } from './golfPostRules';

/** DateTimeOriginal day of the first item, or null (videos carry none here). */
export async function firstCaptureDay(item: { type: 'image' | 'video'; file?: File } | undefined): Promise<string | null> {
  if (!item?.file || item.type !== 'image') return null;
  try { return (await readHolePhotoExif(item.file)).captureDay; } catch { return null; }
}

async function coursesById(ids: readonly string[]): Promise<StageCourse[]> {
  if (!ids.length) return [];
  const { data } = await supabase.from('golf_courses').select('id, name, country').in('id', ids as string[]);
  const byId = new Map((data ?? []).map((c) => [c.id, { id: c.id, name: c.name, country: c.country ?? null } as StageCourse]));
  return ids.map((id) => byId.get(id)).filter((c): c is StageCourse => !!c);
}

/** The ONE course of the member's synced rounds that day, else null. */
export async function findRoundCourse(userId: string, day: string): Promise<StageCourse | null> {
  const { data, error } = await supabase.from('gam_round_stats').select('course_id').eq('user_id', userId).eq('play_date', day);
  if (error) return null;
  const id = roundCourseForDay(data ?? []);
  return id ? (await coursesById([id]))[0] ?? null : null;
}

/** Up to four distinct courses from the member's most recent rounds. */
export async function fetchRecentCourses(userId: string): Promise<StageCourse[]> {
  const { data } = await supabase.from('gam_round_stats').select('course_id, play_date').eq('user_id', userId).order('play_date', { ascending: false }).limit(60);
  const ids = [...new Set((data ?? []).map((r) => r.course_id).filter((id): id is string => !!id))].slice(0, MAX_RECENT_COURSES);
  return coursesById(ids);
}

export async function fetchPlayedWithSuggestions(userId: string, round: { courseId: string; day: string } | null): Promise<WithCandidate[]> {
  const { data: out } = await supabase.from('follows').select('following_actor_id, created_at')
    .eq('follower_actor_type', 'personal').eq('follower_actor_id', userId).eq('following_actor_type', 'personal').limit(1000);
  const outIds = (out ?? []).map((r) => r.following_actor_id).filter((id) => id !== userId);
  if (!outIds.length) return [];
  const { data: back } = await supabase.from('follows').select('follower_actor_id, created_at')
    .eq('following_actor_type', 'personal').eq('following_actor_id', userId).eq('follower_actor_type', 'personal')
    .in('follower_actor_id', outIds);
  const outAt = new Map((out ?? []).map((r) => [r.following_actor_id, r.created_at]));
  const mutual = new Map<string, string>();
  for (const r of back ?? []) {
    const a = outAt.get(r.follower_actor_id) ?? '';
    mutual.set(r.follower_actor_id, a > r.created_at ? a : r.created_at);
  }
  const ids = [...mutual.keys()];
  if (!ids.length) return [];
  let same = new Set<string>();
  if (round) {
    const { data: rounds } = await supabase.from('gam_round_stats').select('user_id')
      .in('user_id', ids).eq('course_id', round.courseId).eq('play_date', round.day);
    same = new Set((rounds ?? []).map((r) => r.user_id));
  }
  const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, first_name, username, profile_photo_url').in('id', ids);
  const rows: WithCandidate[] = (profiles ?? []).map((p) => ({
    id: p.id, name: p.display_name || p.first_name || p.username || 'Golfer', avatarUrl: p.profile_photo_url ?? null,
    sameRound: same.has(p.id), lastInteraction: mutual.get(p.id) ?? '',
  }));
  return rankPlayedWith(rows, userId);
}

/** "Find someone": the @mention member search, members only. */
export async function searchMembers(q: string, selfId: string | null): Promise<WithCandidate[]> {
  const query = q.trim();
  if (!query) return [];
  const like = `%${query.replace(/[%_]/g, (ch) => '\\' + ch)}%`;
  const { data } = await searchMentionMembers(like, 8);
  return (data ?? []).filter((u) => u.id !== selfId).map((u) => ({
    id: u.id, name: u.display_name || u.username || 'Golfer', avatarUrl: u.profile_photo_url ?? null, sameRound: false, lastInteraction: '',
  }));
}
