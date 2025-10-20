import React, { useEffect, useRef, useState } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useNearbyShorts } from '@/utils/nearbyShorts';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { NearbyOverlay } from '@/features/nearby/NearbyOverlay';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';

export function LiveClubhouseStrip() {
  const { creators, isLoading } = useLiveClubhouseProfiles();
  const nearby = useNearbyShorts();
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [nearbyOverlayOpen, setNearbyOverlayOpen] = useState(false);

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
    <>
      <div className="live-row">
        <div 
          className="live-scroll" 
          ref={rowRef} 
          role="listbox" 
          aria-label="Suggested creators"
        >
          {showNearby && (
            <NearbyTile 
              count={nearby.count} 
              onOpen={() => setNearbyOverlayOpen(true)} 
            />
          )}
          {creators.map((c, idx) => (
            <LiveTile 
              key={c.id} 
              creator={c} 
              index={showNearby ? idx + 1 : idx} 
            />
          ))}
        </div>
      </div>

      <NearbyOverlay 
        isOpen={nearbyOverlayOpen} 
        onClose={() => setNearbyOverlayOpen(false)} 
      />
    </>
  );
}

function NearbyTile({ count, onOpen }: { count: number; onOpen: () => void }) {
  const handleClick = () => {
    analyticsEvents.lcStrip.nearbyOpen(count);
    onOpen();
  };

  const nearText = count > 0 
    ? (count > 9 ? '9+ players near you' : `${count} ${count === 1 ? 'player' : 'players'} near you`)
    : 'Check who\'s close';

  return (
    <button 
      type="button"
      className="lc-tile lc-nearby" 
      role="option" 
      aria-label={`Nearby golfers, ${count} ${count === 1 ? 'player' : 'players'} near you`}
      onClick={handleClick}
    >
      <div className="lc-avatar-btn">
        <div className="lc-nearby-avatar">
          {/* faint checker pattern */}
          <svg aria-hidden="true" className="lc-checker" viewBox="0 0 12 12" preserveAspectRatio="none">
            <defs>
              <pattern id="lcCheck" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="rgba(110,146,119,.05)"/>
                <rect width="3" height="3" fill="rgba(110,146,119,.08)"/>
                <rect x="3" y="3" width="3" height="3" fill="rgba(110,146,119,.08)"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lcCheck)" />
          </svg>

          {/* leaf pin */}
          <svg aria-hidden="true" className="lc-leaf-pin" viewBox="0 0 64 64">
            <defs>
              <radialGradient id="leafGlow" cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="rgba(110,146,119,.28)"/>
                <stop offset="100%" stopColor="rgba(110,146,119,0)"/>
              </radialGradient>
              <linearGradient id="leafBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7CAD89"/>
                <stop offset="100%" stopColor="#557A61"/>
              </linearGradient>
            </defs>

            {/* glow behind pin (stays inside mask) */}
            <circle cx="32" cy="35" r="22" fill="url(#leafGlow)" />

            {/* pin (leaf marker) */}
            <path
              d="M32 14c-8.8 0-16 7.2-16 16 0 11.4 16 24 16 24s16-12.6 16-24c0-8.8-7.2-16-16-16z"
              fill="url(#leafBody)"
            />
            <circle cx="32" cy="30" r="6.5" fill="#fff" />
          </svg>

        </div>
      </div>

      <div className="lc-label">
        <div className="lc-name" title="Nearby Golfers">
          Nearby Golfers
        </div>
        <div className="lc-sub">{nearText}</div>
      </div>
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
