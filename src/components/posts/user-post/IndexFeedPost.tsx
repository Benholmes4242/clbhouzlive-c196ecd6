import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMediaAutoplay } from '@/media';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { UserPostData, GolfCourse } from './types';
import { UserInfoOverlay } from './overlays/UserInfoOverlay';
import { CaptionOverlay } from './overlays/CaptionOverlay';
import { InteractionIconsOverlay } from './overlays/InteractionIconsOverlay';
import { MediaNavigationDots } from './overlays/MediaNavigationDots';
import { MediaContainer } from './MediaContainer';


interface IndexFeedPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  /** @deprecated Use courses array instead */
  golfCourse: GolfCourse | null;
  /** Array of golf courses for multi-course support */
  courses?: GolfCourse[];
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  onDeletePost: () => void;
}

const IndexFeedPostComponent: React.FC<IndexFeedPostProps> = ({
  post,
  displayName,
  timeAgo,
  golfCourse,
  courses: coursesProp,
  onProfileClick,
  onMediaClick,
  onDeletePost
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullCourseTag, setShowFullCourseTag] = useState(false);
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  
  // Unified media autoplay system
  const mediaId = `index-${post.id}`;
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'feed',
    startThreshold: 0.4,
    stopThreshold: 0.35,
  });
  
  const isPlaying = playingIds.has(mediaId);
  
  // Video ref callback for media registration - passed to MediaContainer
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    if (el) {
      const hasVideo = post.post_media?.some(m => m.media_type === 'video');
      if (hasVideo) {
        registerMedia({
          id: mediaId,
          element: el,
          isCandidate: true,
          sortIndex: 0,
        });
      }
    }
  }, [mediaId, post.post_media, registerMedia]);

  // Memoize expensive calculations
  const isOwnPost = useMemo(() => user?.id === post.user.id, [user?.id, post.user.id]);
  const currentMediaMemo = useMemo(() => post.post_media?.[currentMediaIndex], [post.post_media, currentMediaIndex]);
  
  // Normalize courses: use coursesProp if provided, else wrap golfCourse for backward compat
  const courses = useMemo(() => {
    if (coursesProp && coursesProp.length > 0) return coursesProp;
    if (golfCourse) return [golfCourse];
    return [];
  }, [coursesProp, golfCourse]);

  useEffect(() => {
    if (!currentMediaMemo) return;
    
    if (isPlaying) {
      setIsHovered(true);
    }
  }, [isPlaying, currentMediaMemo]);

  // Hide full course tag when scrolling off the post
  useEffect(() => {
    if (!isPlaying && showFullCourseTag) {
      setShowFullCourseTag(false);
    }
  }, [isPlaying, showFullCourseTag]);

  // Memoized handlers for better performance
  const handleCourseTagClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setShowFullCourseTag(!showFullCourseTag);
    }
  }, [isMobile, showFullCourseTag]);

  const handleSwipeLeft = useCallback(() => {
    setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
  }, [post.post_media.length]);

  const handleSwipeRight = useCallback(() => {
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
  }, [post.post_media.length]);

  const handleInteractionClick = useCallback((e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    // Handle interaction logic here (like, comment, share)
  }, []);

  const handleMaximizeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMediaMemo) return;
    
    // Delegate to parent's onMediaClick handler which uses unified fullscreen
    onMediaClick(currentMediaMemo.media_url, currentMediaMemo.media_type as 'image' | 'video', currentMediaIndex);
  }, [currentMediaIndex, currentMediaMemo, onMediaClick]);

  // Memoized values
  const cleanContent = useMemo(() => removeGolfCourseFromContent(post.content), [post.content]);
  
  const truncatedContent = useMemo(() => {
    if (!cleanContent) return '';
    const words = cleanContent.split(' ');
    if (words.length <= 9) return cleanContent;
    return words.slice(0, 9).join(' ') + '...';
  }, [cleanContent]);

  // Early return for performance
  if (!post.post_media || post.post_media.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="relative w-full bg-media-loading rounded-xl overflow-hidden"
      style={{ aspectRatio: '4/5' }}
    >
      <MediaContainer
        media={post.post_media}
        currentIndex={currentMediaIndex}
        isHovered={isPlaying || isHovered}
        onMediaClick={() => {}} // Disable media click actions
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        videoRefCallback={videoRefCallback}
      >
        <UserInfoOverlay
          user={post.user}
          displayName={displayName}
          onProfileClick={onProfileClick}
          courses={courses}
          source="index"
        />


        {/* Maximize Button for both Desktop and Mobile */}
        <div className="absolute top-3 right-3 z-20">
          <button 
            onClick={handleMaximizeClick}
            className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
        </div>

        {/* Media Navigation Arrows */}
        {post.post_media.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Golf course tag overlay removed */}

        <CaptionOverlay
          content={post.content}
          postTags={post.post_tags || []}
          truncatedContent={truncatedContent}
          isReview={(post as any).isReview ?? (post as any).is_review ?? false}
        />

        <InteractionIconsOverlay
          onInteractionClick={handleInteractionClick}
          currentMediaType={currentMediaMemo?.media_type}
        />

        <MediaNavigationDots
          mediaCount={post.post_media.length}
          currentIndex={currentMediaIndex}
        />
      </MediaContainer>
    </div>
  );
};

// Memoized export for performance
export const IndexFeedPost = memo(IndexFeedPostComponent);
