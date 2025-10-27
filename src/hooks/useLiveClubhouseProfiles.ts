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
  isMock: boolean; // Flag to indicate if this is mock data (for future tuning)
}

/**
 * Hook for fetching Live Clubhouse profiles with 50/50 mock + real blend
 * Real profiles: from user_profiles (following/followers + suggested, 60/40 mix)
 * Mock profiles: from MOCK_CREATORS array
 * Online status: driven by Supabase Realtime presence (real users only)
 */
export function useLiveClubhouseProfiles() {
  const forceMock = isMockLiveEnabled(); // Dev override only
  const { user } = useSupabaseSession();
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

  // === REAL DATA PATH ===
  
  // Fetch base creator list with 60/40 mix (always runs unless forceMock override)
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

      // Target 50% of final list = 12 real profiles (out of 24 total)
      const targetRealProfiles = 12;
      const targetKnown = Math.ceil(targetRealProfiles * 0.6); // ~7 known
      const targetSuggested = Math.ceil(targetRealProfiles * 0.4); // ~5 suggested
      
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

      while (interleaved.length < targetRealProfiles && (k.length || s.length)) {
        if (k.length) interleaved.push(k.shift()!);
        if (s.length && interleaved.length < targetRealProfiles) interleaved.push(s.shift()!);
      }

      return interleaved.filter(profile => !NotInterested.isHidden(profile.id));
    },
    staleTime: 60_000,
    enabled: !!user && !forceMock,
  });

  // Batch fetch previews for real profiles
  const [previews, setPreviews] = useState<Record<string, { posterUrl?: string; mp4Url?: string }>>({});
  
  useEffect(() => {
    if (!baseCreators.length || forceMock) return;
    
    (async () => {
      const previewData = await getLatestShortPreviewForCreators(baseCreators.map(c => c.id));
      setPreviews(previewData);
    })();
  }, [baseCreators, forceMock]);

  // Presence tracking (online status) - real users only
  useEffect(() => {
    if (forceMock) return;
    
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
  }, [user?.id, forceMock]);

  // === BLEND LOGIC: 50% real + 50% mock ===
  const creators = useMemo(() => {
    if (forceMock) {
      // Dev override: 100% mock
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
          is_online: false, // Never show green dot for mock
          isMock: true,
        };
      });
    }

    const now = Date.now();
    
    // Real profiles (from DB)
    const realProfiles: LiveCreator[] = baseCreators.map((c: any) => {
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
        is_online: !!onlineMap[c.id], // Green dot only if in presence channel
        isMock: false,
      };
    });

    // Mock profiles (from static data)
    const mockProfiles: LiveCreator[] = MOCK_CREATORS.slice(0, 12).map(m => {
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
        is_online: false, // Never show green dot for mock profiles
        isMock: true,
      };
    });

    // Interleave: real, mock, real, mock, ...
    const blended: LiveCreator[] = [];
    const maxLength = Math.max(realProfiles.length, mockProfiles.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < realProfiles.length) blended.push(realProfiles[i]);
      if (i < mockProfiles.length) blended.push(mockProfiles[i]);
    }

    return blended;
  }, [baseCreators, previews, onlineMap, forceMock]);

  return { creators, isLoading: forceMock ? false : isLoading };
}
