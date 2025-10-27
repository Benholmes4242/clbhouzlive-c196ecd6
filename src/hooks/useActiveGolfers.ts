import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { getMockNearby } from '@/features/nearby/mockNearbyGolfers';
import { isMockLiveEnabled } from '@/mocks/mockSwitch';
import { channelManager } from '@/utils/supabaseChannelManager';

type ActiveGolfer = {
  id: string;
  display_name: string;
  username?: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  isMock: boolean;
  isOpenToPlay?: boolean;
  same_club?: boolean;
};

/**
 * Fetches and blends real + mock "active golfers" similar to LiveClubhouseProfiles
 * Phase 1: Shows online status honestly, no proximity/distance yet
 */
export function useActiveGolfers({ limit = 20, mockCount = 5 }: { limit?: number; mockCount?: number } = {}) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const forceMock = isMockLiveEnabled();

  // Fetch real user profiles (known + suggested mix)
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', 'realProfiles', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get known users (following + followers)
      const { data: knownUsers = [] } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, home_club, profile_photo_url')
        .or(`id.in.(select following_id from user_follows where follower_id eq ${user.id}),id.in.(select follower_id from user_follows where following_id eq ${user.id})`)
        .eq('is_public', true)
        .limit(Math.ceil(limit * 0.6));

      // Get suggested users (public profiles, excluding known)
      const knownIds = knownUsers.map(u => u.id);
      const { data: suggestedUsers = [] } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, home_club, profile_photo_url')
        .eq('is_public', true)
        .not('id', 'in', `(${[user.id, ...knownIds].join(',')})`)
        .limit(Math.ceil(limit * 0.4));

      // Combine and format
      const combined = [...knownUsers, ...suggestedUsers].map(u => ({
        id: u.id,
        display_name: u.display_name || u.username || 'Golfer',
        username: u.username,
        home_club: u.home_club || undefined,
        avatar_url: u.profile_photo_url || undefined,
        is_online: false, // Will be updated by presence
        isMock: false,
        isOpenToPlay: false,
        same_club: false,
      }));

      return combined.slice(0, limit);
    },
    staleTime: 30_000,
    enabled: !forceMock,
  });

  // Subscribe to presence for online status
  useEffect(() => {
    if (forceMock || realProfiles.length === 0) return;

    const channelName = 'presence:creators_online';
    const channel = channelManager.createChannel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              onlineIds.add(presence.user_id);
            }
          });
        });
        setOnlineUserIds(onlineIds);
      })
      .subscribe();

    return () => {
      channelManager.removeChannel(channelName);
    };
  }, [forceMock, realProfiles.length]);

  // Blend real + mock data
  const golfers = useMemo<ActiveGolfer[]>(() => {
    if (forceMock) {
      // Force 100% mock for dev testing
      return getMockNearby(mockCount).map(m => ({
        id: m.id,
        display_name: m.display_name,
        home_club: m.home_club,
        avatar_url: m.avatar_url,
        is_online: false, // Never show mock as online
        isMock: true,
        isOpenToPlay: false,
        same_club: false,
      }));
    }

    // Update real profiles with online status
    const realWithStatus = realProfiles.map(p => ({
      ...p,
      is_online: onlineUserIds.has(p.id),
    }));

    // Get mock profiles (never online)
    const mockProfiles = getMockNearby(mockCount).map(m => ({
      id: m.id,
      display_name: m.display_name,
      home_club: m.home_club,
      avatar_url: m.avatar_url,
      is_online: false, // Never show mock as online
      isMock: true,
      isOpenToPlay: false,
      same_club: false,
    }));

    // Interleave real and mock
    const blended: ActiveGolfer[] = [];
    const maxLength = Math.max(realWithStatus.length, mockProfiles.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < realWithStatus.length) blended.push(realWithStatus[i]);
      if (i < mockProfiles.length) blended.push(mockProfiles[i]);
    }

    return blended;
  }, [realProfiles, mockCount, onlineUserIds, forceMock]);

  // Calculate real online count (for display)
  const realOnlineCount = useMemo(() => {
    return golfers.filter(g => !g.isMock && g.is_online).length;
  }, [golfers]);

  return {
    golfers,
    realOnlineCount,
    isLoading,
  };
}
