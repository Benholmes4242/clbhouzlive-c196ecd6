/** Reads for the Review a course sheet. Rank reads mirror useStatBrowse
 * (course_top100_memberships with active top100_lists); nothing reads rounds
 * or handicap data. A failed read yields no rows, never a wrong figure. */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readRecentCourseViews } from '@/lib/recentCourseViews';
import { buildIdleLists, firstRankLabel, newestFirst, rankPopular, SEARCH_DEBOUNCE_MS, SEARCH_LIMIT, SEARCH_MIN_CHARS, type ReviewCourseRow } from '../reviewCourseSearchRules';

const COURSE_COLS = 'id, name, region, sub_country, country, thumbnail_image';
type CourseRow = { id: string; name: string; region: string | null; sub_country: string | null; country: string | null; thumbnail_image: string | null };

async function reviewedMap(userId: string | null) {
  if (!userId) return new Map<string, number>();
  const { data, error } = await supabase.from('course_ratings').select('course_id, rating').eq('user_id', userId);
  if (error) throw error;
  return new Map(((data ?? []) as Array<{ course_id: string; rating: number }>).map(r => [r.course_id, Number(r.rating)]));
}

async function enrich(courses: CourseRow[], mine: Map<string, number>): Promise<ReviewCourseRow[]> {
  const ids = courses.map(c => c.id);
  if (!ids.length) return [];
  const [agg, mem] = await Promise.all([
    supabase.from('course_rating_aggregates').select('course_id, avg_overall_score, review_count').in('course_id', ids),
    supabase.from('course_top100_memberships').select('course_id, rank, top100_lists!inner(slug, is_active)').in('course_id', ids),
  ]);
  if (agg.error) throw agg.error;
  if (mem.error) throw mem.error;
  const aggBy = new Map(((agg.data ?? []) as Array<{ course_id: string; avg_overall_score: number | null; review_count: number | null }>).map(a => [a.course_id, a]));
  const memBy = new Map<string, Array<{ slug: string; rank: number; active?: boolean }>>();
  for (const m of (mem.data ?? []) as unknown as Array<{ course_id: string; rank: number; top100_lists: { slug?: string; is_active?: boolean } | Array<{ slug?: string; is_active?: boolean }> | null }>) {
    const list = Array.isArray(m.top100_lists) ? m.top100_lists[0] : m.top100_lists;
    if (!list?.slug) continue;
    memBy.set(m.course_id, [...(memBy.get(m.course_id) ?? []), { slug: list.slug, rank: Number(m.rank), active: list.is_active }]);
  }
  return courses.map(c => {
    const a = aggBy.get(c.id);
    return {
      id: c.id, name: c.name, region: c.region, subCountry: c.sub_country, country: c.country, thumbnail: c.thumbnail_image,
      avg: a?.avg_overall_score != null ? Number(a.avg_overall_score) : null,
      count: Number(a?.review_count ?? 0),
      mine: mine.has(c.id) ? mine.get(c.id)! : null,
      rank: firstRankLabel(memBy.get(c.id) ?? []),
    };
  });
}

async function coursesByIds(ids: string[]) {
  if (!ids.length) return [] as CourseRow[];
  const { data, error } = await supabase.from('golf_courses').select(COURSE_COLS).in('id', ids);
  if (error) throw error;
  const by = new Map(((data ?? []) as CourseRow[]).map(c => [c.id, c]));
  return ids.map(id => by.get(id)).filter((c): c is CourseRow => !!c);
}

export function useReviewCourseIdle(open: boolean, userId: string | null, minRatings: number) {
  return useQuery({
    queryKey: ['review-course-idle', userId, minRatings],
    enabled: open,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [mine, recentRatings, monthRatings] = await Promise.all([
        reviewedMap(userId),
        supabase.from('course_ratings').select('course_id, created_at').eq('is_mock', false).order('created_at', { ascending: false }).limit(300),
        supabase.from('course_ratings').select('course_id, created_at').eq('is_mock', false).gte('created_at', since).limit(1000),
      ]);
      if (recentRatings.error) throw recentRatings.error;
      if (monthRatings.error) throw monthRatings.error;
      const newest = newestFirst((recentRatings.data ?? []) as Array<{ course_id: string; created_at: string }>);
      let threshold: string[] = [];
      if (newest.length) {
        const { data, error } = await supabase.from('course_rating_aggregates').select('course_id, review_count').in('course_id', newest).eq('review_count', minRatings - 1);
        if (error) throw error;
        const ok = new Set(((data ?? []) as Array<{ course_id: string }>).map(r => r.course_id));
        threshold = newest.filter(id => ok.has(id));
      }
      const lists = buildIdleLists({
        recent: readRecentCourseViews().map(v => v.courseId),
        threshold,
        popular: rankPopular((monthRatings.data ?? []) as Array<{ course_id: string; created_at: string }>),
        reviewed: new Set(mine.keys()),
      });
      const rows = await enrich(await coursesByIds([...lists.recent, ...lists.threshold, ...lists.popular]), mine);
      const by = new Map(rows.map(r => [r.id, r]));
      const pick = (ids: string[]) => ids.map(id => by.get(id)).filter((r): r is ReviewCourseRow => !!r);
      return { recent: pick(lists.recent), threshold: pick(lists.threshold), popular: pick(lists.popular) };
    },
  });
}

export function useReviewCourseResults(open: boolean, userId: string | null, q: string) {
  const [term, setTerm] = useState('');
  useEffect(() => {
    const v = q.trim();
    if (v.length < SEARCH_MIN_CHARS) { setTerm(''); return; }
    const t = setTimeout(() => setTerm(v), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);
  const query = useQuery({
    queryKey: ['review-course-search', userId, term],
    enabled: open && term.length >= SEARCH_MIN_CHARS,
    retry: false,
    queryFn: async () => {
      const [mine, res] = await Promise.all([
        reviewedMap(userId),
        supabase.from('golf_courses').select(COURSE_COLS).ilike('name', `%${term}%`).limit(SEARCH_LIMIT),
      ]);
      if (res.error) throw res.error;
      return enrich((res.data ?? []) as CourseRow[], mine);
    },
  });
  return { term, ...query };
}
