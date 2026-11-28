/** Brief 50 — the one write path for ticks (set_course_played). Optimistic
 * over usePlayedCourses with rollback; on success refreshes every surface on
 * the played rule and fires the Top 100 badge evaluator like useReviewSubmit. */
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { playedCoursesKey, usePlayedMemberId } from './usePlayedCourses';
import { lockedReason, optimisticEntry, type PlayedEntry, type TickSource } from './playedRules';

export interface SetPlayedVars { courseId: string; played: boolean; source: TickSource; courseName?: string; quiet?: boolean }

export function invalidatePlayedSurfaces(qc: QueryClient, courseId: string) {
  const first = (k: unknown) => (Array.isArray(k) ? k[0] : undefined);
  qc.invalidateQueries({ queryKey: ['played-courses'] });
  qc.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey as unknown[];
      const head = first(k);
      if (head === 'user-top100-progress' || head === 'top100-progress-user' || head === 'leaderboards'
        || head === 'user-course-activity' || head === 'friends-top100-progress') return true;
      if (head === 'gam_rpc' && (k[1] === 'get_top100_list_progress' || k[1] === 'get_career_leaderboard')) return true;
      if (head === 'course-personal-status') return k.includes(courseId);
      return false;
    },
  });
}

export function useSetCoursePlayed() {
  const qc = useQueryClient();
  const userId = usePlayedMemberId();
  const key = playedCoursesKey(userId);

  const mutation = useMutation({
    mutationFn: async ({ courseId, played }: SetPlayedVars) => {
      const { error } = await supabase.rpc('set_course_played', { p_course_id: courseId, p_played: played });
      if (error) throw error;
    },
    onMutate: async ({ courseId, played }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PlayedEntry[]>(key);
      const rows = previous ?? [];
      const next = optimisticEntry(rows.find(r => r.course_id === courseId), courseId, played);
      const rest = rows.filter(r => r.course_id !== courseId);
      qc.setQueryData<PlayedEntry[]>(key, next ? [...rest, next] : rest);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      toast.error("Couldn't save that. Try again.");
    },
    onSuccess: (_d, { courseId, played, source }) => {
      analyticsEvents.track(played ? 'course_tick' : 'course_untick', { course_id: courseId, source });
      invalidatePlayedSurfaces(qc, courseId);
      if (userId) {
        void supabase.functions.invoke('gam-evaluator', { body: { user_id: userId, top100_only: true } });
      }
    },
  });

  /** Tap on a tick: locked ticks toast and do nothing; others toggle with an Undo toast. */
  const toggle = (entry: PlayedEntry | undefined, courseId: string, courseName: string, source: TickSource, opts?: { quiet?: boolean }) => {
    const locked = lockedReason(entry);
    if (locked) { toast(locked); return false; }
    const played = !entry || !(entry.via_tick || entry.via_rating || entry.via_round);
    mutation.mutate({ courseId, played, source });
    if (!opts?.quiet) {
      const undo = { label: 'Undo', onClick: () => mutation.mutate({ courseId, played: !played, source: 'undo' }) };
      if (played) toast(`Ticked off ${shortCoursePart(courseName)}`, { action: undo });
      else toast('Removed from played', { action: undo });
    }
    return true;
  };

  return { toggle, mutate: mutation.mutate, isPending: mutation.isPending };
}
