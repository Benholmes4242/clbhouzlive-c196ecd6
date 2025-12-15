import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100BadgeCategory = 'milestone' | 'list_completion';

export interface Top100Badge {
  id: string;
  label: string;
  description: string;
  category: Top100BadgeCategory;
  earned_at: string | null;
}

export function useTop100Badges(userId?: string | null) {
  return useQuery({
    queryKey: ['top100-badges', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Top100Badge[]> => {
      if (!userId) return [];

      // 1) Get user's rated courses (ratings-only: single source of truth)
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', userId);

      if (ratingsError) throw ratingsError;

      const ratedCourseIds = new Set((ratings || []).map(r => r.course_id));

      // 2) Get Top 100 course memberships to filter rated courses
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', Array.from(ratedCourseIds));

      if (membershipsError) throw membershipsError;

      // Distinct Top 100 courses the user has rated
      const distinctCourseIds = Array.from(
        new Set((memberships || []).map(m => m.course_id))
      );
      const totalTop100 = distinctCourseIds.length;

      const badges: Top100Badge[] = [];

      // Milestone badges
      const milestoneDefs = [
        { threshold: 20, id: '20-club', label: '20 Club', desc: '20 Top 100 courses played.' },
        { threshold: 50, id: '50-club', label: '50 Club', desc: '50 Top 100 courses played.' },
        { threshold: 100, id: '100-century-club', label: '100 Century Club', desc: '100 Top 100 courses played.' },
        { threshold: 200, id: '200-elite', label: '200 Clubhouse Elite', desc: '200 Top 100 courses played.' },
        { threshold: 300, id: '300-champion', label: '300 Club Champion', desc: '300 Top 100 courses played.' },
      ];

      milestoneDefs.forEach(def => {
        if (totalTop100 >= def.threshold) {
          badges.push({
            id: def.id,
            label: def.label,
            description: def.desc,
            category: 'milestone',
            earned_at: null,
          });
        }
      });

      // 3) List completion badges (100/100 per list)
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug, name')
        .eq('is_active', true);

      if (listsError) throw listsError;

      const { data: allMemberships, error: allMembershipsError } = await supabase
        .from('course_top100_memberships')
        .select('course_id, list_id');

      if (allMembershipsError) throw allMembershipsError;

      const playedSet = new Set(distinctCourseIds);

      (lists || []).forEach(list => {
        const courseIdsForList = (allMemberships || [])
          .filter(m => m.list_id === list.id)
          .map(m => m.course_id);

        const totalInList = courseIdsForList.length;
        if (totalInList === 0) return;

        const playedInListCount = courseIdsForList.filter(id => playedSet.has(id)).length;

        if (playedInListCount >= totalInList) {
          badges.push({
            id: `list-${list.slug}`,
            label: `${list.name} · 100/100`,
            description: `Completed every course in the ${list.name} Top 100 list.`,
            category: 'list_completion',
            earned_at: null,
          });
        }
      });

      return badges;
    },
    staleTime: 60_000,
  });
}
