/**
 * Reads for What's been played (BRIEF_WHATS_BEEN_PLAYED_V2; guests read nothing —
 * get_recent_rounds is 401 signed out). All look back ACTIVITY_WINDOW_DAYS:
 * - rounds: get_recent_rounds ('everyone', '30'), paged to total_count, cap 500;
 * - posts: the posts table with useMomentsOfTheWeek's filters (status
 *   'published', course_id or tagged_course_ids set, created_at in the window;
 *   RLS decides visibility), paged, cap 500;
 * - reviews: course_ratings with useLatestReviews' filters (is_mock false,
 *   review text present, created_at in the window), paged, cap 500;
 * - member faces: readMemberFaces (user_profiles, public_profiles filling gaps)
 *   for every active member, so unconnected members keep names and faces;
 * One golf_courses read for every active course id; the viewer's home course is
 * the first golf_courses row of their canonical club (user_profiles.primary_club_id,
 * via useViewerHomeClubId — home_club_id is deprecated and never written).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewerHomeClubId } from '@/components/explore-tab-new/courseled/hooks/useGolfThisWeek';
import { readMemberFaces } from '@/lib/members/readMemberFaces';
import { ACTIVITY_WINDOW_DAYS, type HomePlace, type PlacedCourse } from './playedRings';

export const PLAYED_ROUND_CAP = 500;
const PAGE = 100;

export interface PlayedRoundRow {
  whs_score_id: string;
  course_id: string | null;
  course_name: string | null;
  play_date: string;
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  gross_score: number | null;
  course_par: number | null;
  total_count: number;
}
export interface PlayedCourse extends PlacedCourse { name: string; imageUrl: string | null }

export async function fetchPlayedRounds(): Promise<PlayedRoundRow[]> {
  const out: PlayedRoundRow[] = [];
  for (let offset = 0; offset < PLAYED_ROUND_CAP; offset += PAGE) {
    const { data, error } = await supabase.rpc('get_recent_rounds', {
      p_scope: 'everyone', p_window: String(ACTIVITY_WINDOW_DAYS), p_limit: Math.min(PAGE, PLAYED_ROUND_CAP - offset), p_offset: offset,
    });
    if (error) throw error;
    const rows = (data ?? []) as PlayedRoundRow[];
    out.push(...rows);
    const total = rows[0]?.total_count ?? 0;
    if (rows.length === 0 || out.length >= total) break;
  }
  return out.slice(0, PLAYED_ROUND_CAP);
}

export const ACTIVITY_CAP = 500;
export interface PlayedPostRow { id: string; user_id: string | null; actor_type: string | null; created_at: string; course_id: string | null; tagged_course_ids: string[] | null }
export interface PlayedReviewRow { id: string; course_id: string | null; user_id: string | null; rating: number | null; review: string | null; created_at: string }
export const windowStartIso = (now = Date.now()) => new Date(now - ACTIVITY_WINDOW_DAYS * 86_400_000).toISOString();

async function pageRows<T>(read: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < ACTIVITY_CAP; from += PAGE) {
    const { data, error } = await read(from, Math.min(from + PAGE, ACTIVITY_CAP) - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out.slice(0, ACTIVITY_CAP);
}
export function fetchPlayedPosts(since = windowStartIso()): Promise<PlayedPostRow[]> {
  return pageRows<PlayedPostRow>((from, to) => supabase.from('posts')
    .select('id, user_id, actor_type, created_at, course_id, tagged_course_ids')
    .eq('status', 'published').or('course_id.not.is.null,tagged_course_ids.neq.{}')
    .gte('created_at', since).order('created_at', { ascending: false }).range(from, to));
}
export function fetchPlayedReviews(since = windowStartIso()): Promise<PlayedReviewRow[]> {
  return pageRows<PlayedReviewRow>((from, to) => supabase.from('course_ratings')
    .select('id, course_id, user_id, rating, review, created_at')
    .eq('is_mock', false).not('review', 'is', null)
    .gte('created_at', since).order('created_at', { ascending: false }).range(from, to));
}
/** Every course a post names: course_id plus tagged_course_ids, once each. */
export const postCourseIds = (p: Pick<PlayedPostRow, 'course_id' | 'tagged_course_ids'>) => Array.from(new Set([p.course_id, ...(p.tagged_course_ids ?? [])].filter((v): v is string => !!v)));

const COURSE_COLS = 'id, name, thumbnail_image, region, sub_country, country, continent, latitude, longitude';
type CourseRow = { id: string; name: string; thumbnail_image: string | null; region: string | null; sub_country: string | null; country: string | null; continent: string | null; latitude: number | null; longitude: number | null };
const toCourse = (c: CourseRow): PlayedCourse => ({
  id: c.id, name: c.name, imageUrl: c.thumbnail_image ?? null, region: c.region || null, subCountry: c.sub_country || null,
  country: c.country || null, continent: c.continent || null, lat: c.latitude ?? null, lng: c.longitude ?? null,
});

export function usePlayedRounds(userId: string | undefined) {
  const win = String(ACTIVITY_WINDOW_DAYS);
  const rounds = useQuery({ queryKey: ['courses', 'played-rounds', 'everyone', win, userId ?? null], queryFn: fetchPlayedRounds, enabled: !!userId, staleTime: 60_000 });
  const posts = useQuery({ queryKey: ['courses', 'played-posts', win, userId ?? null], queryFn: () => fetchPlayedPosts(), enabled: !!userId, staleTime: 60_000 });
  const reviews = useQuery({ queryKey: ['courses', 'played-reviews', win, userId ?? null], queryFn: () => fetchPlayedReviews(), enabled: !!userId, staleTime: 60_000 });
  const ids = useMemo(() => Array.from(new Set([
    ...(rounds.data ?? []).map((r) => r.course_id),
    ...(posts.data ?? []).flatMap(postCourseIds),
    ...(reviews.data ?? []).map((r) => r.course_id),
  ].filter((v): v is string => !!v))).sort(), [rounds.data, posts.data, reviews.data]);
  const memberIds = useMemo(() => Array.from(new Set([
    ...(rounds.data ?? []).map((r) => r.user_id),
    ...(posts.data ?? []).filter((p) => p.actor_type !== 'business').map((p) => p.user_id),
    ...(reviews.data ?? []).map((r) => r.user_id),
  ].filter((v): v is string => !!v))).sort(), [rounds.data, posts.data, reviews.data]);
  const faces = useQuery({ queryKey: ['courses', 'played-faces', memberIds.join('|')], enabled: memberIds.length > 0, staleTime: 5 * 60_000, queryFn: () => readMemberFaces(memberIds) });
  const courses = useQuery({
    queryKey: ['courses', 'played-courses', ids.join('|')],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('golf_courses').select(COURSE_COLS).in('id', ids);
      if (error) throw error;
      return new Map(((data ?? []) as CourseRow[]).map((c) => [c.id, toCourse(c)]));
    },
  });
  const homeClub = useViewerHomeClubId(userId);
  const home = useQuery({
    queryKey: ['courses', 'played-home', homeClub.clubId],
    enabled: !!homeClub.clubId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<HomePlace | null> => {
      const { data, error } = await supabase.from('golf_courses').select(COURSE_COLS).eq('club_id', homeClub.clubId as string).limit(1);
      if (error) throw error;
      const c = (data ?? [])[0] as CourseRow | undefined;
      return c ? { lat: c.latitude ?? null, lng: c.longitude ?? null, region: c.region || null, subCountry: c.sub_country || null, country: c.country || null, continent: c.continent || null } : null;
    },
  });
  const homeReady = !userId || (homeClub.ready && (!homeClub.clubId || home.isFetched || home.isError));
  return { rounds, posts, reviews, faces, memberIds, courses, ids, home: homeClub.clubId ? home.data ?? null : null, homeReady };
}
