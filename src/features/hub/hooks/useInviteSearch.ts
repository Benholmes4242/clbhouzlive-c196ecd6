/**
 * useInviteSearch - Hook for searching users to invite to a game
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDebounce } from '@/hooks/useDebounce';

export interface InvitableUser {
  id: string;
  displayName: string;
  username?: string;
  profilePhotoUrl?: string;
  homeClub?: string;
}

export function useInviteSearch(gameId?: string) {
  const { user } = useSupabaseSession();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch existing participants to exclude
  const existingParticipantsQuery = useQuery({
    queryKey: ['game-participants-ids', gameId],
    queryFn: async () => {
      if (!gameId) return new Set<string>();
      
      const { data, error } = await supabase
        .from('game_participants')
        .select('user_id')
        .eq('game_id', gameId)
        .not('user_id', 'is', null);
      
      if (error) throw error;
      return new Set((data || []).map(p => p.user_id).filter(Boolean));
    },
    enabled: !!gameId,
  });

  // Fetch friends and following for invite suggestions
  const suggestionsQuery = useQuery({
    queryKey: ['invite-suggestions', user?.id, debouncedSearch],
    queryFn: async (): Promise<InvitableUser[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          golf_clubs:primary_club_id (name)
        `)
        .neq('id', user.id)
        .limit(20);

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(`display_name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        displayName: p.display_name || 'Unknown',
        username: p.username,
        profilePhotoUrl: p.profile_photo_url,
        homeClub: p.golf_clubs?.name,
      }));
    },
    enabled: !!user?.id,
  });

  // Filter out existing participants
  const availableUsers = suggestionsQuery.data?.filter(
    u => !existingParticipantsQuery.data?.has(u.id)
  ) || [];

  return {
    searchInput,
    setSearchInput,
    users: availableUsers,
    isLoading: suggestionsQuery.isLoading,
    existingParticipantIds: existingParticipantsQuery.data || new Set(),
  };
}
