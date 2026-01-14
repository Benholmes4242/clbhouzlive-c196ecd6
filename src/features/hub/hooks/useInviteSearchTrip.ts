/**
 * useInviteSearchTrip - Hook for searching users to invite to a trip
 * Filters out users already in the trip
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export interface InvitableUser {
  id: string;
  displayName: string;
  username: string | null;
  profilePhotoUrl: string | null;
  homeClub: string | null;
}

export function useInviteSearchTrip(tripId: string) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch existing trip participants to exclude them
  const { data: existingParticipantIds = [] } = useQuery({
    queryKey: ['trip-participants-ids', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', tripId);

      if (error) throw error;
      return data?.map(p => p.user_id).filter(Boolean) as string[];
    },
    enabled: !!tripId,
    staleTime: 30000,
  });

  // Search for users
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['invite-search-trip', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club')
        .ilike('display_name', `%${debouncedSearch}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map(u => ({
        id: u.id,
        displayName: u.display_name || 'Unknown',
        username: u.username,
        profilePhotoUrl: u.profile_photo_url,
        homeClub: u.home_club,
      })) as InvitableUser[];
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30000,
  });

  // Filter out users already in the trip
  const users = useMemo(() => {
    return searchResults.filter(u => !existingParticipantIds.includes(u.id));
  }, [searchResults, existingParticipantIds]);

  return {
    searchInput,
    setSearchInput,
    users,
    isLoading,
  };
}
