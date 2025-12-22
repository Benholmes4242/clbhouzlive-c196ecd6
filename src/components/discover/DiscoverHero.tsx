import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getStreamPoster } from '@/utils/stream';
import { OverlayCorners } from '@/components/shared/overlay';
import { HLSPlayer, HLSPlayerRef } from '@/media';

interface HeroItem {
  id: string;
  contextLabel: string; // e.g. "Trending in golf"
  title: string;
  subContext: string; // creator OR course name
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  ctaLabel?: string;
  onClick?: () => void;
  durationSeconds?: number; // Video duration in seconds
  isPopular?: boolean; // Ranking: Popular today
  isTrending?: boolean; // Ranking: Trending
  likes?: number; // Like count
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface DiscoverHeroProps {
  item: HeroItem | null;
  isLoading?: boolean;
  onWatch?: (item: HeroItem) => void;
  /** When true, HLSPlayer manages its own autoplay via visibility */
  autoplay?: boolean;
}

/**
 * DiscoverHero - Hero card for discover page
 * 
 * IMPORTANT: This component does NOT control playback directly.
 * HLSPlayer handles autoplay internally based on visibility.
 * For grid contexts, the parent should use useMediaAutoplay + MediaRuntime.
 */
export default function DiscoverHero({ item, isLoading, onWatch, autoplay = true }: DiscoverHeroProps) {
  const navigate = useNavigate();
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedDuration, setResolvedDuration] = useState<number | undefined>(item?.durationSeconds);

  // Update resolved duration when item changes
  useEffect(() => {
    setResolvedDuration(item?.durationSeconds);
  }, [item?.durationSeconds]);

  // Get duration from video element if not provided
  const handleLoadedData = useCallback(() => {
    if (playerRef.current && !item?.durationSeconds) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDuration(d);
      }
    }
  }, [item?.durationSeconds]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 overflow-hidden">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
          <Skeleton className="absolute inset-0" />
        </div>
        <div className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const handleClick = () => {
    onWatch?.(item);
    item.onClick?.();
  };

  const handleClubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.golfCourse?.id) {
      navigate(`/clubs/${item.golfCourse.id}`);
    }
  };

  const creatorName = item.creator?.name || item.subContext;
  const creatorAvatar = item.creator?.avatarUrl;

  return (
    <div 
      ref={containerRef}
      className="bg-card border border-border/30 overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* Media Section - 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {/* Media - Image or Video */}
        {item.mediaType === 'video' && item.mediaUrl ? (
          <HLSPlayer
            ref={playerRef}
            src={item.mediaUrl}
            poster={item.posterUrl}
            autoplay={autoplay}
            muted
            loop
            objectFit="cover"
            onLoadedData={handleLoadedData}
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Unified overlay system */}
        <OverlayCorners
          surface="hero"
          club={item.golfCourse ? { id: item.golfCourse.id, name: item.golfCourse.name } : null}
          onClubClick={handleClubClick}
          showDuration={false}
          trendingLabel="Trending Today"
          showCreator={false}
          showLikes={true}
          likes={item.likes}
          showAvatar={false}
        />

        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>

      {/* Meta Area - White card section */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        {/* Text content - constrained to ~75% to leave room for avatar */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Caption - 2 lines max */}
          <p className="text-sm text-foreground line-clamp-2 leading-snug">
            {item.title}
          </p>
          {/* Creator name */}
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {creatorName}
          </p>
        </div>

        {/* Avatar - global squircle shape with tile-style border */}
        <div 
          className="shrink-0 overflow-hidden border border-border/40 shadow-sm"
          style={{
            width: '40px',
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
          }}
        >
          <img
            src={creatorAvatar || '/placeholder.svg'}
            alt={creatorName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to create hero item from post data
export function createHeroItem(post: any): HeroItem | null {
  if (!post) return null;

  const mediaUrl = post.media?.[0]?.media_url || post.src;
  const mediaType = (post.media?.[0]?.media_type || post.type) === 'video' ? 'video' : 'image';
  
  let posterUrl: string | undefined;
  if (mediaType === 'video' && mediaUrl) {
    posterUrl = getStreamPoster(mediaUrl, '1s') ?? undefined;
  }

  return {
    id: post.id,
    contextLabel: 'TRENDING TODAY',
    title: post.title || post.caption || 'Featured moment',
    subContext: post.user?.name || post.course_name || '',
    mediaUrl,
    mediaType,
    posterUrl,
    ctaLabel: 'Watch',
    durationSeconds: post.durationSeconds,
    isPopular: post.isPopular,
    isTrending: post.isTrending,
    golfCourse: post.golfCourse,
    likes: post.likes,
    creator: post.user ? {
      id: post.user.id,
      name: post.user.display_name || post.user.name || post.user.username,
      avatarUrl: post.user.avatar || post.user.profile_photo_url || post.user.avatar_url,
    } : undefined,
  };
}
