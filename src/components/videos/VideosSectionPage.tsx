import React, { useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Users, Flame, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LongFormFeedCard } from './LongFormFeedCard';
import { LongFormFeedCardSkeleton } from './LongFormFeedCardSkeleton';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { runtimeUserTap } from '@/media';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { LongFormVideo } from './LongFormVideoTile';
import type { LongFormFeedVideo } from './LongFormFeedCard';

// Section Empty State Component
function SectionEmptyState({ 
  section, 
  onBack 
}: { 
  section: SectionType; 
  onBack: () => void;
}) {
  const emptyMessages: Record<SectionType, { icon: React.ReactNode; message: string; action?: { label: string; href: string } }> = {
    recommended: {
      icon: <Play className="w-8 h-8 text-muted-foreground" />,
      message: 'No recommendations yet. Watch some videos to get personalized suggestions!',
    },
    trending: {
      icon: <Flame className="w-8 h-8 text-muted-foreground" />,
      message: 'No trending videos this week. Check back soon!',
    },
    following: {
      icon: <Users className="w-8 h-8 text-muted-foreground" />,
      message: 'Follow creators to see their videos here.',
      action: { label: 'Discover creators', href: '/discover?main=explore' },
    },
    courses: {
      icon: <MapPin className="w-8 h-8 text-muted-foreground" />,
      message: 'No course videos yet. Be the first to share a course vlog!',
    },
  };

  const { icon, message, action } = emptyMessages[section];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Nothing here yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-[240px] mb-6">
        {message}
      </p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = action.href}
          className="gap-2 mb-2"
        >
          {action.label}
        </Button>
      )}
      <button 
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Videos
      </button>
    </div>
  );
}

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

const SECTION_TITLES: Record<SectionType, string> = {
  recommended: 'Recommended for you',
  trending: 'Trending this week',
  following: 'From creators you follow',
  courses: 'Courses & destinations',
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  recommended: 'Based on what you watch',
  trending: 'Popular with golfers right now',
  following: 'Latest from creators you follow',
  courses: 'Course vlogs and bucket-list rounds',
};

/**
 * VideosSectionPage - Full section page with feed layout + infinite scroll
 * 
 * TikTok-Level: Adaptive prefetch + manifest preloading + scroll velocity tracking
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const section = (searchParams.get('section') || 'recommended') as SectionType;
  const categoryParam = searchParams.get('category') || 'all';
  const category = categoryParam !== 'all' ? categoryParam : undefined;

  // Get followed user IDs for following section
  const { followedIds } = useFollowedUsers();
  
  // P0: TikTok-level adaptive prefetch with EWMA velocity tracking
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  const hasPreloadedRef = useRef<Set<string>>(new Set());

  // Infinite query for videos
  const {
    items: videos,
    isLoading,
    isError,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteLongFormVideos({
    section,
    followedCreatorIds: followedIds,
    category,
  });

  // P1: Preload HLS manifests for videos in prefetch window
  useLayoutEffect(() => {
    if (videos.length === 0) return;
    
    const { prefetchAhead, preloadManifests } = prefetchConfig;
    if (!preloadManifests) return;
    
    // Preload first N manifests based on adaptive config
    const toPreload = videos.slice(0, Math.min(prefetchAhead, videos.length));
    
    toPreload.forEach((video) => {
      if (!video.mediaUrl || hasPreloadedRef.current.has(video.id)) return;
      
      const uid = uidFromNode({ media_url: video.mediaUrl });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
        hasPreloadedRef.current.add(video.id);
      }
    });
  }, [videos, prefetchConfig]);

  // Unified fullscreen player
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
    onLoadMore: fetchNextPage,
    hasMore,
    isLoadingMore: isFetchingNextPage,
  });

  // Convert to ExploreContentItem format for fullscreen
  const videosAsExploreItems = useMemo(() => {
    return videos.map(video => ({
      id: video.id,
      type: 'video' as const,
      src: video.mediaUrl || '',
      thumbnailSrc: video.thumbnailUrl,
      title: video.title,
      durationSeconds: video.durationSeconds,
      user: {
        id: video.creatorUserId,
        name: video.creatorName,
        avatar: video.creatorAvatarUrl,
      },
      likes: video.likes || 0,
      golfCourse: video.golfCourseId ? {
        id: video.golfCourseId,
        name: video.golfCourseName || 'Golf Course',
      } : undefined,
      createdAt: video.createdAt,
    }));
  }, [videos]);

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!hasMore || isLoading || isFetchingNextPage) return;
    
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px', threshold: 0 }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, isFetchingNextPage, fetchNextPage]);

  const handleVideoTap = useCallback((video: LongFormVideo, index: number) => {
    runtimeUserTap(video.id);
    // P0: Record scroll event for velocity tracking
    onIndexChange();
    openFullscreen(videosAsExploreItems, index);
  }, [videosAsExploreItems, openFullscreen, onIndexChange]);

  const handleCreatorTap = useCallback((creatorUserId: string) => {
    navigate(`/profile/${creatorUserId}`);
  }, [navigate]);

  const handleBack = () => {
    navigate('/discover?main=videos');
  };

  // Convert LongFormVideo to LongFormFeedVideo format
  const toFeedVideo = (v: LongFormVideo): LongFormFeedVideo => ({
    id: v.id,
    title: v.title,
    content: v.title,
    mediaUrl: v.mediaUrl || '',
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    durationSeconds: v.durationSeconds,
    creatorUserId: v.creatorUserId,
    creatorName: v.creatorName || 'Unknown',
    creatorAvatarUrl: v.creatorAvatarUrl,
    followerCount: 0,
    golfCourseName: v.golfCourseName,
    golfCourseId: v.golfCourseId,
    createdAt: v.createdAt || new Date().toISOString(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-4">
        {/* Section Title skeleton */}
        <div className="px-4 mb-4">
          <div className="h-6 w-48 bg-muted motion-safe:animate-shimmer-down rounded" />
          <div className="h-4 w-32 mt-1.5 bg-muted motion-safe:animate-shimmer-down rounded" style={{ animationDelay: '50ms' }} />
        </div>
        
        {/* Loading skeletons with staggered animation */}
        <div 
          className="-mx-5 px-0"
          style={{ background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.5) 100%)' }}
        >
          <div className="flex flex-col gap-3 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LongFormFeedCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-lg font-medium text-foreground mb-2">Failed to load videos</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <button 
            onClick={handleBack}
            className="mt-4 text-sm text-primary font-medium hover:underline"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-4">
      {/* Section Title */}
      <div className="px-4 mb-4">
        <h1 className="text-lg font-bold text-foreground truncate">{SECTION_TITLES[section]}</h1>
        <p className="text-xs text-muted-foreground truncate">{SECTION_DESCRIPTIONS[section]}</p>
      </div>

      {/* Content */}
      {videos.length === 0 ? (
        <SectionEmptyState section={section} onBack={handleBack} />
      ) : (
        <div 
          className="-mx-5 px-0 mt-3"
          style={{ background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.5) 100%)' }}
        >
          <div className="flex flex-col gap-3 py-3">
            {/* Feed cards - single column with index for priority loading */}
            {videos.map((video, index) => (
              <LongFormFeedCard
                key={video.id}
                video={toFeedVideo(video)}
                onVideoTap={() => handleVideoTap(video, index)}
                onCreatorTap={() => handleCreatorTap(video.creatorUserId)}
                index={index}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading more indicator with staggered animation */}
            {isFetchingNextPage && (
              <LongFormFeedCardSkeleton index={0} />
            )}

            {/* End of content */}
            {!hasMore && videos.length > 3 && (
              <div className="flex flex-col items-center justify-center py-8 bg-white">
                <div className="w-12 h-0.5 bg-muted rounded-full mb-3" />
                <p className="text-xs font-medium text-muted-foreground">You've seen it all</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideosSectionPage;
