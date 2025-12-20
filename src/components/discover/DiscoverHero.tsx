import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getStreamPoster } from '@/utils/stream';
import { OverlayCorners } from '@/components/shared/overlay';

interface HeroItem {
  id: string;
  contextLabel: string; // e.g. "Trending in golf"
  title: string;
  caption?: string; // Post caption
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  ctaLabel?: string;
  onClick?: () => void;
  durationSeconds?: number; // Video duration in seconds
  isPopular?: boolean; // Ranking: Popular today
  isTrending?: boolean; // Ranking: Trending
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
}

export default function DiscoverHero({ item, isLoading, onWatch }: DiscoverHeroProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [resolvedDuration, setResolvedDuration] = useState<number | undefined>(item?.durationSeconds);

  // Autoplay muted video when in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item || item.mediaType !== 'video') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [item]);

  // Update resolved duration when item changes
  useEffect(() => {
    setResolvedDuration(item?.durationSeconds);
  }, [item?.durationSeconds]);

  // Get duration from video element if not provided
  const handleLoadedMetadata = () => {
    setVideoLoaded(true);
    if (videoRef.current && !item?.durationSeconds) {
      const d = videoRef.current.duration;
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDuration(d);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
        <Skeleton className="absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
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

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.creator?.id) {
      navigate(`/profile/${item.creator.id}`);
    }
  };

  const isVideo = item.mediaType === 'video';

  return (
    <div className="w-full">
      {/* Hero Video Container */}
      <div 
        className="relative w-full aspect-[16/9] overflow-hidden bg-slate-800 cursor-pointer group rounded-lg"
        onClick={handleClick}
      >
        {/* Media - Image or Video */}
        {item.mediaType === 'video' ? (
          <>
            {/* Poster while video loads */}
            {!videoLoaded && item.posterUrl && (
              <img
                src={item.posterUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <video
              ref={videoRef}
              src={item.mediaUrl}
              poster={item.posterUrl}
              muted
              loop
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Softer gradient overlay - less contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Unified overlay system: club (top-left), fire icon (top-right) */}
        <OverlayCorners
          surface="hero"
          club={item.golfCourse ? { id: item.golfCourse.id, name: item.golfCourse.name } : null}
          onClubClick={handleClubClick}
          showDuration={false}
          hotState={true}
          showCreator={false}
          showLikes={false}
          showAvatar={false}
        />

        {/* On-video label: TRENDING TODAY (lower-left, where username was) */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[10px] md:text-[11px] font-semibold text-white/90 uppercase tracking-wider">
            {item.contextLabel}
          </span>
        </div>

        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-white/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>

      {/* Meta Area Below Video */}
      <div className="flex items-start justify-between gap-3 pt-3 pb-1">
        {/* Left: Username + Caption */}
        <div className="flex-1 min-w-0">
          {item.creator?.name && (
            <button
              onClick={handleCreatorClick}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:underline truncate block"
            >
              {item.creator.name}
            </button>
          )}
          {item.caption && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {item.caption}
            </p>
          )}
        </div>

        {/* Right: Avatar */}
        {item.creator?.avatarUrl && (
          <button
            onClick={handleCreatorClick}
            className="flex-shrink-0"
          >
            <img
              src={item.creator.avatarUrl}
              alt={item.creator.name || 'Creator'}
              className="w-10 h-10 rounded-xl object-cover"
            />
          </button>
        )}
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
    caption: post.caption,
    mediaUrl,
    mediaType,
    posterUrl,
    ctaLabel: 'Watch',
    durationSeconds: post.durationSeconds,
    isPopular: post.isPopular,
    isTrending: post.isTrending,
    golfCourse: post.golfCourse,
    creator: post.user ? {
      id: post.user.id,
      name: post.user.name,
      avatarUrl: post.user.avatar_url,
    } : undefined,
  };
}
