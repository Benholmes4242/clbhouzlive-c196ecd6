import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTop100Highlights } from '@/hooks/useTop100Highlights';
import { useHlsUrlCache, warmHlsJs } from '@/hooks/useHlsUrlCache';
import HighlightCard from './HighlightCard';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const railRef = useRef<HTMLDivElement>(null);
  const { preloadHlsUrls } = useHlsUrlCache();
  
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
    warmHlsJs();
    if (highlights && highlights.length > 0) {
      prefetchAround(0);
    }
  }, [highlights]);

  const prefetchAround = useCallback((currentIndex: number) => {
    if (!highlights) return;
    
    const uidsToPreload = [];
    // Preload previous, current, and next
    for (let i = Math.max(0, currentIndex - 1); i <= Math.min(highlights.length - 1, currentIndex + 1); i++) {
      const media = highlights[i]?.post_media[0];
      if (media?.media_type === 'video') {
        // Extract uid from media_url for preloading
        const uid = extractVideoUid(media.media_url);
        if (uid) uidsToPreload.push(uid);
      }
    }
    
    if (uidsToPreload.length > 0) {
      preloadHlsUrls(uidsToPreload);
    }
  }, [highlights, preloadHlsUrls]);

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

  // Intersection observer for autoplay/pause
  useEffect(() => {
    if (!railRef.current || !highlights) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        const element = entry.target as HTMLElement;
        const video = element.querySelector('video') as HTMLVideoElement | null;
        if (!video) return;

        const index = Number(element.dataset.index);
        
        if (entry.isIntersecting && entry.intersectionRatio > 0.85) {
          // Autoplay current video
          try {
            video.muted = muted;
            video.playsInline = true;
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
    const items = railRef.current.querySelectorAll('.highlights__item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [muted, highlights, prefetchAround]);

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
        {highlights.map((highlight, index) => (
          <article 
            key={highlight.id} 
            className="highlights__item"
            data-index={index}
          >
            <HighlightCard 
              highlight={highlight}
              muted={muted}
              setMuted={setMuted}
            />
          </article>
        ))}
      </div>
    </section>
  );
};

export default HighlightsCarousel;