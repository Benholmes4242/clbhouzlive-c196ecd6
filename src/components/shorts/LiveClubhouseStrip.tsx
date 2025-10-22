import React, { useEffect, useRef, useState, useId } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useNearbyShorts } from '@/utils/nearbyShorts';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { NearbyOverlay } from '@/features/nearby/NearbyOverlay';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import SquircleImage from '@/components/ui/SquircleImage';
import NearbyGolfersSquircle from '@/components/nearby/NearbyGolfersSquircle';
import '@/styles/shorts_live_clubhouse.css';

const SEEN_KEY = 'seenCreatorImmersiveIds';

function superellipsePath(w: number, h: number, n = 4.2, steps = 240) {
  const a = w / 2, b = h / 2, m = 2 / n;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m) + a;
    const y = Math.sign(st) * b * Math.pow(Math.abs(st), m) + b;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

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
    ? (count > 9 ? '9+ golfers near you' : `${count} ${count === 1 ? 'golfer' : 'golfers'} near you`)
    : "Check who's close";

  return (
    <div 
      className="lc-tile lc-nearby" 
      role="option"
    >
      <div className="lc-avatar-btn">
        <NearbyGolfersSquircle 
          onClick={handleClick}
          ariaLabel={`Nearby golfers, ${count} ${count === 1 ? 'golfer' : 'golfers'} near you`}
        />
      </div>

      <div className="lc-label">
        <div className="lc-name" title="Nearby Golfers">
          Nearby Golfers
        </div>
        <div className="lc-sub">{nearText}</div>
      </div>
    </div>
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
        <SquircleImage
          size={72}
          src={creator.profile_photo_url || '/placeholder.svg'}
          alt={creator.display_name}
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
