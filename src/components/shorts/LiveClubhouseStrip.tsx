import React, { useEffect, useRef, useState, useId } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useNearbyShorts } from '@/utils/nearbyShorts';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { NearbyOverlay } from '@/features/nearby/NearbyOverlay';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import SquircleImage from '@/components/ui/SquircleImage';
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

  const SIZE = 84;
  const idBase = useId();
  const clipId = `${idBase}-clip`;
  const checkId = `${idBase}-check`;
  const glowId = `${idBase}-glow`;
  const bodyId = `${idBase}-body`;
  const d = superellipsePath(SIZE, SIZE, 4.2, 240);

  return (
    <button 
      type="button"
      className="lc-tile lc-nearby" 
      role="option" 
      aria-label={`Nearby golfers, ${count} ${count === 1 ? 'golfer' : 'golfers'} near you`}
      onClick={handleClick}
    >
      <div className="lc-avatar-btn">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={d} />
            </clipPath>
            <pattern id={checkId} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="rgba(110,146,119,.05)"/>
              <rect width="3" height="3" fill="rgba(110,146,119,.08)"/>
              <rect x="3" y="3" width="3" height="3" fill="rgba(110,146,119,.08)"/>
            </pattern>
            <radialGradient id={glowId} cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="rgba(110,146,119,.28)"/>
              <stop offset="100%" stopColor="rgba(110,146,119,0)"/>
            </radialGradient>
            <linearGradient id={bodyId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7CAD89"/>
              <stop offset="100%" stopColor="#557A61"/>
            </linearGradient>
          </defs>

          {/* ring matching the squircle path */}
          <path d={d} fill="none" stroke="#6e9277" strokeWidth={2} />

          {/* Safari-safe clipped content */}
          <g clipPath={`url(#${clipId})`}>
            <rect width="100%" height="100%" fill="#f6faf7" />
            <rect width="100%" height="100%" fill={`url(#${checkId})`} />

            {/* Centered leaf pin */}
            <g transform={`translate(${(SIZE - 64) / 2} ${(SIZE - 64) / 2})`}>
              <circle cx="32" cy="35" r="22" fill={`url(#${glowId})`} />
              <path
                d="M32 14c-8.8 0-16 7.2-16 16 0 11.4 16 24 16 24s16-12.6 16-24c0-8.8-7.2-16-16-16z"
                fill={`url(#${bodyId})`}
              />
              <circle cx="32" cy="30" r="6.5" fill="#fff" />
            </g>
          </g>
        </svg>
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
        <SquircleImage
          size={84}
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
