import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type SuggestionReason =
  | 'friend'
  | 'mutual_follow'
  | 'same_club'
  | 'friend_of_friend'
  | 'following';

export interface SuggestedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  eg_handicap_index: number | null;
  home_club: string | null;
  reason: SuggestionReason;
  reason_detail: string | null;
  tier: number;
}

/**
 * Returns up to 6 ranked DM suggestions for the current user,
 * sourced from existing relationship data (friends, follows, home club).
 *
 * Pass `enabled = false` to skip fetching (e.g. when a search query is active).
 */
export function useSuggestedUsers(enabled: boolean = true) {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['suggested-dm-users', user?.id],
    queryFn: async (): Promise<SuggestedUser[]> => {
      const { data, error } = await supabase.rpc('get_suggested_dm_users' as any, { p_limit: 6 });
      if (error) {
        console.error('[useSuggestedUsers]', error);
        return [];
      }
      return ((data ?? []) as unknown) as SuggestedUser[];
    },
    enabled: enabled && !!user,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Map reason code to display copy.
 */
export function suggestionReasonLabel(reason: SuggestionReason, detail: string | null): string {
  switch (reason) {
    case 'friend':           return 'Friend';
    case 'mutual_follow':    return 'You follow each other';
    case 'same_club':        return detail ? `Plays at ${detail}` : 'Same home club';
    case 'friend_of_friend': return detail ? `Friend of ${detail}` : 'Friend of a friend';
    case 'following':        return 'You follow';
    default:                 return '';
  }
}
