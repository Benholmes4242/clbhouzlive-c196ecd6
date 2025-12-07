import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import ActivityMediaCard from './ActivityMediaCard';
import MediaSkeleton from './MediaSkeleton';
import { ActivityMediaGridProps, ActivityMediaItem, AspectRatio, ActivityPost } from './types';

// Skeleton aspect ratios for realistic loading state
const SKELETON_ASPECTS: AspectRatio[] = ['square', 'portrait', 'square', 'landscape', 'square', 'square', 'portrait', 'square', 'landscape'];

/**
 * Convert ActivityPost to ActivityMediaItem
 */
function postToMediaItem(post: ActivityPost): ActivityMediaItem | null {
  const media = post.post_media;
  if (!media || media.length === 0) return null;

  const primaryMedia = media[0];
  const golfCourseTag = post.post_tags?.find(tag => tag.entity_type === 'golf_club');
  const isMilestone = post.content?.toLowerCase().includes('milestone') || 
    post.post_tags?.some(tag => tag.name?.toLowerCase().includes('achievement'));

  return {
    id: primaryMedia.id,
    postId: post.id,
    type: primaryMedia.media_type,
    url: primaryMedia.media_url,
    thumbnailUrl: primaryMedia.media_url,
    courseName: golfCourseTag?.name,
    roundDate: post.created_at,
    additionalMediaCount: media.length > 1 ? media.length - 1 : undefined,
    isMilestone,
    // Aspect ratio determined dynamically or default to square
    aspectRatio: 'square' as AspectRatio
  };
}

/**
 * Assign varied aspect ratios for visual interest
 * Creates a natural, gallery-like feel
 */
function assignAspectRatios(items: ActivityMediaItem[]): ActivityMediaItem[] {
  return items.map((item, index) => {
    // Pattern: mostly square, with occasional variety
    // Portrait every 4th item, landscape every 7th
    let aspectRatio: AspectRatio = 'square';
    
    if (index % 7 === 3) aspectRatio = 'landscape';
    else if (index % 5 === 2) aspectRatio = 'portrait';
    
    return { ...item, aspectRatio };
  });
}

/**
 * Premium Activity Media Grid
 * 
 * Features:
 * - Aspect-ratio based layout (portrait/square/landscape)
 * - Shimmer skeleton loading states
 * - Premium error handling with retry
 * - Hover/press micro-interactions
 * - Desktop video preview on hover
 */
const ActivityMediaGrid: React.FC<ActivityMediaGridProps> = ({
  posts,
  isLoading = false,
  onPostPress,
  viewMode = 'compact'
}) => {
  // Convert posts to media items
  const mediaItems = useMemo(() => {
    const items = posts
      .map(postToMediaItem)
      .filter((item): item is ActivityMediaItem => item !== null);
    
    return assignAspectRatios(items);
  }, [posts]);

  const gridCols = viewMode === 'immersive' ? 'grid-cols-2' : 'grid-cols-3';

  // Loading state with shimmer skeletons
  if (isLoading) {
    return (
      <div className={cn("grid gap-1 pb-24 px-0.5", gridCols)}>
        {SKELETON_ASPECTS.map((aspect, i) => (
          <MediaSkeleton key={i} aspectRatio={aspect} />
        ))}
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
    <div className={cn("grid gap-1 pb-24 px-0.5", gridCols)}>
      {mediaItems.map((item) => (
        <ActivityMediaCard
          key={item.id}
          item={item}
          onPress={onPostPress}
          aspectRatio={item.aspectRatio || 'square'}
        />
      ))}
    </div>
  );
};

export default ActivityMediaGrid;
