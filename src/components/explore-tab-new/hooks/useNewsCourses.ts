import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { WireEvent } from './useDiscoverWire';

/**
 * useNewsCourses — the courses the wire is talking about (brief 4).
 *
 * Derived from the same cache the wire reads, so it inherits its cadence.
 * Deduplicated by course, max 8, last 7 days, most notable first: rarity
 * (ace, albatross) then most recent. A photo grid tells a member a course is
 * pretty; "course record broken 3 days ago, 8.2 from 4 ratings" tells them it
 * is live.
 */

const DAY_MS = 86_400_000;
const MAX_CARDS = 8;
/** Matches the wire's horizon (BRIEF_DISCOVER_REBUILD §3). */
const HORIZON_DAYS = 90;
/** Two cards in a horizontal scroller looks broken. */
export const MIN_NEWS_COURSES = 3;

export interface NewsCourse {
  courseId: string;
  name: string;
  place: string | null;
  image: string | null;
  /** The event that earned the course its place. */
  why: WireEvent;
  /** Events at this course inside the horizon. Drives the "why" line. */
  eventCount: number;
  rating: number | null;
  ratingCount: number;
}

interface CourseFacts {
  name: string;
  place: string | null;
  image: string | null;
  rating: number | null;
  ratingCount: number;
}

/** One event per course, most notable first, plus its in-window count. */
function pickCourses(events: WireEvent[]): { best: WireEvent[]; counts: Map<string, number> } {
  const cutoff = Date.now() - HORIZON_DAYS * DAY_MS;
  const best = new Map<string, WireEvent>();
  const counts = new Map<string, number>();
  for (const e of events) {
    if (!e.courseId) continue;
    const t = Date.parse(e.at);
    if (Number.isNaN(t) || t < cutoff) continue;
    counts.set(e.courseId, (counts.get(e.courseId) ?? 0) + 1);
    const current = best.get(e.courseId);
    if (
      !current ||
      e.rarity > current.rarity ||
      (e.rarity === current.rarity && t > Date.parse(current.at))
    ) {
      best.set(e.courseId, e);
    }
  }
  return {
    best: [...best.values()]
      .sort((a, b) => b.rarity - a.rarity || Date.parse(b.at) - Date.parse(a.at))
      .slice(0, MAX_CARDS),
    counts,
  };
}

export function useNewsCourses(events: WireEvent[]) {
  const { best: picked, counts } = useMemo(() => pickCourses(events), [events]);
  const ids = useMemo(() => picked.map((e) => e.courseId!).sort(), [picked]);

  const factsQuery = useQuery<Record<string, CourseFacts>>({
    queryKey: ['discover-news-courses', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: courses, error: coursesError }, { data: ratings, error: ratingsError }] =
        await Promise.all([
          supabase
            .from('golf_courses')
            .select('id, name, sub_country, country, thumbnail_image')
            .in('id', ids),
          supabase.from('course_ratings').select('course_id, rating').in('course_id', ids),
        ]);
      if (coursesError) throw coursesError;
      if (ratingsError) throw ratingsError;

      const totals = new Map<string, { sum: number; n: number }>();
      for (const r of ratings ?? []) {
        if (r.rating == null) continue;
        const agg = totals.get(r.course_id) ?? { sum: 0, n: 0 };
        agg.sum += r.rating;
        agg.n += 1;
        totals.set(r.course_id, agg);
      }

      const out: Record<string, CourseFacts> = {};
      for (const c of courses ?? []) {
        const agg = totals.get(c.id);
        out[c.id] = {
          name: c.name,
          place: [c.sub_country, c.country].filter(Boolean).join(', ') || null,
          image: c.thumbnail_image ?? null,
          rating: agg && agg.n > 0 ? agg.sum / agg.n : null,
          ratingCount: agg?.n ?? 0,
        };
      }
      return out;
    },
  });

  const courses = useMemo<NewsCourse[]>(() => {
    const facts = factsQuery.data;
    if (!facts) return [];
    const out: NewsCourse[] = [];
    for (const e of picked) {
      const f = facts[e.courseId!];
      if (!f) continue;
      out.push({
        courseId: e.courseId!,
        name: f.name,
        place: f.place,
        image: f.image ?? e.courseImage,
        why: e,
        eventCount: counts.get(e.courseId!) ?? 1,
        rating: f.rating,
        ratingCount: f.ratingCount,
      });
    }
    return out;
  }, [picked, factsQuery.data, counts]);

  return {
    courses,
    isLoading: ids.length > 0 && factsQuery.isLoading,
    hasCandidates: ids.length >= MIN_NEWS_COURSES,
  };
}
