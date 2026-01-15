import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LongFormLandscapeCard } from './LongFormLandscapeCard';
import { LongFormPortraitCard } from './LongFormPortraitCard';
import { useInfiniteLongFormVideos } from '@/hooks/useInfiniteLongFormVideos';
import { useFollowedUsers } from '@/hooks/useFollowedUsers';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { runtimeUserTap } from '@/media';
import type { LongFormVideo } from './LongFormVideoTile';
import type { LongFormCardVideo } from './LongFormLandscapeCard';

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
 * VideosSectionPage - Full section page with mixed layout + infinite scroll
 * 
 * Layout: First video as landscape hero, rest as 2-column portrait grid
 */
export const VideosSectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const section = (searchParams.get('section') || 'recommended') as SectionType;
  const categoryParam = searchParams.get('category') || 'all';
  const category = categoryParam !== 'all' ? categoryParam : undefined;

  // Get followed user IDs for following section
  const { followedIds } = useFollowedUsers();

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
    openFullscreen(videosAsExploreItems, index);
  }, [videosAsExploreItems, openFullscreen]);

  const handleBack = () => {
    navigate('/discover?main=videos');
  };

  // Convert LongFormVideo to card format
  const toCardVideo = (v: LongFormVideo): LongFormCardVideo => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    mediaUrl: v.mediaUrl,
    duration: v.duration,
    durationSeconds: v.durationSeconds,
    creatorUserId: v.creatorUserId,
    creatorName: v.creatorName,
    creatorAvatarUrl: v.creatorAvatarUrl,
    likes: v.likes,
    views: v.views,
    createdAt: v.createdAt,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-page)] border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-32 mt-1.5 rounded" />
            </div>
          </div>
        </div>
        
        {/* Loading skeletons */}
        <div className="p-4 space-y-4">
          <Skeleton className="w-full aspect-video rounded-sm" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
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

  // Split videos: first for hero, rest for grid
  const [featured, ...gridVideos] = videos;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-page)] border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{SECTION_TITLES[section]}</h1>
            <p className="text-xs text-muted-foreground truncate">{SECTION_DESCRIPTIONS[section]}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nothing here yet
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-[240px] mb-6">
            Videos in this section will appear as creators share new content
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Videos
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Featured Hero (Landscape 16:9) */}
          {featured && (
            <LongFormLandscapeCard
              video={toCardVideo(featured)}
              onTap={() => handleVideoTap(featured, 0)}
            />
          )}

          {/* Grid (Portrait 3:4, 2-column) */}
          {gridVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {gridVideos.map((video, index) => (
                <LongFormPortraitCard
                  key={video.id}
                  video={toCardVideo(video)}
                  onTap={() => handleVideoTap(video, index + 1)}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="aspect-[3/4] rounded-sm" />
              <Skeleton className="aspect-[3/4] rounded-sm" />
            </div>
          )}

          {/* End of content */}
          {!hasMore && videos.length > 4 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <div className="w-12 h-0.5 bg-muted rounded-full mb-3" />
              <p className="text-xs font-medium">You've seen it all</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideosSectionPage;
