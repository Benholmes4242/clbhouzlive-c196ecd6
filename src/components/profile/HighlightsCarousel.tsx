/**
 * HighlightsCarousel - Top 100 highlights carousel
 * 
 * Uses UnifiedVideoPlayer with MediaRuntime for playback control.
 * Mount gating: only active + adjacent slides mount players.
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useTop100Highlights } from '@/hooks/useTop100Highlights';
import { warmHls, getHlsUrl } from '@/utils/videoPreload';
import HighlightVideo from './HighlightVideo';
import HighlightOverlays from './HighlightOverlays';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useMediaViewer } from '@/hooks/useMediaViewer';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const MOBILE_QUERY = '(pointer: coarse), (hover: none)';

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const railRef = useRef<HTMLDivElement>(null);
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore(s => s.markUserGestureUnmute);
  const [activeIndex, setActiveIndex] = useState(0);
  const { openViewer } = useMediaViewer();

  // Track active index via scroll position
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !highlights?.length) return;

    const handleScroll = () => {
      const scrollLeft = rail.scrollLeft;
      const cardWidth = rail.children[0]?.clientWidth || window.innerWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.max(0, Math.min(newIndex, highlights.length - 1)));
    };

    rail.addEventListener('scroll', handleScroll, { passive: true });
    return () => rail.removeEventListener('scroll', handleScroll);
  }, [highlights?.length]);

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
    if (!isMobile) return;
    const next = index + 1;
    if (next >= highlights.length) return;
    scrollToIndex(next);
  }, [isMobile, highlights?.length, scrollToIndex]);

  const extractVideoUid = (mediaUrl: string): string | null => {
    const patterns = [
      /\/([a-f0-9-]{36})\//,
      /\/([a-z0-9-]{16,})\//,
      /stream\/([^\/]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = mediaUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Open fullscreen viewer with highlights as playlist
  const handleHighlightTap = useCallback((index: number) => {
    if (!highlights) return;
    // Convert highlights to ExploreContentItem-compatible format for fullscreen
    const items = highlights.map(h => ({
      id: h.id,
      src: h.post_media[0]?.media_url || '',
      type: h.post_media[0]?.media_type === 'video' ? 'video' as const : 'image' as const,
      thumbnailSrc: h.post_media[0]?.media_url || '',
      title: h.content || '',
      user: {
        id: userId,
        name: 'Golfer',
        avatar: '',
      },
      golfCourse: h.golf_course ? {
        id: h.golf_course.id,
        name: h.golf_course.name,
        country: h.golf_course.country,
      } : undefined,
    }));
    openViewer(items, index);
  }, [highlights, userId, openViewer]);

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
          const videoUid = highlight.post_media[0]?.media_type === 'video' ? extractVideoUid(highlight.post_media[0].media_url) : null;
          // Mount gating: only active + adjacent slides get players
          const isActive = Math.abs(index - activeIndex) <= 1;
          
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
              <div className="highlights__card">
                <HighlightVideo
                  highlight={highlight}
                  index={index}
                  onEnded={() => tryAutoAdvance(index)}
                  isActive={isActive}
                  muted={isGloballyMuted}
                  onTap={() => handleHighlightTap(index)}
                />
                <button
                  className="unmute-btn"
                  aria-label={isGloballyMuted ? 'Unmute' : 'Mute'}
                  onClick={(e) => { e.stopPropagation(); if (isGloballyMuted) markUserGestureUnmute(); toggleGlobalMute(); }}
                  title={isGloballyMuted ? 'Unmute' : 'Mute'}
                >
                  {isGloballyMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
