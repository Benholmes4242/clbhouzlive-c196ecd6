import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { getLatestShortPreviewForCreators } from '@/utils/shortsPreview';
import { NotInterested } from '@/stores/notInterested';
import { channelManager } from '@/utils/supabaseChannelManager';

const RECENT_MS = 24 * 60 * 60 * 1000;
const LIVE_STRIP_SESSION_KEY = 'liveStripSession';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2h

// Session tracking utilities
function getExistingSession(): {
  id: string;
  startedAt: number;
  seenCreatorIds: string[];
} | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LIVE_STRIP_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.id || !parsed.startedAt) return null;

    // expire stale session
    if (Date.now() - parsed.startedAt > SESSION_TTL_MS) {
      return null;
    }

    return {
      id: parsed.id,
      startedAt: parsed.startedAt,
      seenCreatorIds: Array.isArray(parsed.seenCreatorIds)
        ? parsed.seenCreatorIds
        : [],
    };
  } catch {
    return null;
  }
}

function startNewSession(): {
  id: string;
  startedAt: number;
  seenCreatorIds: string[];
} {
  const fresh = {
    id: (crypto?.randomUUID?.() || `s_${Date.now()}`),
    startedAt: Date.now(),
    seenCreatorIds: [],
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIVE_STRIP_SESSION_KEY, JSON.stringify(fresh));
  }
  return fresh;
}

function saveSession(session: {
  id: string;
  startedAt: number;
  seenCreatorIds: string[];
}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LIVE_STRIP_SESSION_KEY, JSON.stringify(session));
}

function shuffleStableForSession<T>(arr: T[], seedString: string): T[] {
  // convert seed string → numeric seed
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed + seedString.charCodeAt(i) * (i + 1)) % 2147483647;
  }

  // Fisher-Yates with deterministic PRNG based on seed
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    // simple LCG-ish step
    seed = (seed * 48271) % 2147483647;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
  is_verified?: boolean;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
}

/**
 * Hook for fetching Live Clubhouse profiles - 100% real data
 * Real profiles: from user_profiles (following/followers + suggested, 60/40 mix)
 * Online status: driven by Supabase Realtime presence
 */
export function useLiveClubhouseProfiles() {
  const { user } = useSupabaseSession();
  
  // Session tracking for freshness
  const sessionRef = useRef<{
    id: string;
    startedAt: number;
    seenCreatorIds: string[];
  } | null>(null);

  if (!sessionRef.current) {
    const existing = getExistingSession();
    sessionRef.current = existing ?? startNewSession();
  }

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

      // Target 24 real profiles with improved mix:
      // 50% network, 20% active creators, 15% popular, 15% suggested
      const targetRealProfiles = 24;
      const targetKnown = Math.ceil(targetRealProfiles * 0.50); // ~12 known
      const targetActive = Math.ceil(targetRealProfiles * 0.20); // ~5 active
      const targetPopular = Math.ceil(targetRealProfiles * 0.15); // ~4 popular
      const targetSuggested = Math.ceil(targetRealProfiles * 0.15); // ~4 suggested
      
      // Calculate date for "active" check (posted in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Fetch all profile categories in parallel
      const [knownProfilesResult, activeCreatorsResult, popularCreatorsResult, suggestedProfilesResult] = await Promise.all([
        // 1. Fetch known profiles (following/followers)
        (async () => {
          if (knownIds.size === 0 || targetKnown === 0) return [];
          
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, home_club, is_verified_golfer, eg_handicap_index, show_handicap')
            .in('id', [...knownIds])
            .eq('is_public', true)
            .not('profile_photo_url', 'is', null)
            .not('display_name', 'is', null)
            .limit(targetKnown);

          return profiles || [];
        })(),
        
        // 2. Fetch active creators (posted in last 7 days)
        (async () => {
          const excludeIds = [...knownIds, ...(user ? [user.id] : []), ...mutedIds];
          
          // Get users who have posted recently
          const { data: recentPosters } = await supabase
            .from('posts')
            .select('user_id')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (!recentPosters || recentPosters.length === 0) return [];
          
          // Get unique poster IDs excluding known users
          const posterIds = [...new Set(recentPosters.map(p => p.user_id))]
            .filter(id => id && !excludeIds.includes(id))
            .slice(0, targetActive * 2); // Fetch extra to account for filtering
          
          if (posterIds.length === 0) return [];
          
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, home_club, is_verified_golfer, eg_handicap_index, show_handicap')
            .in('id', posterIds)
            .eq('is_public', true)
            .not('profile_photo_url', 'is', null)
            .not('display_name', 'is', null)
            .limit(targetActive);

          return profiles || [];
        })(),
        
        // 3. Fetch popular creators (most followers - using verified as proxy)
        (async () => {
          const excludeIds = [...knownIds, ...(user ? [user.id] : []), ...mutedIds];
          
          let query = supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, home_club, is_verified_golfer, eg_handicap_index, show_handicap')
            .eq('is_public', true)
            .eq('is_verified_golfer', true) // Verified users as proxy for "popular"
            .not('profile_photo_url', 'is', null)
            .not('display_name', 'is', null);

          if (excludeIds.length > 0) {
            query = query.not('id', 'in', `(${excludeIds.join(',')})`);
          }

          const { data: profiles } = await query.limit(targetPopular);
          return profiles || [];
        })(),
        
        // 4. Fetch suggested profiles (fallback - newest users)
        (async () => {
          const excludeIds = [...knownIds, ...(user ? [user.id] : []), ...mutedIds];
          
          let suggestedQuery = supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, home_club, is_verified_golfer, eg_handicap_index, show_handicap')
            .eq('is_public', true)
            .not('profile_photo_url', 'is', null)
            .not('display_name', 'is', null);

          if (excludeIds.length > 0) {
            suggestedQuery = suggestedQuery.not('id', 'in', `(${excludeIds.join(',')})`);
          }

          const { data: suggestedRaw } = await suggestedQuery
            .order('created_at', { ascending: false })
            .limit(targetSuggested);

          return suggestedRaw || [];
        })()
      ]);

      // Batch fetch latest posts for all profiles in ONE query
      const allProfileIds = [
        ...knownProfilesResult.map(p => p.id),
        ...activeCreatorsResult.map(p => p.id),
        ...popularCreatorsResult.map(p => p.id),
        ...suggestedProfilesResult.map(p => p.id)
      ];
      
      const latestPostsMap: Record<string, string> = {};
      if (allProfileIds.length > 0) {
        const { data: latestPosts } = await supabase
          .from('posts')
          .select('user_id, created_at')
          .in('user_id', allProfileIds)
          .order('created_at', { ascending: false });

        // Group by user_id and take the first (latest) post for each user
        if (latestPosts) {
          latestPosts.forEach(post => {
            if (!latestPostsMap[post.user_id]) {
              latestPostsMap[post.user_id] = post.created_at;
            }
          });
        }
      }

      // Enrich all profiles with latest_post_at
      const enrichProfile = (profile: any) => ({
        ...profile,
        latest_post_at: latestPostsMap[profile.id] || null,
      });

      const knownProfiles = knownProfilesResult.map(enrichProfile);
      const activeProfiles = activeCreatorsResult.map(enrichProfile);
      const popularProfiles = popularCreatorsResult.map(enrichProfile);
      const suggestedProfiles = suggestedProfilesResult.map(enrichProfile);

      // Combine all categories, removing duplicates
      const seenIds = new Set<string>();
      const interleaved: any[] = [];
      
      // Helper to add profiles avoiding duplicates
      const addProfiles = (profiles: any[], max: number) => {
        let added = 0;
        for (const profile of profiles) {
          if (added >= max) break;
          if (!seenIds.has(profile.id)) {
            seenIds.add(profile.id);
            interleaved.push(profile);
            added++;
          }
        }
      };

      // Add in priority order: network → active → popular → suggested
      addProfiles(knownProfiles, targetKnown);
      addProfiles(activeProfiles, targetActive);
      addProfiles(popularProfiles, targetPopular);
      addProfiles(suggestedProfiles, targetSuggested);

      if (import.meta.env.DEV) {
        console.log('[useLiveClubhouseProfiles] Enhanced mix:', {
          network: knownProfilesResult.length,
          active: activeCreatorsResult.length,
          popular: popularCreatorsResult.length,
          suggested: suggestedProfilesResult.length,
          total: interleaved.length
        });
      }

      return interleaved.filter(profile => !NotInterested.isHidden(profile.id));
    },
    staleTime: 60_000,
    enabled: !!user,
  });

  // Batch fetch previews and presence data
  const [enrichmentData, setEnrichmentData] = useState<{
    previews: Record<string, { posterUrl?: string; mp4Url?: string }>;
    onlineMap: Record<string, boolean>;
  }>({ previews: {}, onlineMap: {} });
  
  useEffect(() => {
    if (!baseCreators.length) return;
    
    // Fetch previews
    (async () => {
      const previewData = await getLatestShortPreviewForCreators(baseCreators.map(c => c.id));
      setEnrichmentData(prev => ({ ...prev, previews: previewData }));
    })();
  }, [baseCreators]);

  // Presence tracking (online status)
  // STABILITY FIX: Don't remove channel on unmount since usePresenceTracker shares it
  // Instead, just detach our sync listener
  useEffect(() => {
    if (!user?.id) return;
    
    const channelName = 'presence:creators_online';
    const channel = channelManager.createChannel(channelName);
    let isMounted = true;

    // Sync handler that respects mount state
    const handleSync = () => {
      if (!isMounted) return;
      
      const state = channel.presenceState() as Record<string, Array<any>>;
      const map: Record<string, boolean> = {};
      Object.keys(state).forEach((uid) => {
        map[uid] = (state[uid]?.length ?? 0) > 0;
      });
      setEnrichmentData(prev => ({ ...prev, onlineMap: map }));
    };

    channel.on('presence', { event: 'sync' }, handleSync);

    // Only subscribe if not already subscribed
    const currentState = (channel as any).state;
    if (currentState !== 'joined' && currentState !== 'joining') {
      channel.subscribe(async (status) => {
        if (!isMounted) return;
        
        if (status === 'SUBSCRIBED' && user) {
          // Track current user's presence
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });
    } else {
      // Already subscribed - just read current state
      handleSync();
    }

    return () => {
      isMounted = false;
      // Release our reference to the channel
      // The channelManager will only actually remove it when all refs are gone
      channelManager.removeChannel(channelName);
    };
  }, [user?.id]);

  // Build final creators list - 100% real data
  const creators = useMemo(() => {
    const { previews, onlineMap } = enrichmentData;
    const now = Date.now();
    
    // Real profiles (from DB)
    const allRealProfiles: LiveCreator[] = baseCreators.map((c: any) => {
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
        is_verified: c.is_verified_golfer ?? false,
        eg_handicap_index: c.eg_handicap_index ?? null,
        show_handicap: c.show_handicap ?? false,
      };
    });

    // Session freshness: prefer creators not yet seen this session
    const seenSet = new Set(sessionRef.current?.seenCreatorIds || []);
    const newProfiles = allRealProfiles.filter(p => !seenSet.has(p.id));
    const seenProfiles = allRealProfiles.filter(p => seenSet.has(p.id));

    // Combine: new faces first, then previously-seen
    const orderedProfiles = [...newProfiles, ...seenProfiles];

    // Update session with seen IDs
    const updatedSeen = Array.from(
      new Set([
        ...(sessionRef.current?.seenCreatorIds || []),
        ...orderedProfiles.map(p => p.id),
      ])
    );

    sessionRef.current = {
      ...sessionRef.current!,
      seenCreatorIds: updatedSeen,
    };

    saveSession(sessionRef.current);

    // Apply deterministic shuffle based on session ID
    const sessionId = sessionRef.current!.id;
    return shuffleStableForSession(orderedProfiles, sessionId);
  }, [baseCreators, enrichmentData]);

  return { creators, isLoading };
}
