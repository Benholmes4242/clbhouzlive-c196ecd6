import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { getLatestShortPreviewForCreators } from '@/utils/shortsPreview';
import { NotInterested } from '@/stores/notInterested';
import { channelManager } from '@/utils/supabaseChannelManager';
import { isMockLiveEnabled } from '@/mocks/mockSwitch';
import { MOCK_CREATORS } from '@/mocks/live_clubhouse';
import { startMockPresence } from '@/mocks/mockPresenceTicker';

const RECENT_MS = 24 * 60 * 60 * 1000;

export interface LiveCreator {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club?: string | null;
  latest_post_at?: string | null;
  latest_short_preview?: { posterUrl?: string; mp4Url?: string } | null;
  has_recent_post: boolean;
  is_online: boolean;
}

/**
 * Hook for fetching Live Clubhouse profiles with realtime presence
 * Maintains 60/40 known/suggested mix, includes preview data and online status
 */
export function useLiveClubhouseProfiles() {
  const mock = isMockLiveEnabled();
  const { user } = useSupabaseSession();
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

  // MOCK PATH - Set up mock presence (only runs when mock is true)
  useEffect(() => {
    if (!mock) return;
    const stop = startMockPresence(setOnlineMap);
    return stop;
  }, [mock]);

  // MOCK PATH - Build mock creators (memoized)
  const mockCreators: LiveCreator[] = useMemo(() => {
    if (!mock) return [];
    const now = Date.now();
    return MOCK_CREATORS.map(m => {
      const msAgo = (m.minutesAgo ?? 999) * 60_000;
      const latest = new Date(now - msAgo).toISOString();
      return {
        id: m.id,
        username: m.username,
        display_name: m.display_name,
        profile_photo_url: m.profile_photo_url,
        home_club: m.home_club ?? null,
        latest_post_at: latest,
        latest_short_preview: { posterUrl: m.previewPoster, mp4Url: m.previewMp4 },
        has_recent_post: msAgo <= RECENT_MS,
        is_online: !!onlineMap[m.id],
      };
    });
  }, [mock, onlineMap]);

  // Early return for mock data
  if (mock) {
    return { creators: mockCreators, isLoading: false };
  }

  // === REAL PATH ===
  
  // Fetch base creator list with 60/40 mix
  const { data: baseCreators = [], isLoading } = useQuery({
    queryKey: ['liveClubhouseBase', user?.id],
    queryFn: async () => {
      NotInterested.clearExpired();
      const mutedIds = JSON.parse(localStorage.getItem('muted_creator_ids') || '[]');
      
      // Get known profiles (following + followers)
      let knownIds = new Set<string>();
      
      if (user) {
        const [following, followers] = await Promise.all([
          supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
          supabase.from('user_follows').select('follower_id').eq('following_id', user.id),
        ]);
        
        (following?.data ?? []).forEach(r => knownIds.add(r.following_id));
        (followers?.data ?? []).forEach(r => knownIds.add(r.follower_id));
      }

      const limit = 24;
      const targetKnown = Math.ceil(limit * 0.6);
      const targetSuggested = Math.ceil(limit * 0.4);
      
      let knownProfiles: any[] = [];
      
      // Fetch known profiles
      if (knownIds.size > 0 && targetKnown > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url, home_club')
          .in('id', [...knownIds])
          .eq('is_public', true)
          .not('profile_photo_url', 'is', null)
          .not('display_name', 'is', null)
          .limit(targetKnown);

        if (profiles) {
          knownProfiles = await Promise.all(
            profiles.map(async (profile) => {
              const { data: posts } = await supabase
                .from('posts')
                .select('created_at')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(1);

              return {
                ...profile,
                latest_post_at: posts?.[0]?.created_at || null,
              };
            })
          );
        }
      }

      // Fetch suggested profiles
      const excludeIds = [...knownIds, ...(user ? [user.id] : []), ...mutedIds];
      
      let suggestedQuery = supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club')
        .eq('is_public', true)
        .not('profile_photo_url', 'is', null)
        .not('display_name', 'is', null);

      if (excludeIds.length > 0) {
        suggestedQuery = suggestedQuery.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: suggestedRaw } = await suggestedQuery
        .order('created_at', { ascending: false })
        .limit(targetSuggested);

      let suggestedProfiles: any[] = [];
      
      if (suggestedRaw) {
        suggestedProfiles = await Promise.all(
          suggestedRaw.map(async (profile) => {
            const { data: posts } = await supabase
              .from('posts')
              .select('created_at')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              ...profile,
              latest_post_at: posts?.[0]?.created_at || null,
            };
          })
        );
      }

      // Interleave known and suggested
      const interleaved: any[] = [];
      const k = [...knownProfiles];
      const s = [...suggestedProfiles];

      while (interleaved.length < limit && (k.length || s.length)) {
        if (k.length) interleaved.push(k.shift()!);
        if (s.length && interleaved.length < limit) interleaved.push(s.shift()!);
      }

      return interleaved.filter(profile => !NotInterested.isHidden(profile.id));
    },
    staleTime: 60_000,
    enabled: !!user,
  });

  // Batch fetch previews
  const [previews, setPreviews] = useState<Record<string, { posterUrl?: string; mp4Url?: string }>>({});
  
  useEffect(() => {
    if (!baseCreators.length) return;
    
    (async () => {
      const previewData = await getLatestShortPreviewForCreators(baseCreators.map(c => c.id));
      setPreviews(previewData);
    })();
  }, [baseCreators]);

  // Presence tracking (online status)
  
  useEffect(() => {
    const channelName = 'presence:creators_online';
    const channel = channelManager.createChannel(channelName);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>;
      const map: Record<string, boolean> = {};
      Object.keys(state).forEach((uid) => {
        map[uid] = (state[uid]?.length ?? 0) > 0;
      });
      setOnlineMap(map);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && user) {
        // Track current user's presence
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      channelManager.removeChannel(channelName);
    };
  }, [user?.id]);

  // Combine all data
  const creators = useMemo(() => {
    const now = Date.now();
    return baseCreators.map((c: any): LiveCreator => {
      const latest = c.latest_post_at ? new Date(c.latest_post_at).getTime() : 0;
      return {
        id: c.id,
        username: c.username ?? '',
        display_name: c.display_name ?? c.username ?? 'Unknown',
        profile_photo_url: c.profile_photo_url ?? null,
        home_club: c.home_club ?? null,
        latest_post_at: c.latest_post_at ?? null,
        latest_short_preview: previews[c.id] ?? null,
        has_recent_post: !!latest && (now - latest) < RECENT_MS,
        is_online: !!onlineMap[c.id],
      };
    });
  }, [baseCreators, previews, onlineMap]);

  return { creators, isLoading };
}
