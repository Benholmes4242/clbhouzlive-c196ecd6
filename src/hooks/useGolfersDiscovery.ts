import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useUserProfile } from './useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { useDiscoveryExclusions } from './useDiscoveryExclusions';
import { getMockSocialUsers } from '@/mocks/mockSocialUsers';

export type TabKey = 'suggested' | 'home_club' | 'verified';

const PAGE_SIZE = 15;

interface GolferProfile {
  id: string;
  displayName: string;
  username?: string;
  profileImage: string;
  homeClub?: string;
  primaryClubId?: string; // Links to golf_clubs.id (canonical club identity)
  handicap?: number | null;
  followersCount: number;
  totalTop100Played: number;
  isVerified: boolean;
  friendStatus: 'none' | 'pending' | 'friends';
  createdAt?: string;
}

function getMockGolferProfiles(): GolferProfile[] {
  return getMockSocialUsers().map((m) => ({
    id: m.id,
    displayName: m.display_name,
    username: m.username,
    profileImage: m.avatar_url || '',
    homeClub: m.home_club || undefined,
    primaryClubId: undefined,
    handicap: null,
    followersCount: m.follower_count,
    totalTop100Played: Math.floor(Math.random() * 30),
    isVerified: Math.random() > 0.8,
    friendStatus: m.is_friend ? 'friends' : (Math.random() > 0.7 ? 'pending' : 'none'),
    createdAt: new Date().toISOString(),
  }));
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
  const { data: exclusions } = useDiscoveryExclusions(user?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('suggested');
  const [page, setPage] = useState(1);
  
  // Local optimistic state for follows (for immediate UI updates)
  const [optimisticFollows, setOptimisticFollows] = useState<Map<string, boolean>>(new Map());

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Compute effective following set (exclusions + optimistic updates)
  const followingIds = useMemo(() => {
    const baseFollowing = exclusions?.followingIds || new Set<string>();
    const result = new Set(baseFollowing);
    
    // Apply optimistic updates
    optimisticFollows.forEach((isFollowing, userId) => {
      if (isFollowing) {
        result.add(userId);
      } else {
        result.delete(userId);
      }
    });
    
    return result;
  }, [exclusions?.followingIds, optimisticFollows]);

  // Helper to determine if home club query is enabled
  // Use primary_club_id ONLY (canonical) - no text fallback since accounts are wiped pre-launch
  const viewerPrimaryClubId = currentProfile?.primary_club_id;
  const hasHomeClub = !!viewerPrimaryClubId;

  // Global search query (searches within active tab context)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-golfers', searchQuery, activeTab, viewerPrimaryClubId],
    // Home Club search only enabled if user has primary_club_id set
    enabled: searchQuery.trim().length > 0 && !!user && (activeTab !== 'home_club' || !!viewerPrimaryClubId),
    queryFn: async () => {
      const query = searchQuery.trim().toLowerCase();
      
      let baseQuery = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, primary_club_id, eg_handicap_index, is_verified_golfer, created_at')
        .neq('id', user!.id)
        .is('deleted_at', null)
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,home_club.ilike.%${query}%`);

      // Apply tab-specific filters to search
      // Use primary_club_id ONLY (canonical) - no text fallback
      switch (activeTab) {
        case 'home_club':
          // Only filter by primary_club_id (guaranteed to exist due to enabled check)
          baseQuery = baseQuery.eq('primary_club_id', viewerPrimaryClubId);
          break;
        case 'verified':
          baseQuery = baseQuery.eq('is_verified_golfer', true);
          break;
      }

      // Add ordering for consistency
      baseQuery = baseQuery.order('created_at', { ascending: false });

      const { data, error } = await baseQuery.limit(100); // Fetch more to have enough after exclusions

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
        primaryClubId: profile.primary_club_id,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
        totalTop100Played: top100Counts.get(profile.id) || 0,
        isVerified: profile.is_verified_golfer || false,
        friendStatus: friendStatuses.get(profile.id) || 'none',
        createdAt: profile.created_at,
      }));
    },
  });

  // Paginated filtered query by tab
  const { data: filteredData, isLoading: filterLoading } = useQuery({
    queryKey: ['golfers-filtered', activeTab, page, viewerPrimaryClubId, user?.id],
    // Home Club tab only enabled if user has primary_club_id set
    enabled: searchQuery.trim().length === 0 && !!user && (activeTab !== 'home_club' || !!viewerPrimaryClubId),
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, primary_club_id, eg_handicap_index, is_verified_golfer, created_at', { count: 'exact' })
        .neq('id', user!.id)
        .is('deleted_at', null);

      // Apply tab-specific filters
      // Use primary_club_id ONLY (canonical) - no text fallback
      switch (activeTab) {
        case 'home_club':
          // Only filter by primary_club_id (guaranteed to exist due to enabled check)
          query = query.eq('primary_club_id', viewerPrimaryClubId);
          break;
        case 'verified':
          query = query.eq('is_verified_golfer', true);
          break;
        case 'suggested':
        default:
          // Suggested shows all, ranking applied client-side
          break;
      }

      // Apply consistent ordering
      query = query.order('created_at', { ascending: false });

      // Fetch more than needed to account for exclusions
      const fetchLimit = PAGE_SIZE * 3;
      const { data, error, count } = await query.limit(fetchLimit);

      if (error) throw error;

      const userIds = (data || []).map(p => p.id);
      const [top100Counts, friendStatuses] = await Promise.all([
        fetchTop100Counts(userIds),
        fetchFriendStatuses(user!.id, userIds)
      ]);

      const profiles: GolferProfile[] = (data || []).map(profile => ({
        id: profile.id,
        displayName: profile.display_name || profile.username || 'User',
        username: profile.username,
        profileImage: profile.profile_photo_url || '',
        homeClub: profile.home_club,
        primaryClubId: profile.primary_club_id,
        handicap: profile.eg_handicap_index,
        followersCount: 0,
        totalTop100Played: top100Counts.get(profile.id) || 0,
        isVerified: profile.is_verified_golfer || false,
        friendStatus: friendStatuses.get(profile.id) || 'none',
        createdAt: profile.created_at,
      }));

      return {
        golfers: profiles,
        totalCount: count || 0,
      };
    },
  });

  // Apply exclusions and sorting client-side
  const processedGolfers = useMemo(() => {
    const excludedIds = exclusions?.excludedIds || new Set<string>();
    const isSearching = searchQuery.trim().length > 0;
    const rawGolfers = isSearching ? searchResults || [] : filteredData?.golfers || [];
    
    // Inject mock users for testing
    const mockGolfers = getMockGolferProfiles();
    const allGolfers = [...rawGolfers, ...mockGolfers];
    
    // Filter out excluded users
    let filtered = allGolfers.filter(g => !excludedIds.has(g.id));
    
    // For suggested tab, apply ranking: same home club first, then verified, then by created_at
    if (activeTab === 'suggested' && !isSearching) {
      filtered.sort((a, b) => {
        // 1. Same home club as viewer (using primary_club_id ONLY)
        const aClubMatch = viewerPrimaryClubId ? a.primaryClubId === viewerPrimaryClubId : false;
        const bClubMatch = viewerPrimaryClubId ? b.primaryClubId === viewerPrimaryClubId : false;
        
        if (aClubMatch !== bClubMatch) return bClubMatch ? 1 : -1;
        
        // 2. Verified users next
        if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1;
        
        // 3. By created_at (newest first) for stability
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    
    // For verified and home_club tabs, ensure consistent ordering by created_at
    if ((activeTab === 'verified' || activeTab === 'home_club') && !isSearching) {
      filtered.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    
    return filtered;
  }, [searchResults, filteredData?.golfers, exclusions?.excludedIds, activeTab, viewerPrimaryClubId, searchQuery]);

  // Paginate the processed results
  const paginatedGolfers = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0;
    if (isSearching) {
      // For search, show up to 50 results
      return processedGolfers.slice(0, 50);
    }
    // For tabs, paginate
    return processedGolfers.slice(0, page * PAGE_SIZE);
  }, [processedGolfers, page, searchQuery]);

  const updateFollowingStatus = (userId: string, isFollowing: boolean) => {
    setOptimisticFollows(prev => {
      const next = new Map(prev);
      next.set(userId, isFollowing);
      return next;
    });
  };

  const isSearching = searchQuery.trim().length > 0;
  const totalCount = processedGolfers.length;
  const loading = isSearching ? searchLoading : filterLoading;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Check if user has no home club (for nudge display)
  const hasNoHomeClub = !hasHomeClub;

  return {
    golfers: paginatedGolfers,
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
