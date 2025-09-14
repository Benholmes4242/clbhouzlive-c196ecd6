import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useTop100Highlights } from '@/hooks/useTop100Highlights';
import { warmHls, getHlsUrl } from '@/utils/videoPreload';
import HighlightVideo from './HighlightVideo';
import HighlightOverlays from './HighlightOverlays';
import { isElementMostlyInView } from '@/utils/videoPreload';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const MOBILE_QUERY = '(pointer: coarse), (hover: none)';

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const railRef = useRef<HTMLDivElement>(null);
  
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

  // Intersection observer for autoplay/pause - NOT dependent on muted state
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !highlights) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        const itemEl = entry.target as HTMLElement;
        const video = itemEl.querySelector('video') as HTMLVideoElement | null;
        if (!video) return;

        const index = Number(itemEl.dataset.index ?? -1);
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
          // Get the current mute state directly from localStorage
          const currentMuted = JSON.parse(localStorage.getItem('journeyMuted') ?? 'true');
          
          // Set muted property directly on the element
          video.muted = currentMuted;
          video.playsInline = true;
          
          try {
            await video.play();
          } catch (e) {
            // Silently handle autoplay failures
          }
          
          // Prefetch neighboring videos
          prefetchAround(index);
        } else {
          // Pause when not in view
          video.pause();
        }
      });
    }, {
      threshold: [0, 0.5, 0.85],
      rootMargin: '0px'
    });

    // Observe all highlight items
    rail.querySelectorAll('.highlights__item').forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [highlights?.length, prefetchAround]); // Removed muted dependency

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
                />
                <button
                  className="unmute-btn"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    localStorage.setItem('journeyMuted', JSON.stringify(next));
                    // Immediately flip mute on the most visible video element
                    const visible = railRef.current?.querySelectorAll('video') ?? [];
                    visible.forEach(v => {
                      if (isElementMostlyInView(v)) (v as HTMLVideoElement).muted = next;
                    });
                  }}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
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