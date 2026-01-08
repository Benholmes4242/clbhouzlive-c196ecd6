/**
 * useNearbyPlayers - Hook for finding players within 50 miles of user's home club
 * Falls back to same-country players when location isn't available
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MILES_TO_KM = 1.60934;
const DEFAULT_RADIUS_MILES = 50;
const EXPANDED_RADIUS_MILES = 100;
const MIN_NEARBY_COUNT = 10;

// Haversine formula for distance calculation
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export interface NearbyPlayer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  home_club: string | null;
  home_club_id: string | null;
  total_top100_played: number;
  rank: number;
  distance_km?: number;
  country?: string;
}

export interface UserHomeClubLocation {
  lat: number;
  lng: number;
  country: string;
  clubName: string;
}

export interface UseNearbyPlayersResult {
  players: NearbyPlayer[];
  isLoading: boolean;
  isError: boolean;
  userLocation: UserHomeClubLocation | null;
  fallbackMode: 'nearby' | 'country' | 'none';
  radiusUsed: number; // in miles
}

export function useNearbyPlayers(userId: string | null): UseNearbyPlayersResult {
  // First, get user's home club location
  const { data: userClubData, isLoading: loadingUserClub } = useQuery({
    queryKey: ['user-home-club-location', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Debug: Log the user ID being queried
      console.log('[useNearbyPlayers] Fetching home club for userId:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('home_club_id, home_club')
        .eq('id', userId!)
        .single();

      // Debug: Log profile data
      console.log('[useNearbyPlayers] Profile data:', profile, 'Error:', profileError);

      if (!profile?.home_club_id) {
        console.log('[useNearbyPlayers] No home_club_id found for user');
        return null;
      }

      const { data: club, error: clubError } = await supabase
        .from('golf_clubs')
        .select('latitude, longitude, country, name')
        .eq('id', profile.home_club_id)
        .single();

      // Debug: Log club data
      console.log('[useNearbyPlayers] Club data:', club, 'Error:', clubError);

      if (!club) {
        console.log('[useNearbyPlayers] No club found for home_club_id:', profile.home_club_id);
        return null;
      }

      // Check if club has valid coordinates
      if (!club.latitude || !club.longitude) {
        console.log('[useNearbyPlayers] Club missing lat/lng:', club);
      }

      return {
        lat: club.latitude,
        lng: club.longitude,
        country: club.country,
        clubName: club.name || profile.home_club,
        clubId: profile.home_club_id,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all leaderboard players with their locations
  const { data: playersData, isLoading: loadingPlayers, isError } = useQuery({
    queryKey: ['nearby-players-pool', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Get all players with their home club info
      const { data, error } = await supabase.rpc('get_top100_leaderboard', {
        scope_param: 'worldwide',
        time_range_param: 'all_time',
        limit_param: 500,
        offset_param: 0,
        current_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch club locations for all players who have home_club_id
  const { data: clubLocations } = useQuery({
    queryKey: ['club-locations-cache'],
    enabled: !!playersData && playersData.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('golf_clubs')
        .select('id, latitude, longitude, country');
      
      // Create a lookup map
      const map = new Map<string, { lat: number; lng: number; country: string }>();
      data?.forEach((club) => {
        if (club.latitude && club.longitude) {
          map.set(club.id, {
            lat: club.latitude,
            lng: club.longitude,
            country: club.country || '',
          });
        }
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Compute nearby players
  const result = (() => {
    // Debug: Log the decision-making process
    console.log('[useNearbyPlayers] Computing result:', {
      userId,
      hasPlayersData: !!playersData,
      userClubData,
      hasClubLocations: !!clubLocations,
    });

    if (!userId || !playersData) {
      console.log('[useNearbyPlayers] No userId or playersData, returning none');
      return {
        players: [],
        fallbackMode: 'none' as const,
        radiusUsed: 0,
      };
    }

    const hasValidLocation = userClubData?.lat && userClubData?.lng;
    console.log('[useNearbyPlayers] hasValidLocation:', hasValidLocation);

    if (hasValidLocation && clubLocations) {
      // Calculate distances and filter
      const radiusKm = DEFAULT_RADIUS_MILES * MILES_TO_KM;
      const expandedRadiusKm = EXPANDED_RADIUS_MILES * MILES_TO_KM;

      const playersWithDistance: NearbyPlayer[] = [];

      for (const player of playersData as any[]) {
        if (player.user_id === userId) continue; // Exclude self

        // Try to get club location from cache
        const clubLoc = player.home_club_id 
          ? clubLocations.get(player.home_club_id)
          : null;

        if (clubLoc?.lat && clubLoc?.lng) {
          const distance = haversineDistance(
            userClubData.lat!,
            userClubData.lng!,
            clubLoc.lat,
            clubLoc.lng
          );

          playersWithDistance.push({
            user_id: player.user_id,
            display_name: player.display_name || player.username || 'Anonymous',
            avatar_url: player.profile_photo_url,
            home_club: player.home_club,
            home_club_id: player.home_club_id,
            total_top100_played: player.top100_courses_played,
            rank: player.global_rank,
            distance_km: distance,
            country: clubLoc.country,
          });
        }
      }

      // Filter by radius
      let nearbyPlayers = playersWithDistance.filter(
        (p) => (p.distance_km || 0) <= radiusKm
      );

      let usedRadius = DEFAULT_RADIUS_MILES;

      // If too few, expand radius
      if (nearbyPlayers.length < MIN_NEARBY_COUNT) {
        nearbyPlayers = playersWithDistance.filter(
          (p) => (p.distance_km || 0) <= expandedRadiusKm
        );
        usedRadius = EXPANDED_RADIUS_MILES;
      }

      // Sort by distance
      nearbyPlayers.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

      // If still too few, supplement with same-country
      if (nearbyPlayers.length < MIN_NEARBY_COUNT && userClubData.country) {
        const countryPlayers = playersWithDistance
          .filter(
            (p) =>
              p.country === userClubData.country &&
              !nearbyPlayers.some((n) => n.user_id === p.user_id)
          )
          .slice(0, MIN_NEARBY_COUNT - nearbyPlayers.length);
        
        nearbyPlayers = [...nearbyPlayers, ...countryPlayers];
      }

      // Re-rank within nearby list
      const rankedPlayers = nearbyPlayers
        .sort((a, b) => b.total_top100_played - a.total_top100_played)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      return {
        players: rankedPlayers,
        fallbackMode: 'nearby' as const,
        radiusUsed: usedRadius,
      };
    }

    // Fallback: same country
    if (userClubData?.country) {
      console.log('[useNearbyPlayers] Using country fallback for:', userClubData.country);
      const countryPlayers = (playersData as any[])
        .filter((p) => p.user_id !== userId)
        .map((player) => ({
          user_id: player.user_id,
          display_name: player.display_name || player.username || 'Anonymous',
          avatar_url: player.profile_photo_url,
          home_club: player.home_club,
          home_club_id: player.home_club_id,
          total_top100_played: player.top100_courses_played,
          rank: player.global_rank,
          country: userClubData.country,
        }))
        .sort((a, b) => b.total_top100_played - a.total_top100_played)
        .slice(0, 50)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      console.log('[useNearbyPlayers] Found', countryPlayers.length, 'players in country');
      return {
        players: countryPlayers,
        fallbackMode: 'country' as const,
        radiusUsed: 0,
      };
    }

    console.log('[useNearbyPlayers] No valid location or country, returning none');
    return {
      players: [],
      fallbackMode: 'none' as const,
      radiusUsed: 0,
    };
  })();

  // Debug: Log final result
  console.log('[useNearbyPlayers] Final result:', {
    playerCount: result.players.length,
    fallbackMode: result.fallbackMode,
    radiusUsed: result.radiusUsed,
    hasUserLocation: !!userClubData,
  });

  return {
    players: result.players,
    isLoading: loadingUserClub || loadingPlayers,
    isError,
    userLocation: userClubData
      ? {
          lat: userClubData.lat!,
          lng: userClubData.lng!,
          country: userClubData.country || '',
          clubName: userClubData.clubName || '',
        }
      : null,
    fallbackMode: result.fallbackMode,
    radiusUsed: result.radiusUsed,
  };
}
