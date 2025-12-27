import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useSuggestedBusinesses } from '@/hooks/useSuggestedBusinesses';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SuggestedProfileCard from '@/components/discover/SuggestedProfileCard';
import { SuggestedItem, SuggestedGolfer, SuggestedBusiness, buildBusinessLocationLabel } from '@/types/suggestedItem';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';
const DISMISSED_KEY = 'dismissedSuggestedItems';

export function LiveClubhouseStrip() {
  const { creators, isLoading } = useLiveClubhouseProfiles();
  const { businesses, isLoading: isLoadingBusinesses } = useSuggestedBusinesses();
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  });
  const navigate = useNavigate();

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

  // Build golfer items from creators only (already filtered by is_public in hook)
  // Note: nearbyOnlineGolfers uses mock data and doesn't have privacy fields, so we exclude them
  // until useActiveGolfers is updated to respect privacy
  const golferItems: SuggestedGolfer[] = creators
    .filter(c => !dismissedIds.has(c.id))
    .map(c => ({
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
      reason: 'suggested' as const,
    }));

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
        <div className="suggested-golfers-header">
          <span className="suggested-golfers-title">Suggested for you</span>
        </div>
        <div className="suggested-golfers-scroll" role="listbox" aria-label="Loading suggested profiles">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="w-[140px] h-[180px] rounded-2xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (mixedItems.length === 0) return null;

  return (
    <div className="suggested-golfers-row">
      {/* Section header with "See all" link - matching left gutter */}
      <div className="suggested-golfers-header">
        <span className="suggested-golfers-title">Suggested for you</span>
        <button 
          className="suggested-golfers-see-all"
          onClick={() => navigate('/golferstofollow')}
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Carousel with proper left gutter matching title */}
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
            onDismiss={handleDismiss}
            onFollow={handleFollow}
          />
        ))}
      </div>
    </div>
  );
}
