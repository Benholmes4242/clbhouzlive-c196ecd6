import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProfilePathById } from '@/lib/profileRoutes';

/**
 * Minimal profile data needed for routing
 */
interface MinimalProfileData {
  id: string;
  username: string | null;
  deleted_at: string | null;
}

/**
 * Hook to resolve the correct profile URL for a given user ID.
 *
 * Fetches only the minimal fields needed (id, username) and returns the
 * standard profile path. Results are cached to avoid repeated fetches.
 */
export function useProfileLink(userId: string | null | undefined) {
  const { data, isLoading } = useQuery<MinimalProfileData | null>({
    queryKey: ['profile-link', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, deleted_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useProfileLink] Error fetching profile:', error);
        return null;
      }

      return data as MinimalProfileData | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isDeleted = data?.deleted_at != null;

  const profileUrl = isDeleted
    ? null
    : data
    ? getProfilePathById(data.id, null, data.username)
    : userId
    ? `/profile/${userId}`
    : null;

  return {
    profileUrl,
    isLoading,
    isDeleted,
    data,
    getPath: (fallbackId?: string) => {
      if (isDeleted) return null;
      if (data) {
        return getProfilePathById(data.id, null, data.username);
      }
      return `/profile/${fallbackId ?? userId}`;
    },
  };
}

/**
 * Pre-fetch profile link data for multiple users at once.
 */
export async function prefetchProfileLinks(userIds: string[]): Promise<Map<string, MinimalProfileData>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, deleted_at')
    .in('id', uniqueIds)
    .is('deleted_at', null);

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

