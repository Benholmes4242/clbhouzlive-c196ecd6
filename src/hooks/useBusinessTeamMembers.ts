import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  role: 'owner' | 'director' | 'admin' | 'coach' | 'staff';
  created_at: string;
  display_title: string | null;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_verified_golfer: boolean;
  } | null;
}

const ROLE_PRIORITY: Record<string, number> = {
  owner: 1,
  director: 2,
  admin: 3,
  coach: 4,
  staff: 5,
};

export function useBusinessTeamMembers(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-team-members', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('business_team_members')
        .select(`
          id,
          role,
          created_at,
          display_title,
          user_profiles:user_profile_id (
            id,
            display_name,
            username,
            profile_photo_url,
            is_verified_golfer
          )
        `)
        .eq('business_id', businessId);

      if (error) {
        console.error('[useBusinessTeamMembers] error:', error);
        throw error;
      }

      // Map and sort by role priority then alphabetically
      const members: TeamMember[] = (data || []).map((row: any) => ({
        id: row.id,
        role: row.role,
        created_at: row.created_at,
        display_title: row.display_title ?? null,
        profile: row.user_profiles,
      }));

      return members.sort((a, b) => {
        const priorityDiff = (ROLE_PRIORITY[a.role] || 99) - (ROLE_PRIORITY[b.role] || 99);
        if (priorityDiff !== 0) return priorityDiff;
        const nameA = a.profile?.display_name || '';
        const nameB = b.profile?.display_name || '';
        return nameA.localeCompare(nameB);
      });
    },
    staleTime: 60 * 1000,
  });
}
