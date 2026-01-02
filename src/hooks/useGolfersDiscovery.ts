import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useUserProfile } from './useUserProfile';
import { useQuery } from '@tanstack/react-query';

export type TabKey = 'suggested' | 'home_club' | 'verified';

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
  totalTop100Played: number;
  isVerified: boolean;
  friendStatus: 'none' | 'pending' | 'friends';
}

// Helper to fetch Top 100 counts for a list of user IDs
async function fetchTop100Counts(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('user_top100_rated_courses' as any)
    .select('user_id')
    .in('user_id', userIds);

  if (error) {
    console.warn('[useGolfersDiscovery] Failed to fetch Top 100 counts:', error);
    return new Map();
  }

  const countMap = new Map<string, number>();
  for (const row of (data || []) as any[]) {
    countMap.set(row.user_id, (countMap.get(row.user_id) || 0) + 1);
  }
  return countMap;
}

// Helper to fetch friend statuses for a list of user IDs
async function fetchFriendStatuses(
  currentUserId: string, 
  userIds: string[]
): Promise<Map<string, 'none' | 'pending' | 'friends'>> {
  if (userIds.length === 0 || !currentUserId) return new Map();
  
  const { data, error } = await supabase
    .from('user_friends')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
    .in('user_id', [...userIds, currentUserId])
    .in('friend_id', [...userIds, currentUserId]);

  if (error) {
    console.warn('[useGolfersDiscovery] Failed to fetch friend statuses:', error);
    return new Map();
  }

  const statusMap = new Map<string, 'none' | 'pending' | 'friends'>();
  
  for (const row of data || []) {
    const otherId = row.user_id === currentUserId ? row.friend_id : row.user_id;
    if (row.status === 'accepted') {
      statusMap.set(otherId, 'friends');
    } else if (row.status === 'pending') {
      statusMap.set(otherId, 'pending');
    }
  }
  
  return statusMap;
}

export function useGolfersDiscovery() {
  const { user } = useSupabaseSession();
  const { data: currentProfile } = useUserProfile(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('suggested');
  const [page, setPage] = useState(1);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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

  // Global search query (searches within active tab context)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-golfers', searchQuery, activeTab, currentProfile?.home_club],
    enabled: searchQuery.trim().length > 0 && !!user,
    queryFn: async () => {
      const query = searchQuery.trim().toLowerCase();
      
      let baseQuery = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index, is_verified_golfer')
        .neq('id', user!.id)
        .is('deleted_at', null)
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,home_club.ilike.%${query}%`);

      // Apply tab-specific filters to search
      switch (activeTab) {
        case 'home_club':
          if (currentProfile?.home_club) {
            baseQuery = baseQuery.ilike('home_club', currentProfile.home_club);
          }
          break;
        case 'verified':
          baseQuery = baseQuery.eq('is_verified_golfer', true);
          break;
      }

      const { data, error } = await baseQuery.limit(50);

      if (error) throw error;

      const userIds = (data || []).map(p => p.id);
      const [top100Counts, friendStatuses] = await Promise.all([
        fetchTop100Counts(userIds),
        fetchFriendStatuses(user!.id, userIds)
      ]);

      return (data || []).map(profile => ({
        id: profile.id,
        displayName: profile.display_name || profile.username || 'User',
        username: profile.username,
        profileImage: profile.profile_photo_url || '',
        homeClub: profile.home_club,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
        totalTop100Played: top100Counts.get(profile.id) || 0,
        isVerified: profile.is_verified_golfer || false,
        friendStatus: friendStatuses.get(profile.id) || 'none',
      }));
    },
  });

  // Paginated filtered query by tab
  const { data: filteredData, isLoading: filterLoading } = useQuery({
    queryKey: ['golfers-filtered', activeTab, page, currentProfile?.home_club, user?.id],
    enabled: searchQuery.trim().length === 0 && !!user,
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index, is_verified_golfer', { count: 'exact' })
        .neq('id', user!.id)
        .is('deleted_at', null);

      // Apply tab-specific filters
      switch (activeTab) {
        case 'home_club':
          if (currentProfile?.home_club) {
            query = query.ilike('home_club', currentProfile.home_club);
          }
          break;
        case 'verified':
          query = query.eq('is_verified_golfer', true);
          break;
        case 'suggested':
        default:
          // Suggested: prioritize same home club, then verified
          if (currentProfile?.home_club) {
            // Order by home club match first (requires custom logic in results)
          }
          break;
      }

      const offset = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const userIds = (data || []).map(p => p.id);
      const [top100Counts, friendStatuses] = await Promise.all([
        fetchTop100Counts(userIds),
        fetchFriendStatuses(user!.id, userIds)
      ]);

      let profiles: GolferProfile[] = (data || []).map(profile => ({
        id: profile.id,
        displayName: profile.display_name || profile.username || 'User',
        username: profile.username,
        profileImage: profile.profile_photo_url || '',
        homeClub: profile.home_club,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
        totalTop100Played: top100Counts.get(profile.id) || 0,
        isVerified: profile.is_verified_golfer || false,
        friendStatus: friendStatuses.get(profile.id) || 'none',
      }));

      // For suggested tab, sort by: same home club first, then verified
      if (activeTab === 'suggested' && currentProfile?.home_club) {
        profiles.sort((a, b) => {
          const aClubMatch = a.homeClub?.toLowerCase() === currentProfile.home_club?.toLowerCase() ? 1 : 0;
          const bClubMatch = b.homeClub?.toLowerCase() === currentProfile.home_club?.toLowerCase() ? 1 : 0;
          if (aClubMatch !== bClubMatch) return bClubMatch - aClubMatch;
          
          const aVerified = a.isVerified ? 1 : 0;
          const bVerified = b.isVerified ? 1 : 0;
          return bVerified - aVerified;
        });
      }

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

  // Check if user has no home club (for nudge display)
  const hasNoHomeClub = !currentProfile?.home_club;

  return {
    golfers,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    followingIds,
    updateFollowingStatus,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize: PAGE_SIZE,
    isSearching,
    hasNoHomeClub,
    // Keep legacy names for compatibility
    activeFilter: activeTab,
    setActiveFilter: setActiveTab as (filter: any) => void,
  };
}

// Keep legacy type export for compatibility
export type FilterType = TabKey;
