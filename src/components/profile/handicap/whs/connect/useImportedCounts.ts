import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportedCounts {
  rounds: number;
  courses: number;
  friends: number;
}

/**
 * connect-whs does not report the import figures reliably, so the DONE screen
 * derives all three client-side from the tables it just wrote.
 * A null result means "not readable yet" - the caller must render the
 * still-importing state, NEVER a zero.
 */
export function useImportedCounts(connectionId: string | null | undefined) {
  return useQuery<ImportedCounts | null>({
    queryKey: ['whs-imported-counts', connectionId],
    enabled: !!connectionId,
    refetchInterval: (q) => (q.state.data ? false : 2500),
    queryFn: async () => {
      if (!connectionId) return null;
      const [scores, friends] = await Promise.all([
        supabase
          .from('whs_scores' as any)
          .select('course_id')
          .eq('connection_id', connectionId)
          .limit(2000),
        supabase
          .from('whs_friends' as any)
          .select('id', { count: 'exact', head: true })
          .eq('connection_id', connectionId),
      ]);
      const rows = (scores.data as unknown as Array<{ course_id: string | null }>) ?? [];
      const rounds = rows.length;
      if (rounds === 0) return null;
      const courses = new Set(rows.map((r) => r.course_id).filter(Boolean)).size;
      return { rounds, courses, friends: friends.count ?? 0 };
    },
  });
}
