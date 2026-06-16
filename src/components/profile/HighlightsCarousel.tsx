/**
 * HighlightsCarousel - Top 100 highlights carousel
 *
 * Uses UnifiedVideoPlayer with MediaRuntime for playback control.
 * Mount gating: only active + adjacent slides mount players.
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTop100Highlights } from '@/hooks/useTop100Highlights';
import { warmHls, getHlsUrl } from '@/utils/videoPreload';
import HighlightVideo from './HighlightVideo';
import HighlightOverlays from './HighlightOverlays';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';

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

  // Fetch the profile owner's author fields
  const { data: author } = useQuery({
    queryKey: ['highlights-author', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, username, profile_photo_url')
        .eq('id', userId)
        .maybeSingle();
      return data;
    },
  });

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

  // Open fullscreen viewer with highlights as read-only gallery
  const handleHighlightTap = useCallback((index: number) => {
    if (!highlights) return;
    const posts: FeedPost[] = highlights.map((h) => {
      const m = h.post_media?.[0];
      const isVideo = m?.media_type === 'video';
      return {
        id: h.id,
        userId,
        actorType: 'personal',
        actorId: userId,
        username: author?.username ?? '',
        displayName: author?.display_name ?? author?.username ?? '',
        avatarUrl: author?.profile_photo_url ?? '',
        isVerified: false,
        creatorRelation: 'none',
        caption: h.content ?? '',
        mediaItems: [{
          id: m?.id ?? h.id,
          type: isVideo ? 'video' : 'image',
          hlsUrl: isVideo ? (m?.media_url ?? undefined) : undefined,
          imageUrl: !isVideo ? (m?.media_url ?? undefined) : undefined,
          thumbnailUrl: m?.media_url ?? undefined,
          width: 0,
          height: 0,
        }],
        createdAt: h.created_at,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        courseName: h.golf_course?.name,
        courseId: h.golf_course?.id,
      } as FeedPost;
    });
    useFullscreenFeedStore.getState().open(posts, index, { readOnly: true });
  }, [highlights, userId, author]);

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
                  muted={isMuted}
                  onTap={() => handleHighlightTap(index)}
                />
                <button
                  className="unmute-btn"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  onClick={(e) => { e.stopPropagation(); if (isMuted) markUserGestureUnmute(); toggleMute(); }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
