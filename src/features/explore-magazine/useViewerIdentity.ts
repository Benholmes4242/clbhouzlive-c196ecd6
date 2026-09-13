import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE VIEWER'S OWN IDENTITY, from user_profiles ONLY.
 *
 * display_name and profile_photo_url are the ONLY identity source anywhere in
 * this app. NEVER whs_friends / whs_friend_matches: those carry England Golf
 * personal data — real names surname-first ("Lang, David") and photo URLs on
 * static.whsplatform.englandgolf.org. A member with no clbhouz photo gets
 * initials on the deterministic gradient, never a grey circle and never an
 * England Golf photograph.
 */
export interface ViewerIdentity {
  displayName: string | null;
  photoUrl: string | null;
}

export function useViewerIdentity(viewerId: string | undefined) {
  const q = useQuery({
    queryKey: ['explore', 'viewer-identity', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ViewerIdentity> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, profile_photo_url')
        .eq('id', viewerId as string)
        .maybeSingle();
      if (error) throw error;
      return {
        displayName: (data?.display_name as string | null) ?? null,
        photoUrl: (data?.profile_photo_url as string | null) ?? null,
      };
    },
  });

  /* UNRESOLVED IS NOT ABSENT: while the read is in flight the tile shows the
     initials fallback, and it swaps to the photograph when the row settles. */
  return { identity: q.data ?? null, isFetched: q.isFetched };
}
