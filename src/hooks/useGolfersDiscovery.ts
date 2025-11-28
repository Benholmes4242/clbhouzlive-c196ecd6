import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useUserProfile } from './useUserProfile';
import { useQuery } from '@tanstack/react-query';

export type FilterType = 'suggested' | 'club' | 'popular' | 'low';

const PAGE_SIZE = 15;

interface GolferProfile {
  id: string;
  displayName: string;
  username?: string;
  profileImage: string;
  homeClub?: string;
  homeClubId?: string;
  handicap?: number | null;
  followersCount: number;
}

export function useGolfersDiscovery() {
  const { user } = useSupabaseSession();
  const { data: currentProfile } = useUserProfile(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('suggested');
  const [page, setPage] = useState(1);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Fetch following status once
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) return;

      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingSet = new Set(followingData?.map(f => f.following_id) || []);
      setFollowingIds(followingSet);
    };

    fetchFollowing();
  }, [user]);

  // Global search query (ignores filter)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-golfers', searchQuery],
    enabled: searchQuery.trim().length > 0 && !!user,
    queryFn: async () => {
      const query = searchQuery.trim().toLowerCase();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
        .neq('id', user!.id)
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,home_club.ilike.%${query}%`)
        .limit(50);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        displayName: profile.display_name || profile.username || 'User',
        username: profile.username,
        profileImage: profile.profile_photo_url || '',
        homeClub: profile.home_club,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
      }));
    },
  });

  // Paginated filtered query
  const { data: filteredData, isLoading: filterLoading } = useQuery({
    queryKey: ['golfers-filtered', activeFilter, page, currentProfile?.home_club],
    enabled: searchQuery.trim().length === 0 && !!user,
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index', { count: 'exact' })
        .neq('id', user!.id);

      // Apply filter
      switch (activeFilter) {
        case 'club':
          if (currentProfile?.home_club) {
            query = query.ilike('home_club', currentProfile.home_club);
          }
          break;
        case 'low':
          query = query.not('eg_handicap_index', 'is', null).order('eg_handicap_index', { ascending: true });
          break;
        case 'popular':
        case 'suggested':
          // For popular/suggested, we'll sort by follower count (would need a join or view in production)
          // For now, just return all users
          break;
      }

      const offset = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const profiles = (data || []).map(profile => ({
        id: profile.id,
        displayName: profile.display_name || profile.username || 'User',
        username: profile.username,
        profileImage: profile.profile_photo_url || '',
        homeClub: profile.home_club,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
      }));

      return {
        golfers: profiles,
        totalCount: count || 0,
      };
    },
  });

  const updateFollowingStatus = (userId: string, isFollowing: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const isSearching = searchQuery.trim().length > 0;
  const golfers = isSearching ? searchResults || [] : filteredData?.golfers || [];
  const totalCount = isSearching ? searchResults?.length || 0 : filteredData?.totalCount || 0;
  const loading = isSearching ? searchLoading : filterLoading;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    golfers,
    loading,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    followingIds,
    updateFollowingStatus,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize: PAGE_SIZE,
    isSearching,
  };
}
