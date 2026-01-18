/**
 * HighlightsCarousel - Top 100 highlights carousel
 * 
 * Uses MediaRuntime for playback control.
 * Observer only reports visibility - does NOT call play/pause.
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useTop100Highlights } from '@/hooks/useTop100Highlights';
import { warmHls, getHlsUrl } from '@/utils/videoPreload';
import HighlightVideo from './HighlightVideo';
import HighlightOverlays from './HighlightOverlays';
import { isElementMostlyInView } from '@/utils/videoPreload';
import { MediaRuntime } from '@/media/runtime';
import { useMediaAutoplay } from '@/media/useMediaAutoplay';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const MOBILE_QUERY = '(pointer: coarse), (hover: none)';

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const railRef = useRef<HTMLDivElement>(null);
  const { registerMedia, playingIds } = useMediaAutoplay({ 
    mode: 'grid',
  startThreshold: 0.4,   // Play at 40% visible
  stopThreshold: 0.35,   // Pause at 35% visible (provides hysteresis)
  });
  
  // Session-wide mute persistence
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('journeyMuted') ?? 'true') as boolean;
    }
    return true;
  });

  // Persist mute state to localStorage
  useEffect(() => {
    localStorage.setItem('journeyMuted', JSON.stringify(muted));
  }, [muted]);

  // Warm HLS.js and preload initial URLs when component mounts
  useEffect(() => {
    warmHls();
    if (highlights && highlights.length > 0) {
      prefetchAround(0);
    }
  }, [highlights]);

  // Helper: prefetch current + neighbors
  const prefetchAround = useCallback((currentIndex: number) => {
    if (!highlights) return;
    
    [currentIndex - 1, currentIndex, currentIndex + 1].forEach(idx => {
      if (idx >= 0 && idx < highlights.length) {
        const media = highlights[idx]?.post_media[0];
        if (media?.media_type === 'video') {
          const uid = extractVideoUid(media.media_url);
          if (uid) getHlsUrl(uid);
        }
      }
    });
  }, [highlights]);

  // Helper: programmatic slide (mobile only)
  const isMobile = useMemo(() => window.matchMedia?.(MOBILE_QUERY).matches ?? false, []);
  const scrollToIndex = useCallback((nextIndex: number) => {
    const rail = railRef.current;
    if (!rail || !highlights) return;
    const x = Math.max(0, Math.min(nextIndex, highlights.length - 1)) * window.innerWidth;
    rail.scrollTo({ left: x, behavior: 'smooth' });
  }, [highlights]);

  // Mobile-only auto-advance
  const tryAutoAdvance = useCallback((index: number) => {
    if (!isMobile) return; // Desktop unchanged
    const next = index + 1;
    if (next >= highlights.length) return; // Last item: stop
    scrollToIndex(next);
  }, [isMobile, highlights?.length, scrollToIndex]);

  const extractVideoUid = (mediaUrl: string): string | null => {
    // Extract Cloudflare Stream ID from various URL formats
    const patterns = [
      /\/([a-f0-9-]{36})\//, // Standard UUID format
      /\/([a-z0-9-]{16,})\//, // Shorter ID format
      /stream\/([^\/]+)/, // Stream path format
    ];
    
    for (const pattern of patterns) {
      const match = mediaUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Toggle mute - apply to all visible videos
  const handleMuteToggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('journeyMuted', JSON.stringify(next));
    
    // Immediately flip mute on the most visible video element
    const visible = railRef.current?.querySelectorAll('video') ?? [];
    visible.forEach(v => {
      if (isElementMostlyInView(v)) (v as HTMLVideoElement).muted = next;
    });
  }, [muted]);

  if (isLoading) {
    return (
      <section className={`highlights ${className}`}>
        <div className="px-4 py-2">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
        </div>
        <div className="highlights__rail">
          {[1, 2, 3].map((i) => (
            <div key={i} className="highlights__item">
              <div className="highlights__card bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !highlights || highlights.length === 0) {
    return (
      <section className={`highlights ${className}`}>
        <div className="px-4 py-2">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
        </div>
        <div className="bg-card border border-border p-8 text-center mx-4">
          <div className="text-4xl mb-4">🏌️‍♂️</div>
          <h4 className="text-lg font-semibold mb-2">No Top-100 Highlights Yet</h4>
          <p className="text-muted-foreground">
            Share photos and videos from your rounds at Top-100 courses to see them featured here!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`highlights ${className}`}>
      <div className="px-4 py-2">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
      </div>
      
      <div 
        className="highlights__rail"
        ref={railRef}
      >
        {highlights.map((highlight, index) => {
          const primaryMedia = highlight.post_media[0];
          const videoUid = primaryMedia?.media_type === 'video' ? extractVideoUid(primaryMedia.media_url) : null;
          const mediaId = `highlight-${highlight.id}`;
          const isPlaying = playingIds.has(mediaId);
          
          return (
            <article 
              key={highlight.id} 
              className="highlights__item"
              data-index={index}
              onPointerDown={() => {
                if (videoUid) {
                  getHlsUrl(videoUid);
                  warmHls();
                }
              }}
            >
              {/* Video part is memoized and isolated from mute changes */}
              <div className="highlights__card">
                <HighlightVideo
                  highlight={highlight}
                  index={index}
                  onEnded={() => tryAutoAdvance(index)}
                  mediaId={mediaId}
                  isPlaying={isPlaying}
                  registerMedia={registerMedia}
                  muted={muted}
                />
                <button
                  className="unmute-btn"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  onClick={handleMuteToggle}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                {highlight.golf_course && (
                  <div className="club-badge">
                    {highlight.golf_course.name}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HighlightsCarousel;
