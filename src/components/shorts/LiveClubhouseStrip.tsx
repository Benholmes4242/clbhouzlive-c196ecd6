import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SuggestedGolferCard from '@/components/discover/SuggestedGolferCard';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';
const DISMISSED_KEY = 'dismissedSuggestedGolfers';

export function LiveClubhouseStrip() {
  const { creators, isLoading } = useLiveClubhouseProfiles();
  const { golfers } = useActiveGolfers();
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  });
  const navigate = useNavigate();
  
  const nearbyOnlineGolfers = golfers;

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

  // Combine and filter dismissed golfers
  const allGolfers = [
    ...nearbyOnlineGolfers.map(g => ({
      id: g.id,
      username: g.username || '',
      display_name: g.display_name,
      profile_photo_url: g.avatar_url || null,
      home_club: g.home_club || null,
      reason: 'plays_near' as const,
    })),
    ...creators.filter(c => !dismissedIds.has(c.id)).map(c => ({
      id: c.id,
      username: c.username || '',
      display_name: c.display_name,
      profile_photo_url: c.profile_photo_url || null,
      home_club: c.home_club || null,
      is_verified: false,
      has_top100: false,
      is_new: c.has_recent_post,
      reason: 'suggested' as const,
    })),
  ].filter(g => !dismissedIds.has(g.id));

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="suggested-golfers-row">
        <div className="suggested-golfers-header">
          <span className="suggested-golfers-title">Suggested golfers</span>
        </div>
        <div className="suggested-golfers-scroll" role="listbox" aria-label="Loading suggested creators">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="w-[140px] h-[180px] rounded-2xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (allGolfers.length === 0) return null;

  return (
    <div className="suggested-golfers-row">
      {/* Section header with "See all" link - matching left gutter */}
      <div className="suggested-golfers-header">
        <span className="suggested-golfers-title">Suggested golfers</span>
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
        aria-label="Suggested golfers"
      >
        {allGolfers.map((golfer) => (
          <SuggestedGolferCard
            key={golfer.id}
            golfer={golfer}
            onDismiss={handleDismiss}
            onFollow={handleFollow}
          />
        ))}
      </div>
    </div>
  );
}
