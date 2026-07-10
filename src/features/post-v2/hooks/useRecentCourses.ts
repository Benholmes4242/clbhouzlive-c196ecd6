// useRecentCourses - blended "courses you play" for the composer.
//
// Sources (in this order for stable dedup when timestamps collide):
//   a. posts.course_id      - prior post tags for this user
//   b. whs_scores           - scored rounds (via whs_connections.user_id)
//   c. user_courses         - played log
//   d. course_ratings       - reviewed floor
//
// Deduped by course id, ranked by most recent activity across sources, top 5.
// Cold start: resolve user_profiles.home_club (text) to a golf_courses row by
// name match -> single "home club" fallback row.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  isHomeClub?: boolean;
}

interface CourseRow {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
}

interface Signal { courseId: string; ts: number; }

async function fetchCoursesByIds(ids: string[]): Promise<Map<string, CourseRow>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('golf_courses')
    .select('id, name, country, sub_country')
    .in('id', ids);
  const map = new Map<string, CourseRow>();
  for (const row of (data ?? []) as CourseRow[]) map.set(row.id, row);
  return map;
}

export function useRecentCourses(open: boolean, userId: string | null | undefined) {
  const [rows, setRows] = useState<RecentCourse[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      // a. posts (this user, with course_id)
      const postsQ = supabase
        .from('posts')
        .select('course_id, created_at')
        .eq('user_id', userId)
        .not('course_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      // b. whs_scores via connection -> user (join in one query)
      const whsQ = supabase
        .from('whs_scores')
        .select('course_id, play_date, created_at, whs_connections!inner(user_id)')
        .eq('whs_connections.user_id', userId)
        .not('course_id', 'is', null)
        .order('play_date', { ascending: false, nullsFirst: false })
        .limit(50);
      // c. user_courses
      const ucQ = supabase
        .from('user_courses')
        .select('course_id, played_date, created_at')
        .eq('user_id', userId)
        .not('course_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      // d. course_ratings
      const crQ = supabase
        .from('course_ratings')
        .select('course_id, created_at')
        .eq('user_id', userId)
        .not('course_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      const [postsRes, whsRes, ucRes, crRes] = await Promise.all([postsQ, whsQ, ucQ, crQ]);
      if (cancelled) return;

      const signals: Signal[] = [];
      const pushSig = (courseId: unknown, ts: unknown) => {
        if (typeof courseId !== 'string' || !courseId) return;
        const t = typeof ts === 'string' ? Date.parse(ts) : (typeof ts === 'number' ? ts : 0);
        signals.push({ courseId, ts: Number.isFinite(t) ? t : 0 });
      };

      for (const r of (postsRes.data ?? []) as Array<{ course_id: string | null; created_at: string | null }>) {
        pushSig(r.course_id, r.created_at);
      }
      // whs_scores course_id maps into golf_courses per brief
      for (const r of (whsRes.data ?? []) as Array<{ course_id: string | null; play_date: string | null; created_at: string | null }>) {
        pushSig(r.course_id, r.play_date ?? r.created_at);
      }
      for (const r of (ucRes.data ?? []) as Array<{ course_id: string | null; played_date: string | null; created_at: string | null }>) {
        pushSig(r.course_id, r.played_date ?? r.created_at);
      }
      for (const r of (crRes.data ?? []) as Array<{ course_id: string | null; created_at: string | null }>) {
        pushSig(r.course_id, r.created_at);
      }

      // dedup: keep max ts per courseId
      const bestByCourse = new Map<string, number>();
      for (const s of signals) {
        const prev = bestByCourse.get(s.courseId) ?? -Infinity;
        if (s.ts > prev) bestByCourse.set(s.courseId, s.ts);
      }
      const ranked = Array.from(bestByCourse.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      if (ranked.length > 0) {
        const courses = await fetchCoursesByIds(ranked);
        if (cancelled) return;
        const list: RecentCourse[] = [];
        for (const id of ranked) {
          const c = courses.get(id);
          if (c) list.push({ id: c.id, name: c.name, country: c.country ?? null, sub_country: c.sub_country ?? null });
        }
        setRows(list);
        setLoaded(true);
        return;
      }

      // Cold start: resolve home_club (text) -> golf_courses row
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('home_club')
        .eq('id', userId)
        .maybeSingle();
      const homeName = (profile?.home_club ?? '').trim();
      if (!homeName) {
        setRows([]);
        setLoaded(true);
        return;
      }
      const { data: match } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country')
        .ilike('name', homeName)
        .limit(1);
      if (cancelled) return;
      const hit = (match ?? [])[0] as CourseRow | undefined;
      if (hit) {
        setRows([{ id: hit.id, name: hit.name, country: hit.country ?? null, sub_country: hit.sub_country ?? null, isHomeClub: true }]);
      } else {
        setRows([]);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  return { rows, loaded };
}
