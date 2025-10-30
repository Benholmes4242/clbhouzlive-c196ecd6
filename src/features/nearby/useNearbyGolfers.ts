import { useEffect, useMemo, useState } from 'react';
import { createNearbyPresenceChannel, PresencePayload } from '@/lib/presence/nearbyPresence';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from './distance';
import type { NearbyGolfer } from './types';

const NEARBY_RADIUS_METERS = 50_000; // 50km

export function useNearbyGolfers(userLat?: number, userLng?: number, viewerId?: string) {
  const [presence, setPresence] = useState<Record<string, PresencePayload[]>>({}); // presenceState map
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map()); // user_id -> profile

  // 1) Subscribe to presence
  useEffect(() => {
    if (!viewerId) return;

    const ch = createNearbyPresenceChannel()
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState() as Record<string, PresencePayload[]>;
        setPresence(state);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [viewerId]);

  // 2) Fetch profiles for newly seen user_ids
  useEffect(() => {
    const ids = Object.keys(presence); // keys are presence keys (user_id)
    const missing = ids.filter((id) => !profiles.has(id));
    if (missing.length === 0) return;

    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, eg_handicap_index, show_handicap, home_club')
        .in('id', missing);

      const next = new Map(profiles);
      (data || []).forEach((p) => next.set(p.id, p));
      setProfiles(next);
    })();
  }, [presence, profiles]);

  // 3) Fetch friend relationships for newly seen user_ids
  useEffect(() => {
    if (!viewerId || profiles.size === 0) return;
    
    const ids = Array.from(profiles.keys());
    const needsFriendCheck = ids.filter((id) => {
      const prof = profiles.get(id);
      return prof && prof._isFriend === undefined;
    });

    if (needsFriendCheck.length === 0) return;

    (async () => {
      // fetch mutuals where viewerId and profile.id follow each other
      const { data: a } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .in('following_id', needsFriendCheck);

      const { data: b } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', viewerId)
        .in('follower_id', needsFriendCheck);

      const aSet = new Set((a || []).map((r) => r.following_id));
      const mutual = new Set((b || []).filter((r) => aSet.has(r.follower_id)).map((r) => r.follower_id));

      // annotate profiles map
      const next = new Map(profiles);
      needsFriendCheck.forEach((id) => {
        const prof = next.get(id);
        if (!prof) return;
        prof._isFriend = mutual.has(id);
        next.set(id, prof);
      });
      setProfiles(next);
    })();
  }, [viewerId, profiles]);

  // 4) Build the Nearby list from presence + profiles + visibility filtering
  const nearby = useMemo<NearbyGolfer[]>(() => {
    if (!viewerId || !userLat || !userLng) return [];

    // flatten presence (payload arrays per user_id)
    const payloads: PresencePayload[] = Object.values(presence)
      .flat()
      // hide self
      .filter((p) => p.user_id && p.user_id !== viewerId)
      // hide users who set hidden
      .filter((p) => p.visibility_mode === 'friends' || p.visibility_mode === 'all');

    // unique by user_id (last wins)
    const latestByUser = new Map<string, PresencePayload>();
    payloads.forEach((p) => latestByUser.set(p.user_id, p));

    const items: NearbyGolfer[] = [];
    latestByUser.forEach((p) => {
      const prof = profiles.get(p.user_id);
      if (!prof) return;

      // viewer's relationship: if p.visibility_mode === 'friends', require mutual follow
      if (p.visibility_mode === 'friends' && !prof._isFriend) {
        return;
      }

      const lat = p.lat ?? null;
      const lng = p.lng ?? null;

      // Distance filter: if no coords in payload, skip distance
      let distance_km: number | undefined = undefined;
      if (lat != null && lng != null && userLat != null && userLng != null) {
        const meters = calculateDistance(userLat, userLng, lat, lng);
        if (meters > NEARBY_RADIUS_METERS) return;
        distance_km = meters / 1000;
      }

      items.push({
        id: prof.id,
        display_name: prof.display_name || prof.username || 'Unknown',
        username: prof.username,
        home_club: prof.home_club || undefined,
        avatar_url: prof.profile_photo_url || undefined,
        is_online: true,
        distance_km,
        handicap: prof.show_handicap ? prof.eg_handicap_index : undefined,
        isOpenToPlay: true,
        isMock: false,
        distanceText: distance_km ? (distance_km < 1.6 ? `${(distance_km * 0.621371).toFixed(1)} mi` : `${distance_km.toFixed(1)} km`) : undefined,
        sameHomeClub: false, // Can be enhanced later with home club matching
      });
    });

    // sort by distance when available
    items.sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    return items;
  }, [viewerId, userLat, userLng, presence, profiles]);

  return { data: nearby, isLoading: false };
}

/**
 * Lightweight hook that returns ONLY the count of nearby golfers
 * Uses the exact same presence pipeline as useNearbyGolfers to guarantee
 * the count matches the list (single source of truth)
 */
export function useNearbyCount(userLat?: number, userLng?: number, viewerId?: string) {
  const { data } = useNearbyGolfers(userLat, userLng, viewerId);
  return { count: data.length, isLoading: false };
}
