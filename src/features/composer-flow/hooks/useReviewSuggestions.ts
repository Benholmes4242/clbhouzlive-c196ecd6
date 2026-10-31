/**
 * Review suggestions own one member-scoped query and complete, paginated reads.
 * Priority is club -> played (synced rounds, most recent first) -> own personal
 * composer posts -> followed reviewers; popularity is used only when no
 * drawable personal candidate exists. "Posted" counts only the member's own
 * personal posts: actor_type = 'personal', or actor_id = the member where
 * actor_type is null on older rows; business-actor posts never count. Played
 * courses come from gam_round_stats, whose course_id is the mapped
 * golf_courses id. Counts are distinct followed reviewers, not reviews.
 * Missing courses/names never invent a row. Reads fail closed: a failed
 * exclusion or count read must not offer a course.
 * user_follows.follower_id -> following_id is the app's outgoing people graph.
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';

export type ReviewReasonKind = 'club' | 'played' | 'posted' | 'followed' | 'popular';
export interface ReviewSuggestion {
  courseId: string;
  courseName: string;
  thumbnail: string | null;
  reason: string;
  reasonKind: ReviewReasonKind;
}
export interface SuggestionCourse { id: string; name: string; thumbnail_image: string | null }
export interface SuggestionPost { course_id: string | null; created_at: string; actor_type: string | null; actor_id: string | null }
export interface SuggestionPlayed { course_id: string; play_date: string }
export interface SuggestionRating { course_id: string; user_id: string | null; created_at: string }
export interface SuggestionProfile { id: string; display_name: string | null; username: string | null }
interface Sources {
  courses: SuggestionCourse[];
  club: SuggestionCourse[];
  played: SuggestionPlayed[];
  posts: SuggestionPost[];
  followed: SuggestionRating[];
  profiles: SuggestionProfile[];
  reviewed: string[];
  popular: SuggestionRating[];
}

export function buildReviewSuggestions(s: Sources, t: TFunction<'composerFlow'>): ReviewSuggestion[] {
  const done = new Set(s.reviewed);
  const byId = new Map(s.courses.map(c => [c.id, c]));
  const result: ReviewSuggestion[] = [];
  const offer = (id: string | null, reasonKind: ReviewReasonKind, reason: string) => {
    if (!id || done.has(id) || result.length >= 2) return;
    const c = byId.get(id);
    if (!c) return;
    done.add(id);
    result.push({ courseId: id, courseName: c.name, thumbnail: c.thumbnail_image, reasonKind, reason });
  };
  for (const c of s.club) offer(c.id, 'club', t('reason.club'));
  for (const p of [...s.played].sort((a, b) => b.play_date.localeCompare(a.play_date))) {
    const when = format(new Date(p.play_date), 'd MMM');
    offer(p.course_id, 'played', t('reason.played', { when }));
  }
  for (const p of [...s.posts].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const when = format(new Date(p.created_at), 'd MMM');
    offer(p.course_id, 'posted', t('reason.posted', { when }));
  }
  const followed = new Map<string, { people: Set<string>; latest: SuggestionRating }>();
  for (const r of [...s.followed].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!r.user_id) continue;
    const group = followed.get(r.course_id) ?? { people: new Set<string>(), latest: r };
    group.people.add(r.user_id);
    followed.set(r.course_id, group);
  }
  const profiles = new Map(s.profiles.map(p => [p.id, p]));
  const groups = [...followed.entries()].sort((a, b) =>
    b[1].people.size - a[1].people.size || b[1].latest.created_at.localeCompare(a[1].latest.created_at) || a[0].localeCompare(b[0]));
  for (const [id, group] of groups) {
    const p = group.latest.user_id ? profiles.get(group.latest.user_id) : undefined;
    const name = (p?.display_name?.trim() || p?.username?.trim() || '').split(/\s+/)[0];
    if (!name) continue;
    offer(id, 'followed', t('reason.followed', { name, count: group.people.size, n: group.people.size - 1 }));
  }
  if (result.length) return result;
  const counts = new Map<string, { count: number; latest: string }>();
  for (const r of s.popular) {
    const group = counts.get(r.course_id) ?? { count: 0, latest: r.created_at };
    group.count += 1;
    if (r.created_at > group.latest) group.latest = r.created_at;
    counts.set(r.course_id, group);
  }
  for (const [id, group] of [...counts.entries()].sort((a, b) =>
    b[1].count - a[1].count || b[1].latest.localeCompare(a[1].latest) || a[0].localeCompare(b[0]))) {
    offer(id, 'popular', t('reason.popular', { count: group.count }));
  }
  return result;
}

// Fresh builders per page keep range state local; never truncate a population.
async function readAll<T>(make: () => any): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await make().range(offset, offset + 499);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
async function readIds<T>(ids: string[], make: (chunk: string[]) => any): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += 200) rows.push(...await readAll<T>(() => make(ids.slice(i, i + 200))));
  return rows;
}

export async function loadReviewSuggestions(userId: string, t: TFunction<'composerFlow'>, now = new Date()): Promise<ReviewSuggestion[]> {
  const from = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  const [profile, reviewed, rawPosts, played, follows] = await Promise.all([
    supabase.from('user_profiles').select('primary_club_id').eq('id', userId).maybeSingle(),
    readAll<{ course_id: string }>(() => supabase.from('course_ratings').select('course_id').eq('user_id', userId).order('id')),
    readAll<SuggestionPost>(() => supabase.from('posts').select('course_id, created_at, actor_type, actor_id').eq('user_id', userId)
      .not('course_id', 'is', null).is('whs_score_id', null).is('source_review_id', null)
      .order('created_at', { ascending: false }).order('id')),
    readAll<SuggestionPlayed>(() => supabase.from('gam_round_stats').select('course_id, play_date').eq('user_id', userId)
      .not('course_id', 'is', null).order('play_date', { ascending: false }).order('id')),
    readAll<{ following_id: string }>(() => supabase.from('user_follows').select('following_id').eq('follower_id', userId).order('id')),
  ]);
  // Only the member's own personal posts count; business-actor posts never do.
  const posts = rawPosts.filter(p => p.actor_type === 'personal' || (p.actor_type == null && p.actor_id === userId));
  if (profile.error) throw profile.error;
  const clubId = profile.data?.primary_club_id;
  const followingIds = [...new Set(follows.map(f => f.following_id))];
  const [club, followed] = await Promise.all([
    clubId ? readAll<SuggestionCourse>(() => supabase.from('golf_courses')
      .select('id, name, thumbnail_image').eq('club_id', clubId).order('name').order('id')) : Promise.resolve([]),
    readIds<SuggestionRating>(followingIds, ids => supabase.from('course_ratings').select('course_id, user_id, created_at')
      .in('user_id', ids).gte('created_at', from(90)).order('created_at', { ascending: false }).order('id')),
  ]);
  const ids = [...new Set([...club.map(c => c.id), ...played.map(p => p.course_id), ...posts.flatMap(p => p.course_id ? [p.course_id] : []), ...followed.map(r => r.course_id)])];
  const [courses, profiles] = await Promise.all([
    readIds<SuggestionCourse>(ids, chunk => supabase.from('golf_courses').select('id, name, thumbnail_image').in('id', chunk).order('id')),
    readIds<SuggestionProfile>([...new Set(followed.flatMap(r => r.user_id ? [r.user_id] : []))], chunk =>
      supabase.from('user_profiles').select('id, display_name, username').in('id', chunk).order('id')),
  ]);
  const sources: Sources = { courses, club, played, posts, followed, profiles, reviewed: reviewed.map(r => r.course_id), popular: [] };
  const personal = buildReviewSuggestions(sources, t);
  if (personal.length) return personal;
  const popular = await readAll<SuggestionRating>(() => supabase.from('course_ratings').select('course_id, user_id, created_at')
    .eq('is_mock', false).gte('created_at', from(30)).order('created_at', { ascending: false }).order('id'));
  const popularCourses = await readIds<SuggestionCourse>([...new Set(popular.map(r => r.course_id))], chunk =>
    supabase.from('golf_courses').select('id, name, thumbnail_image').in('id', chunk).order('id'));
  return buildReviewSuggestions({ ...sources, courses: [...courses, ...popularCourses], popular }, t);
}

export function useReviewSuggestions(open: boolean) {
  const { profile } = useProfileData();
  const { t } = useTranslation('composerFlow');
  const userId = profile?.id;
  return useQuery({
    queryKey: ['composer-review-suggestions', userId],
    enabled: open && !!userId,
    staleTime: 60_000,
    queryFn: () => userId ? loadReviewSuggestions(userId, t) : Promise.resolve([]),
  });
}