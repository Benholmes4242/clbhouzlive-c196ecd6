import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProfilePathById } from '@/lib/profileRoutes';

/**
 * Minimal profile data needed for routing
 */
interface MinimalProfileData {
  id: string;
  username: string | null;
  creator_only: boolean;
  deleted_at: string | null;
}

/**
 * Hook to resolve the correct profile URL for a given user ID.
 * 
 * This hook fetches only the minimal fields needed (id, username, creator_only)
 * and returns the appropriate URL based on the user's creator_only status.
 * 
 * Results are cached to avoid repeated fetches.
 * 
 * @param userId - The user's ID to resolve
 * @returns Object with profileUrl, isLoading, and navigate helper
 */
export function useProfileLink(userId: string | null | undefined) {
  const { data, isLoading } = useQuery<MinimalProfileData | null>({
    queryKey: ['profile-link', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, creator_only, deleted_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useProfileLink] Error fetching profile:', error);
        return null;
      }

      return data as MinimalProfileData | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  });

  // Check if user is deleted
  const isDeleted = data?.deleted_at != null;

  // Compute the profile URL from the fetched data
  // Return null for deleted users to indicate profile unavailable
  const profileUrl = isDeleted
    ? null
    : data
    ? getProfilePathById(data.id, data.creator_only, data.username)
    : userId
    ? `/profile/${userId}` // Fallback while loading
    : null;

  return {
    profileUrl,
    isLoading,
    isDeleted,
    data,
    /**
     * Helper to get the path synchronously if you have partial data
     * Returns null if user is deleted
     */
    getPath: (fallbackId?: string) => {
      if (isDeleted) return null;
      if (data) {
        return getProfilePathById(data.id, data.creator_only, data.username);
      }
      return `/profile/${fallbackId ?? userId}`;
    },
  };
}

/**
 * Pre-fetch profile link data for multiple users at once.
 * Useful for lists where you want to batch-load creator_only status.
 * 
 * @param userIds - Array of user IDs to fetch
 */
export async function prefetchProfileLinks(userIds: string[]): Promise<Map<string, MinimalProfileData>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, creator_only, deleted_at')
    .in('id', uniqueIds)
    .is('deleted_at', null); // Only include non-deleted users

  if (error) {
    console.error('[prefetchProfileLinks] Error:', error);
    return new Map();
  }

  const map = new Map<string, MinimalProfileData>();
  for (const profile of data ?? []) {
    map.set(profile.id, profile as MinimalProfileData);
  }

  return map;
}
