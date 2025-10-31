import React, { useEffect, useRef, useState, useId } from 'react';
import { useLiveClubhouseProfiles } from '@/hooks/useLiveClubhouseProfiles';
import { useNearbyGolfers } from '@/features/nearby/useNearbyGolfers';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { NearbyOverlay } from '@/features/nearby/NearbyOverlay';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import SquircleImage from '@/components/ui/SquircleImage';
import NearbyGolfersSquircle from '@/components/nearby/NearbyGolfersSquircle';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useSupabaseSession();
  const { currentLocation } = useLocationPermission();
  
  // Get viewer's profile for home_club_id
  const [viewerHomeClubId, setViewerHomeClubId] = useState<string | undefined>();
  
  useEffect(() => {
    if (!user?.id) return;
    
    supabase
      .from('user_profiles')
      .select('home_club_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.home_club_id) {
          setViewerHomeClubId(data.home_club_id);
        }
      });
  }, [user?.id]);
  
  // ✅ Realtime count + list (same SSOT as modal)
  const { data: golfers = [], isLoading: nearbyCountLoading } = useNearbyGolfers(
    currentLocation?.lat,
    currentLocation?.lng,
    user?.id,
    viewerHomeClubId
  );
  const nearbyCount = golfers.length;

  const rowRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [nearbyOverlayOpen, setNearbyOverlayOpen] = useState(false);
  
  // All golfers are now real (no mocks), so we can use the full list
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

  // Show skeleton while loading instead of null
  if (isLoading) {
    return (
      <div className="live-row">
        <div className="live-scroll" role="listbox" aria-label="Loading suggested creators">
          {/* Skeleton tiles */}
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="lc-tile" role="option">
              <div className="lc-avatar-btn">
                <div className="w-[84px] h-[84px] rounded-[20px] bg-muted animate-pulse" />
              </div>
              <div className="lc-label">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!creators.length) return null;

  return (
    <>
      <div className="live-row">
        <div 
          className="live-scroll" 
          ref={rowRef} 
          role="listbox" 
          aria-label="Suggested creators"
        >
          <NearbyTile 
            count={nearbyCount}
            isLoading={nearbyCountLoading}
            onOpen={() => setNearbyOverlayOpen(true)} 
          />
          {nearbyOnlineGolfers.map((golfer, idx) => (
            <LiveTile 
              key={golfer.id} 
              creator={{
                id: golfer.id,
                username: golfer.username || golfer.id,
                display_name: golfer.display_name,
                profile_photo_url: golfer.avatar_url || null,
                home_club: golfer.home_club || null,
                is_online: false,
                has_recent_post: false,
                isMock: false,
              }} 
              index={idx + 1} 
            />
          ))}
          {creators.map((c, idx) => (
            <LiveTile 
              key={c.id} 
              creator={c} 
              index={idx + nearbyOnlineGolfers.length + 1} 
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

function NearbyTile({ count, isLoading, onOpen }: { count: number; isLoading: boolean; onOpen: () => void }) {
  const handleClick = () => {
    analyticsEvents.lcStrip.nearbyOpen(count);
    onOpen();
  };

  let captionText = "...";
  if (!isLoading) {
    captionText = `${count ?? 0} nearby`;
  }

  return (
    <div 
      className="lc-tile lc-nearby" 
      role="option"
    >
      <div className="lc-avatar-btn">
        <NearbyGolfersSquircle 
          onClick={handleClick}
          ariaLabel={`Nearby golfers, ${count} ${count === 1 ? 'golfer' : 'golfers'} nearby`}
        />
      </div>

      <div className="lc-label">
        <div className="lc-name" title="Nearby Golfers">
          Nearby Golfers
        </div>
        <div className="lc-sub" style={count > 0 ? { color: 'rgba(74, 222, 128, 0.8)' } : undefined}>
          {captionText}
        </div>
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
          size={84}
          src={creator.profile_photo_url || '/placeholder.svg'}
          alt={creator.display_name}
          ringWidth={0}
        />
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
