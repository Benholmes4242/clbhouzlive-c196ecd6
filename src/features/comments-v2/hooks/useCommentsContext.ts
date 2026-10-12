/**
 * BRIEF_COMMENTS_SHEET G.3 / G.4 — what the sheet is about, and who is talking.
 *
 * useCommentsSubject resolves the subject the sheet has covered up: its author,
 * its course and (for a round) gross and to-par, (for a review) the rating.
 * A post with no round or review yields no context line; the author is still
 * returned so the empty state can name them.
 *
 * useThreadStandings is TWO BATCHED READS FOR THE WHOLE THREAD (legends + get_course_familiarity RPC), keyed on the
 * distinct commenter ids plus the one course id — never one read per comment.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CATEGORY } from '@/features/explore-magazine/useCourseRecordSignal';
import type { TargetType } from './useCommentsV2';
import { standingFor, likerStandingFor, chunkIds, familiarityMap, familiarityDetailMap, type LegendHit, type Standing, type LikerStanding } from '../lib/standing';

export interface CommentsSubject {
  authorName: string | null;
  /** Personal authors only; a business is named in full. */
  authorFirstName: string | null;
  courseId: string | null;
  courseName: string | null;
  kind: 'round' | 'review' | 'post';
  gross: number | null;
  toPar: number | null;
  rating: number | null;
}

type Row = Record<string, unknown> | null;

async function roundFacts(whsScoreId: string) {
  const { data } = await supabase
    .from('gam_round_stats' as never)
    .select('user_id, course_id, course_name, gross_score, course_par')
    .eq('whs_score_id', whsScoreId)
    .maybeSingle();
  const r = data as Row;
  if (!r) return null;
  const gross = typeof r.gross_score === 'number' ? r.gross_score : null;
  const par = typeof r.course_par === 'number' ? r.course_par : null;
  return {
    userId: (r.user_id as string | null) ?? null,
    courseId: (r.course_id as string | null) ?? null,
    courseName: (r.course_name as string | null) ?? null,
    gross,
    toPar: gross != null && par != null ? gross - par : null,
  };
}

async function reviewFacts(reviewId: string) {
  const { data } = await supabase
    .from('course_ratings')
    .select('user_id, course_id, rating')
    .eq('id', reviewId)
    .maybeSingle();
  const r = data as Row;
  if (!r) return null;
  return {
    userId: (r.user_id as string | null) ?? null,
    courseId: (r.course_id as string | null) ?? null,
    rating: typeof r.rating === 'number' ? r.rating : null,
  };
}

export function useCommentsSubject(targetType: TargetType, targetId: string, enabled: boolean) {
  const applies = targetType === 'post' || targetType === 'round' || targetType === 'review';
  return useQuery<CommentsSubject | null>({
    queryKey: ['comments-v2', 'subject', targetType, targetId],
    enabled: enabled && applies && !!targetId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let userId: string | null = null;
      let business: { id: string } | null = null;
      let courseId: string | null = null;
      let courseName: string | null = null;
      let kind: CommentsSubject['kind'] = 'post';
      let gross: number | null = null;
      let toPar: number | null = null;
      let rating: number | null = null;

      let whsScoreId: string | null = targetType === 'round' ? targetId : null;
      let reviewId: string | null = targetType === 'review' ? targetId : null;

      if (targetType === 'post') {
        const { data } = await supabase
          .from('posts')
          .select('user_id, actor_type, actor_id, course_id, whs_score_id, source_review_id')
          .eq('id', targetId)
          .maybeSingle();
        const p = data as Row;
        if (!p) return null;
        userId = (p.user_id as string | null) ?? null;
        if (p.actor_type === 'business' && p.actor_id) business = { id: p.actor_id as string };
        courseId = (p.course_id as string | null) ?? null;
        whsScoreId = (p.whs_score_id as string | null) ?? null;
        reviewId = (p.source_review_id as string | null) ?? null;
      }

      if (whsScoreId) {
        const f = await roundFacts(whsScoreId);
        if (f) {
          kind = 'round';
          userId = userId ?? f.userId;
          courseId = f.courseId ?? courseId;
          courseName = f.courseName;
          gross = f.gross;
          toPar = f.toPar;
        }
      } else if (reviewId) {
        const f = await reviewFacts(reviewId);
        if (f) {
          kind = 'review';
          userId = userId ?? f.userId;
          courseId = f.courseId ?? courseId;
          rating = f.rating;
        }
      }

      const [authorRes, courseRes] = await Promise.all([
        business
          ? supabase.from('business_accounts').select('name').eq('id', business.id).maybeSingle()
          : userId
            ? supabase.from('user_profiles').select('display_name, username').eq('id', userId).maybeSingle()
            : Promise.resolve({ data: null }),
        courseId && !courseName
          ? supabase.from('golf_courses').select('name').eq('id', courseId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const a = authorRes.data as Row;
      const authorName = business
        ? ((a?.name as string | null) ?? null)
        : ((a?.display_name as string | null) ?? (a?.username as string | null) ?? null);
      const authorFirstName = business ? authorName : authorName ? authorName.trim().split(/\s+/)[0] : null;
      courseName = courseName ?? (((courseRes.data as Row)?.name as string | null) ?? null);

      return { authorName, authorFirstName, courseId, courseName, kind, gross, toPar, rating };
    },
  });
}

/**
 * THE TWO BATCHED READS behind both sheets' standings: get_course_familiarity
 * (blocks of 50) and gam_course_legends (current lowest_gross_all_time, rank
 * <= 10). Each failure is contained: its map comes back empty.
 */
export async function fetchCourseStandingInputs(courseId: string, ids: string[]) {
  const famCall = Promise.all(
    chunkIds(ids).map((chunk) =>
      (supabase.rpc as unknown as (fn: string, args: object) => Promise<{ data: unknown; error: unknown }>)(
        'get_course_familiarity',
        { p_user_ids: chunk, p_course_id: courseId },
      ).then((r) => r, (error) => ({ data: null, error })),
    ),
  );
  const legendCall = Promise.resolve(
    supabase
      .from('gam_course_legends' as never)
      .select('user_id, rank, value')
      .eq('course_id', courseId)
      .eq('is_current', true)
      .eq('category', RECORD_CATEGORY)
      .lte('rank', 10)
      .in('user_id', ids),
  ).then((r) => r as { data: unknown; error: unknown }, (error) => ({ data: null, error }));
  const [famRes, legendRes] = await Promise.all([famCall, legendCall]);
  const legends = new Map<string, LegendHit>();
  if (!legendRes.error && Array.isArray(legendRes.data)) {
    for (const r of legendRes.data as Array<{ user_id: string; rank: number; value: number }>) {
      const prev = legends.get(r.user_id);
      if (!prev || r.rank < prev.rank) legends.set(r.user_id, { rank: r.rank, value: r.value });
    }
  }
  return { famRes, legends };
}

export function useThreadStandings(courseId: string | null, userIds: string[], enabled: boolean) {
  const ids = useMemo(() => Array.from(new Set(userIds.filter(Boolean))).sort(), [userIds]);
  return useQuery<Map<string, Standing>>({
    queryKey: ['comments-v2', 'standings', courseId, ids.join('|')],
    enabled: enabled && !!courseId && ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { famRes, legends } = await fetchCourseStandingInputs(courseId as string, ids);
      const rounds = familiarityMap(famRes);
      const out = new Map<string, Standing>();
      for (const id of ids) {
        const s = standingFor(legends.get(id), rounds.get(id));
        if (s) out.set(id, s);
      }
      return out;
    },
  });
}

/** BRIEF_LIKES_SHEET H.4 — the same two reads, for the likes sheet's tiers. */
export function useLikerStandings(courseId: string | null, userIds: string[], enabled: boolean) {
  const ids = useMemo(() => Array.from(new Set(userIds.filter(Boolean))).sort(), [userIds]);
  return useQuery<Map<string, LikerStanding>>({
    queryKey: ['likes-sheet', 'standings', courseId, ids.join('|')],
    enabled: enabled && !!courseId && ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { famRes, legends } = await fetchCourseStandingInputs(courseId as string, ids);
      const fam = familiarityDetailMap(famRes);
      const out = new Map<string, LikerStanding>();
      for (const id of ids) {
        const s = likerStandingFor(legends.get(id), fam.get(id));
        if (s) out.set(id, s);
      }
      return out;
    },
  });
}
