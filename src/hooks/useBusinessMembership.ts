import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type BusinessRole = 'owner' | 'admin' | 'editor' | 'analyst';

export interface BusinessMembership {
  role: BusinessRole;
  canViewInsights: boolean;
  canManage: boolean;
}

export function useBusinessMembership(businessId?: string) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['business-membership', businessId, userId],
    enabled: !!businessId && !!userId,
    queryFn: async (): Promise<BusinessMembership | null> => {
      if (!businessId || !userId) return null;

      const { data, error } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_profile_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      const role = data.role as BusinessRole;
      const canViewInsights = ['owner', 'admin', 'editor', 'analyst'].includes(role);
      const canManage = ['owner', 'admin'].includes(role);

      return { role, canViewInsights, canManage };
    },
    staleTime: 5 * 60 * 1000,
  });
}
