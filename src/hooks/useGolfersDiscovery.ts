import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useUserProfile } from './useUserProfile';

export type FilterType = 'suggested' | 'club' | 'popular' | 'low_hcap';

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
  isFollowing?: boolean;
  friendStatus?: 'none' | 'pending' | 'friends';
}

export function useGolfersDiscovery(filter: FilterType, page: number) {
  const { user } = useSupabaseSession();
  const { data: currentProfile } = useUserProfile(user?.id);

  return useQuery({
    queryKey: ['golfers-discovery', filter, page, user?.id, currentProfile?.home_club],
    queryFn: async () => {
      if (!user) return { golfers: [], totalCount: 0 };

      // Build base query
      let query = supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index', { count: 'exact' })
        .neq('id', user.id);

      // Apply filter
      switch (filter) {
        case 'suggested':
          // Default: order by followers count
          query = query.order('created_at', { ascending: false });
          break;

        case 'club':
          // Filter by same home club
          if (currentProfile?.home_club) {
            query = query.eq('home_club', currentProfile.home_club);
          } else {
            return { golfers: [], totalCount: 0 };
          }
          break;

        case 'popular':
          // Order by activity/followers (for now just recent)
          query = query.order('created_at', { ascending: false });
          break;

        case 'low_hcap':
          // Filter and sort by low handicap
          query = query.not('eg_handicap_index', 'is', null).order('eg_handicap_index', { ascending: true });
          break;
      }

      // Apply pagination
      const offset = (page - 1) * PAGE_SIZE;
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data: profiles, error, count } = await query;

      if (error) throw error;

      // Fetch follower counts and following/friend status for each user
      const golfers = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get follower count
          const { count: followersCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);

          // Check if current user is following
          const { data: followData } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .maybeSingle();

          // Check friend status
          const { data: friendData } = await supabase
            .from('user_friends')
            .select('status')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
            .maybeSingle();

          let friendStatus: 'none' | 'pending' | 'friends' = 'none';
          if (friendData) {
            friendStatus = friendData.status === 'accepted' ? 'friends' : 'pending';
          }

          return {
            id: profile.id,
            displayName: profile.display_name || profile.username || 'User',
            username: profile.username,
            profileImage: profile.profile_photo_url || '',
            homeClub: profile.home_club,
            handicap: profile.eg_handicap_index,
            followersCount: followersCount || 0,
            isFollowing: !!followData,
            friendStatus,
          };
        })
      );

      return {
        golfers,
        totalCount: count || 0,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Global search hook
export function useSearchGolfers(query: string) {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['search-golfers', query],
    queryFn: async () => {
      if (!user || query.trim().length === 0) return [];

      const searchTerm = query.toLowerCase();

      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
        .neq('id', user.id)
        .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,home_club.ilike.%${searchTerm}%`)
        .limit(50);

      if (error) throw error;

      // Fetch following/friend status for search results
      const golfers = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: followersCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);

          const { data: followData } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .maybeSingle();

          const { data: friendData } = await supabase
            .from('user_friends')
            .select('status')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
            .maybeSingle();

          let friendStatus: 'none' | 'pending' | 'friends' = 'none';
          if (friendData) {
            friendStatus = friendData.status === 'accepted' ? 'friends' : 'pending';
          }

          return {
            id: profile.id,
            displayName: profile.display_name || profile.username || 'User',
            username: profile.username,
            profileImage: profile.profile_photo_url || '',
            homeClub: profile.home_club,
            handicap: profile.eg_handicap_index,
            followersCount: followersCount || 0,
            isFollowing: !!followData,
            friendStatus,
          };
        })
      );

      return golfers;
    },
    enabled: !!user && query.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
