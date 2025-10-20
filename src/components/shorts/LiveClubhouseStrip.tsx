import React, { useEffect, useRef, useState } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useNearbyShorts } from '@/utils/nearbyShorts';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';

export function LiveClubhouseStrip() {
  const { creators, isLoading } = useLiveClubhouseProfiles();
  const nearby = useNearbyShorts();
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);

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

  if (isLoading) return null;
  if (!creators.length) return null;

  const showNearby = nearby.hasNearby;
  
  return (
    <div className="live-row">
      <div 
        className="live-scroll" 
        ref={rowRef} 
        role="listbox" 
        aria-label="Suggested creators"
      >
        {showNearby && <NearbyTile count={nearby.count} />}
        {creators.map((c, idx) => (
          <LiveTile 
            key={c.id} 
            creator={c} 
            index={showNearby ? idx + 1 : idx} 
          />
        ))}
      </div>
    </div>
  );
}

function NearbyTile({ count }: { count: number }) {
  const handleClick = () => {
    analyticsEvents.lcStrip.nearbyOpen(count);
    // Apply nearby filter to URL
    const url = new URL(window.location.href);
    url.searchParams.set('nearby', 'true');
    window.history.replaceState({}, '', url.toString());
  };

  const nearText = `${count} ${count === 1 ? 'player' : 'players'} near you`;

  return (
    <button 
      className="lc-tile lc-nearby" 
      role="option" 
      aria-label="Nearby golfers"
      onClick={handleClick}
    >
      <div className="lc-avatar-btn">
        <div className="lc-nearby-avatar" aria-label="Nearby golfers">
          <svg className="lc-pin-svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EB4D4D" />
                <stop offset="100%" stopColor="#FF6C6C" />
              </linearGradient>
            </defs>
            <path d="M12 2a7 7 0 0 0-7 7c0 5.05 7 13 7 13s7-7.95 7-13a7 7 0 0 0-7-7zm0 10.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
          </svg>
        </div>
      </div>
      <div className="lc-name" title="Nearby golfers">
        Nearby golfers
      </div>
      <div className="lc-sub">{nearText}</div>
    </button>
  );
}

function LiveTile({ creator, index }: { creator: any; index: number }) {
  const navigate = useNavigate();

  const seenIds = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as string[];
  const hasSeen = seenIds.includes(creator.id);
  const recentPulse = creator.has_recent_post && !hasSeen;

  const onAvatarClick = () => {
    // Mark as seen
    const newSeen = [...new Set([...seenIds, creator.id])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(newSeen));
    
    analyticsEvents.lcStrip.avatarClick(creator.id, index);
    
    // Navigate to immersive profile
    navigate(`/user/${creator.username}`);
  };

  return (
    <div
      className={`lc-tile ${recentPulse ? 'lc-recent' : ''}`}
      role="option"
    >
      <button 
        className="lc-avatar-btn" 
        onClick={onAvatarClick} 
        aria-label={creator.display_name}
      >
        <img
          className="lc-avatar"
          src={creator.profile_photo_url || '/placeholder.svg'}
          alt={creator.display_name}
          loading="lazy"
          draggable={false}
        />
        {creator.is_online && (
          <span className="lc-dot" aria-hidden="true" />
        )}
      </button>

      <div className="lc-name" title={creator.display_name}>
        {creator.display_name}
      </div>
      {creator.home_club && (
        <div className="lc-sub" title={creator.home_club}>
          {creator.home_club}
        </div>
      )}
    </div>
  );
}
