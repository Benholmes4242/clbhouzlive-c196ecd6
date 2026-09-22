import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_PROFILE_ACHIEVEMENTS_REAL §2 — the two figures the profile
 * achievements pane is allowed to claim, each READ rather than derived.
 *
 *   badges  -> the number of rows in gam_user_badges for this member. The
 *              table only holds EARNED badges (every row carries earned_at),
 *              and RLS hides rows the viewer may not see, so the row count IS
 *              the figure. Counted by Postgres (head + exact), never summed
 *              in the component.
 *   titles  -> gam_user_milestones.count where metric = 'legend_titles'. This
 *              is the CONTESTED title count the evaluator stores as of today:
 *              titles won against a field. It is read verbatim; no recount,
 *              no client-side contest logic.
 *
 * There is NO XP in this platform, so nothing here exposes one.
 *
 * `null` means NOT KNOWN, never zero: a failed read must not render as "0
 * badges". The caller gates on isFetched (a disabled React Query v5 query is
 * pending with fetchStatus 'idle', so isLoading is false before it ever runs).
 */
export interface ProfileAchievementFigures {
  /** Earned badge rows visible to the viewer. */
  badges: number;
  /** Stored contested course-title count. 0 when the member has no row. */
  titles: number;
}

export function useProfileAchievementFigures(userId: string | undefined) {
  return useQuery({
    queryKey: ['gam', 'profile-achievement-figures', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<ProfileAchievementFigures> => {
      const [badgeRes, titleRes] = await Promise.all([
        supabase
          .from('gam_user_badges')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
        supabase
          .from('gam_user_milestones')
          .select('count')
          .eq('user_id', userId!)
          .eq('metric', 'legend_titles')
          .maybeSingle(),
      ]);

      if (badgeRes.error) throw badgeRes.error;
      if (titleRes.error) throw titleRes.error;

      return {
        badges: badgeRes.count ?? 0,
        titles: titleRes.data?.count ?? 0,
      };
    },
  });
}
