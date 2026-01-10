import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CreatorRole = 'owner' | 'admin' | 'editor' | 'analyst';

export interface CreatorMembership {
  id: string;
  role: CreatorRole;
  creatorPage: {
    id: string;
    display_name: string;
    slug: string;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    is_verified: boolean;
    is_public: boolean;
  };
}

/**
 * Fetch all creator pages the current user is a member of
 */
export function useMyCreators(userProfileId?: string) {
  return useQuery({
    queryKey: ['my-creators', userProfileId],
    enabled: !!userProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_members')
        .select(`
          id,
          role,
          creator_page:creator_pages (
            id,
            display_name,
            slug,
            avatar_url,
            cover_url,
            bio,
            is_verified,
            is_public
          )
        `)
        .eq('user_profile_id', userProfileId);

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data ?? [])
        .filter(item => item.creator_page !== null)
        .map(item => ({
          id: item.id,
          role: item.role as CreatorRole,
          creatorPage: item.creator_page as CreatorMembership['creatorPage'],
        }));
    },
  });
}

/**
 * Check if user has any creator pages they manage
 */
export function useHasCreators(userProfileId?: string) {
  const { data, isLoading } = useMyCreators(userProfileId);
  return {
    hasCreators: (data?.length ?? 0) > 0,
    isLoading,
    count: data?.length ?? 0,
  };
}

/**
 * Roles that can post as a creator page
 */
export const CREATOR_POSTING_ROLES: CreatorRole[] = ['owner', 'admin', 'editor'];

/**
 * Check if a role can post as the creator page
 */
export function canPostAsCreator(role: CreatorRole): boolean {
  return CREATOR_POSTING_ROLES.includes(role);
}
