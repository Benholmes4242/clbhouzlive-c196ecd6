/**
 * A course's Top 100 standing, from the authority: course_top100_memberships
 * joined to active top100_lists. NEVER golf_courses.global_rank / regional_rank
 * / usa_rank (denormalised, no writer).
 *
 * Several lists: the STRONGEST placement wins (lowest rank number). The label is
 * the list's short_label verbatim, falling back to name — no display names are
 * invented here. A course on no active list maps to null; consumers omit it.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ListRank = { label: string; rank: number } | null;

export interface MembershipRow {
  course_id: string;
  rank: number | null;
  top100_lists: { short_label: string | null; name: string | null; is_active: boolean | null } | null;
}

/** Pure: reduce membership rows to one strongest placement per course id. */
export function strongestListRanks(courseIds: string[], rows: MembershipRow[]): Map<string, ListRank> {
  const out = new Map<string, ListRank>();
  courseIds.forEach((id) => out.set(id, null));
  for (const r of rows) {
    const list = r.top100_lists;
    if (!list || !list.is_active || r.rank == null || !Number.isFinite(r.rank)) continue;
    const label = list.short_label ?? list.name;
    if (!label) continue;
    const prev = out.get(r.course_id);
    if (!prev || r.rank < prev.rank) out.set(r.course_id, { label, rank: r.rank });
  }
  return out;
}

export const formatListRank = (r: ListRank) => (r ? `${r.label} #${r.rank}` : null);

export function useCourseListRanks(courseIds: string[]) {
  const ids = [...new Set(courseIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ['course-list-ranks', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, rank, top100_lists!inner(short_label, name, is_active)')
        .in('course_id', ids)
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return strongestListRanks(ids, (data || []) as unknown as MembershipRow[]);
    },
  });
}
