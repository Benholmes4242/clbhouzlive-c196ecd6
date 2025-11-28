import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useUserProfile } from './useUserProfile';

export type FilterType = 'suggested' | 'club' | 'popular' | 'low';

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
  
  const [golfers, setGolfers] = useState<GolferProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('suggested');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Fetch all golfers and following status
  useEffect(() => {
    const fetchGolfers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profiles
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
          .neq('id', user.id)
          .limit(100);

        if (error) throw error;

        // Fetch follower counts for each user
        const profilesWithCounts = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { count } = await supabase
              .from('user_follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', profile.id);

            return {
              id: profile.id,
              displayName: profile.display_name || profile.username || 'User',
              username: profile.username,
              profileImage: profile.profile_photo_url || '',
              homeClub: profile.home_club,
              handicap: profile.eg_handicap_index,
              followersCount: count || 0,
            };
          })
        );

        // Fetch current user's following list
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingSet = new Set(followingData?.map(f => f.following_id) || []);
        setFollowingIds(followingSet);

        setGolfers(profilesWithCounts);
      } catch (error) {
        console.error('Error fetching golfers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGolfers();
  }, [user]);

  // Filter and sort golfers based on active filter and search query
  const filteredGolfers = useMemo(() => {
    let filtered = [...golfers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.displayName.toLowerCase().includes(query) ||
          g.username?.toLowerCase().includes(query) ||
          g.homeClub?.toLowerCase().includes(query)
      );
    }

    // Apply filter type
    switch (activeFilter) {
      case 'suggested':
        // Sort by followers count descending
        filtered.sort((a, b) => b.followersCount - a.followersCount);
        break;

      case 'club':
        // Filter by same home club
        if (currentProfile?.home_club) {
          filtered = filtered.filter(
            (g) => g.homeClub?.toLowerCase() === currentProfile.home_club?.toLowerCase()
          );
        }
        break;

      case 'popular':
        // Sort by followers count descending (same as suggested but more explicit)
        filtered.sort((a, b) => b.followersCount - a.followersCount);
        break;

      case 'low':
        // Filter and sort by low handicap
        filtered = filtered.filter((g) => g.handicap != null);
        filtered.sort((a, b) => (a.handicap || 99) - (b.handicap || 99));
        break;
    }

    return filtered;
  }, [golfers, searchQuery, activeFilter, currentProfile?.home_club]);

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

  return {
    golfers: filteredGolfers,
    loading,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    followingIds,
    updateFollowingStatus,
  };
}
