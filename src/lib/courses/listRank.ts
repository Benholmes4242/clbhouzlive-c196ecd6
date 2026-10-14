/**
 * A course's Top 100 placements, from the authority: course_top100_memberships
 * joined to active top100_lists. NEVER golf_courses.global_rank / regional_rank
 * / usa_rank (denormalised, no writer).
 *
 * EVERY active placement is returned, not one. Order: the global list first,
 * then the rest by top100_lists.sort_order. Each reads "{short_label} #{rank}"
 * (short_label verbatim, falling back to name). A course on no active list maps
 * to an empty array; formatListRank returns null for it so no separator prints.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ListPlacement = { slug: string | null; label: string; rank: number; sortOrder: number };
/** All placements for one course, in display order. Empty when on no list. */
export type ListRank = ListPlacement[];

export interface MembershipRow {
  course_id: string;
  rank: number | null;
  top100_lists: {
    slug?: string | null;
    short_label: string | null;
    name: string | null;
    is_active: boolean | null;
    sort_order?: number | null;
  } | null;
}

const orderKey = (p: ListPlacement) => (p.slug === 'global' ? -Infinity : p.sortOrder);

/** Pure: reduce membership rows to every active placement per course id, global first. */
export function allListRanks(courseIds: string[], rows: MembershipRow[]): Map<string, ListRank> {
  const out = new Map<string, ListRank>();
  courseIds.forEach((id) => out.set(id, []));
  for (const r of rows) {
    const list = r.top100_lists;
    if (!list || !list.is_active || r.rank == null || !Number.isFinite(r.rank)) continue;
    const label = list.short_label ?? list.name;
    if (!label) continue;
    const arr = out.get(r.course_id) ?? [];
    arr.push({ slug: list.slug ?? null, label, rank: r.rank, sortOrder: list.sort_order ?? Number.MAX_SAFE_INTEGER });
    out.set(r.course_id, arr);
  }
  out.forEach((arr) => arr.sort((a, b) => orderKey(a) - orderKey(b)));
  return out;
}

export const formatListRank = (r: ListRank | null | undefined) =>
  r && r.length ? r.map((p) => `${p.label} #${p.rank}`).join(' · ') : null;

export function useCourseListRanks(courseIds: string[]) {
  const ids = [...new Set(courseIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ['course-list-ranks-all', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, rank, top100_lists!inner(slug, short_label, name, is_active, sort_order)')
        .in('course_id', ids)
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return allListRanks(ids, (data || []) as unknown as MembershipRow[]);
    },
  });
}
