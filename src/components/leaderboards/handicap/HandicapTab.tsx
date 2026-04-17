import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import { useUserHandicapStatus } from '@/hooks/leaderboards';

export type PeerGroup = 'club' | 'friends' | 'similar' | 'top100';

const STORAGE_KEY_PEER_GROUP = 'handicap-leaderboard-peer-group';

function loadSavedPeerGroup(): PeerGroup | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_PEER_GROUP);
    if (saved === 'club' || saved === 'friends' || saved === 'similar' || saved === 'top100') {
      return saved;
    }
  } catch {}
  return null;
}

interface ResolveArgs {
  homeClubId: string | null;
  homeClubMemberCount: number | null;
  friendsCount: number;
  userHandicap: number | null;
  savedPeerGroup: PeerGroup | null;
}

function resolveDefaultPeerGroup(args: ResolveArgs): PeerGroup {
  // 1. Respect saved choice if still available
  if (args.savedPeerGroup) {
    if (args.savedPeerGroup === 'club' && (!args.homeClubId || (args.homeClubMemberCount ?? 0) < 5)) {
      // saved choice is no longer available, fall through
    } else if (args.savedPeerGroup === 'similar' && args.userHandicap === null) {
      // fall through
    } else {
      return args.savedPeerGroup;
    }
  }

  // 2. My Club — only if club exists and >= 5 members with handicaps
  if (args.homeClubId && (args.homeClubMemberCount ?? 0) >= 5) {
    return 'club';
  }

  // 3. Friends — only if user has >= 5 friends with handicaps
  if (args.friendsCount >= 5) {
    return 'friends';
  }

  // 4. Similar (±3) — universal fallback when handicap exists
  if (args.userHandicap !== null) {
    return 'similar';
  }

  // 5. Top 100 — for users without a handicap
  return 'top100';
}

export function HandicapTab() {
  const { user } = useSupabaseSession();
  const savedPeerGroup = useRef<PeerGroup | null>(loadSavedPeerGroup()).current;

  const [peerGroup, setPeerGroupState] = useState<PeerGroup | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);

  // Fetch user's home club
  useEffect(() => {
    let cancelled = false;
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, golf_clubs!user_profiles_primary_club_id_fkey(name)')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName((data.golf_clubs as any)?.name ?? null);
      }
    }
    fetchUserProfile();
    return () => { cancelled = true; };
  }, [user?.id]);

  // User handicap status drives box score + similar window
  const { data: userStatus } = useUserHandicapStatus({ userId: user?.id, enabled: !!user?.id });
  const userHandicap = userStatus?.current_handicap ?? null;

  // Club member count — gates "My Club" default
  const { data: homeClubMeta } = useQuery({
    queryKey: ['handicap-home-club-meta', userHomeClubId],
    enabled: !!userHomeClubId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!userHomeClubId) return { memberCount: 0 };
      const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('primary_club_id', userHomeClubId)
        .eq('is_public', true)
        .eq('show_handicap', true)
        .eq('show_in_handicap_leaderboards', true)
        .not('eg_handicap_index', 'is', null);
      return { memberCount: count ?? 0 };
    },
  });

  // Friends count with handicaps
  const { data: friendsMeta } = useQuery({
    queryKey: ['handicap-friends-count', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!user?.id) return { friendsCount: 0 };
      // Get accepted friend ids in either direction
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      const friendIds = (friendships ?? [])
        .map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))
        .filter(Boolean);

      if (friendIds.length === 0) return { friendsCount: 0 };

      const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', friendIds)
        .eq('is_public', true)
        .eq('show_handicap', true)
        .eq('show_in_handicap_leaderboards', true)
        .not('eg_handicap_index', 'is', null);

      return { friendsCount: count ?? 0 };
    },
  });

  // Resolve default peer group once we have enough signals
  useEffect(() => {
    if (peerGroup !== null) return;
    // wait until we know about club + friends to avoid flash
    if (user?.id && (homeClubMeta === undefined || friendsMeta === undefined)) return;

    const resolved = resolveDefaultPeerGroup({
      homeClubId: userHomeClubId,
      homeClubMemberCount: homeClubMeta?.memberCount ?? null,
      friendsCount: friendsMeta?.friendsCount ?? 0,
      userHandicap,
      savedPeerGroup,
    });
    setPeerGroupState(resolved);
  }, [peerGroup, user?.id, userHomeClubId, homeClubMeta, friendsMeta, userHandicap, savedPeerGroup]);

  // Persist peer group changes
  const setPeerGroup = (next: PeerGroup) => {
    setPeerGroupState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY_PEER_GROUP, next);
    } catch {}
  };

  return (
    <div>
      <LowestHandicapLeaderboard
        peerGroup={peerGroup ?? 'top100'}
        onPeerGroupChange={setPeerGroup}
        userHomeClubId={userHomeClubId}
        userHomeClubName={userHomeClubName}
        clubMemberCount={homeClubMeta?.memberCount ?? null}
        friendsCount={friendsMeta?.friendsCount ?? 0}
      />
    </div>
  );
}
