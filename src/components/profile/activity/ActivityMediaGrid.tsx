import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import MediaSkeleton from './MediaSkeleton';
import HeroPostTile from './HeroPostTile';
import StandardPostTile from './StandardPostTile';
import { ActivityMediaGridProps, ActivityMediaItem, AspectRatio, ActivityPost } from './types';
import { buildActivityLayout } from './layoutEngine';
import { getStreamPoster } from '@/utils/stream';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';

/**
 * Convert ActivityPost to ActivityMediaItem
 * Marks every 3rd video as an autoplay candidate
 */
function postToMediaItem(
  post: ActivityPost, 
  overallIndex: number, 
  videoCounter: { count: number }
): ActivityMediaItem | null {
  const media = post.post_media;
  if (!media || media.length === 0) return null;

  const primaryMedia = media[0];
  const golfCourseTag = post.post_tags?.find(tag => tag.entity_type === 'golf_club');
  const isMilestone = post.content?.toLowerCase().includes('milestone') || 
    post.post_tags?.some(tag => tag.name?.toLowerCase().includes('achievement'));

  // Determine aspect ratio from media dimensions if available
  let aspectRatio: AspectRatio = 'square';
  if (primaryMedia.aspect_ratio) {
    if (primaryMedia.aspect_ratio < 0.9) aspectRatio = 'portrait';
    else if (primaryMedia.aspect_ratio > 1.1) aspectRatio = 'landscape';
  }

  const isVideo = primaryMedia.media_type === 'video';
  
  // For videos: prefer DB poster_url; otherwise derive a stable Stream poster (videodelivery.net)
  // For images: use media_url directly
  const thumbnailUrl = isVideo
    ? (primaryMedia.poster_url || getStreamPoster(primaryMedia.media_url, '1s') || primaryMedia.media_url)
    : primaryMedia.media_url;

  // Every 3rd video is an autoplay candidate
  let isAutoplayCandidate = false;
  if (isVideo) {
    if (videoCounter.count % 3 === 0) {
      isAutoplayCandidate = true;
    }
    videoCounter.count += 1;
  }

  return {
    id: primaryMedia.id,
    postId: post.id,
    type: primaryMedia.media_type,
    url: primaryMedia.media_url,
    thumbnailUrl,
    playbackUrl: primaryMedia.media_url,
    courseName: golfCourseTag?.name,
    roundDate: post.created_at,
    additionalMediaCount: media.length > 1 ? media.length - 1 : undefined,
    isMilestone,
    aspectRatio,
    isAutoplayCandidate,
    durationSeconds: primaryMedia.duration_seconds,
    sortIndex: overallIndex
  };
}

/**
 * Premium Activity Media Grid
 * 
 * Features:
 * - Hero + two-column waterfall layout
 * - Pointed corners (no rounding)
 * - Shimmer skeleton loading states
 * - Premium metadata overlays
 * - Smart autoplay for videos (1 in every 3, max 2 at once)
 */
const ActivityMediaGrid: React.FC<ActivityMediaGridProps> = ({
  posts,
  isLoading = false,
  onPostPress,
  viewMode = 'compact'
}) => {
  // Set up autoplay hook
  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: 2,
    visibilityThreshold: 0.6,
  });

  // Convert posts to media items with video counter for candidate marking
  const mediaItems = useMemo(() => {
    const videoCounter = { count: 0 };
    return posts
      .map((post, index) => postToMediaItem(post, index, videoCounter))
      .filter((item): item is ActivityMediaItem => item !== null);
  }, [posts]);

  // Build layout rows (hero + pairs)
  const layoutRows = useMemo(() => {
    return buildActivityLayout(mediaItems);
  }, [mediaItems]);

  // Loading state with shimmer skeletons
  if (isLoading) {
    return (
      <div className="px-0 pb-16">
        <div className="grid grid-cols-2 gap-[2px]">
          {/* Hero skeleton */}
          <div className="col-span-2 aspect-[16/9] bg-muted/30 animate-pulse" />
          {/* Standard skeletons */}
          {[...Array(6)].map((_, i) => (
            <MediaSkeleton key={i} aspectRatio="square" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">No posts yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Share your golf moments to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="px-0 pb-16">
      <div className="grid grid-cols-2 gap-[2px]" style={{ gridAutoFlow: 'row dense' }}>
        {layoutRows.map((row, index) => {
          if (row.type === 'hero') {
            return (
              <HeroPostTile
                key={`hero-${row.post.id}-${index}`}
                item={row.post}
                onPress={onPostPress}
                registerVideo={registerVideo}
                isPlaying={playingIds.has(row.post.postId)}
              />
            );
          }

          return (
            <React.Fragment key={`pair-${index}`}>
              <StandardPostTile 
                item={row.left} 
                onPress={onPostPress}
                registerVideo={registerVideo}
                isPlaying={playingIds.has(row.left.postId)}
              />
              {row.right ? (
                <StandardPostTile 
                  item={row.right} 
                  onPress={onPostPress}
                  registerVideo={registerVideo}
                  isPlaying={playingIds.has(row.right.postId)}
                />
              ) : (
                <div className="aspect-[3/4]" /> // empty spacer if odd
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityMediaGrid;
