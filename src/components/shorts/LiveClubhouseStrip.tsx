import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useSuggestedBusinesses } from '@/hooks/useSuggestedBusinesses';
import { useDiscoveryExclusions } from '@/hooks/useDiscoveryExclusions';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import SuggestedProfileCard from '@/components/discover/SuggestedProfileCard';
import { SuggestedItem, SuggestedGolfer, SuggestedBusiness, buildBusinessLocationLabel } from '@/types/suggestedItem';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';
const DISMISSED_KEY = 'dismissedSuggestedItems';

export function LiveClubhouseStrip() {
  const { creators, isLoading } = useLiveClubhouseProfiles();
  const { businesses, isLoading: isLoadingBusinesses } = useSuggestedBusinesses();
  const { user } = useSupabaseSession();
  
  // Get exclusion IDs to filter out users the viewer already follows, is friends with, or has blocked
  const { data: exclusions } = useDiscoveryExclusions(user?.id);
  const excludedIds = exclusions?.excludedIds ?? new Set<string>();
  
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  });
  const navigate = useNavigate();

  // Fetch viewer's home club for "plays_near" matching
  const { data: viewerProfile } = useQuery({
    queryKey: ['viewerProfileForReasons', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('home_club')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch mutual counts AND mutual friend previews for all creator IDs
  const creatorIds = useMemo(() => creators.map(c => c.id), [creators]);
  
  const { data: mutualData = { counts: {}, friends: {} } } = useQuery({
    queryKey: ['mutualCountsAndFriends', user?.id, creatorIds],
    queryFn: async () => {
      if (!user?.id || creatorIds.length === 0) return { counts: {}, friends: {} };
      
      // Get all users that the viewer follows
      const { data: viewerFollowing } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (!viewerFollowing?.length) return { counts: {}, friends: {} };
      
      const viewerFollowingIds = new Set(viewerFollowing.map(f => f.following_id));
      
      // Get all users that each creator follows
      const { data: creatorsFollowing } = await supabase
        .from('user_follows')
        .select('follower_id, following_id')
        .in('follower_id', creatorIds);
      
      if (!creatorsFollowing?.length) return { counts: {}, friends: {} };
      
      // Build mutual data: count and list of mutual friend IDs per creator
      const counts: Record<string, number> = {};
      const mutualIdsByCreator: Record<string, string[]> = {};
      creatorIds.forEach(id => { 
        counts[id] = 0; 
        mutualIdsByCreator[id] = [];
      });
      
      creatorsFollowing.forEach(follow => {
        if (viewerFollowingIds.has(follow.following_id)) {
          counts[follow.follower_id] = (counts[follow.follower_id] || 0) + 1;
          if (!mutualIdsByCreator[follow.follower_id]) {
            mutualIdsByCreator[follow.follower_id] = [];
          }
          mutualIdsByCreator[follow.follower_id].push(follow.following_id);
        }
      });
      
      // Get profile data for mutual friends (up to 3 per creator)
      const allMutualIds = new Set<string>();
      Object.values(mutualIdsByCreator).forEach(ids => {
        ids.slice(0, 3).forEach(id => allMutualIds.add(id));
      });
      
      const friends: Record<string, Array<{ id: string; avatar_url: string | null; display_name: string }>> = {};
      
      if (allMutualIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, profile_photo_url, display_name, username')
          .in('id', Array.from(allMutualIds));
        
        const profileMap = new Map(
          (profiles || []).map(p => [p.id, { 
            id: p.id, 
            avatar_url: p.profile_photo_url, 
            display_name: p.display_name || p.username || 'User' 
          }])
        );
        
        creatorIds.forEach(creatorId => {
          friends[creatorId] = (mutualIdsByCreator[creatorId] || [])
            .slice(0, 3)
            .map(id => profileMap.get(id))
            .filter(Boolean) as Array<{ id: string; avatar_url: string | null; display_name: string }>;
        });
      }
      
      return { counts, friends };
    },
    enabled: !!user?.id && creatorIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
  
  const mutualCounts = mutualData.counts;
  const mutualFriends = mutualData.friends;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    
    let timeout: any;
    const onScroll = () => {
      setScrolling(true);
      document.documentElement.style.setProperty('--scrolling', '1');
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setScrolling(false);
        document.documentElement.style.setProperty('--scrolling', '0.25');
      }, 300);
    };
    
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && creators.length > 0) {
      analyticsEvents.lcStrip.impression(creators.length);
    }
  }, [isLoading, creators.length]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleFollow = useCallback((id: string) => {
    analyticsEvents.lcStrip.avatarClick(id, 0);
  }, []);

  // Compute reason for each golfer
  const computeReason = useCallback((creator: typeof creators[0]): { reason: SuggestedGolfer['reason']; mutual_count?: number } => {
    const mutualCount = mutualCounts[creator.id] || 0;
    
    // Priority 1: Mutuals
    if (mutualCount >= 1) {
      return { reason: 'mutuals', mutual_count: mutualCount };
    }
    
    // Priority 2: Plays near (same home club)
    if (viewerProfile?.home_club && creator.home_club) {
      const viewerClub = viewerProfile.home_club.toLowerCase().trim();
      const creatorClub = creator.home_club.toLowerCase().trim();
      if (viewerClub === creatorClub) {
        return { reason: 'plays_near' };
      }
    }
    
    // Priority 3: Default
    return { reason: 'suggested' };
  }, [mutualCounts, viewerProfile]);

  // Build golfer items from creators only (already filtered by is_public in hook)
  // Filter out dismissed and users with existing relationships (followed, friends, pending, blocked)
  const golferItems: SuggestedGolfer[] = creators
    .filter(c => !dismissedIds.has(c.id) && !excludedIds.has(c.id))
    .map(c => {
      const { reason, mutual_count } = computeReason(c);
      return {
        type: 'golfer' as const,
        id: c.id,
        username: c.username || '',
        display_name: c.display_name,
        profile_photo_url: c.profile_photo_url || null,
        home_club: c.home_club || null,
        is_verified: (c as any).is_verified ?? false,
        eg_handicap_index: (c as any).eg_handicap_index ?? null,
        show_handicap: (c as any).show_handicap ?? false,
        is_public: true, // Already filtered by is_public in hook
        reason,
        mutual_count,
        mutual_friends: mutualFriends[c.id] || [],
      };
    });

  // Build business items (always eligible - no privacy filter)
  const businessItems: SuggestedBusiness[] = businesses
    .filter(b => !dismissedIds.has(b.id))
    .map(b => ({
      type: 'business' as const,
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      category: b.category,
      location_label: buildBusinessLocationLabel(b),
      is_verified: b.is_verified,
      reason: 'Suggested for you',
    }));

  // Interleave: 2 golfers → 1 business pattern
  const mixedItems: SuggestedItem[] = [];
  let gIdx = 0;
  let bIdx = 0;
  
  while (gIdx < golferItems.length || bIdx < businessItems.length) {
    // Add 2 golfers
    if (gIdx < golferItems.length) {
      mixedItems.push(golferItems[gIdx++]);
    }
    if (gIdx < golferItems.length) {
      mixedItems.push(golferItems[gIdx++]);
    }
    // Add 1 business
    if (bIdx < businessItems.length) {
      mixedItems.push(businessItems[bIdx++]);
    }
  }

  // Show skeleton while loading
  if (isLoading || isLoadingBusinesses) {
    return (
      <div className="suggested-golfers-row">
        <div className="suggested-golfers-scroll" role="listbox" aria-label="Loading suggested profiles">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="w-[140px] h-[170px] rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (mixedItems.length === 0) return null;

  return (
    <div className="suggested-golfers-row">
      {/* Carousel - no header */}
      <div
        className="suggested-golfers-scroll" 
        ref={rowRef} 
        role="listbox" 
        aria-label="Suggested profiles"
      >
        {mixedItems.map((item) => (
          <SuggestedProfileCard
            key={item.id}
            item={item}
            onFollow={handleFollow}
          />
        ))}
      </div>
    </div>
  );
}
