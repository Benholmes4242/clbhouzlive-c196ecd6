import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { UserPostData, GolfCourse } from './types';
import { UserInfoOverlay } from './overlays/UserInfoOverlay';
import { GolfCourseTagOverlay } from './overlays/GolfCourseTagOverlay';
import { CaptionOverlay } from './overlays/CaptionOverlay';
import { InteractionIconsOverlay } from './overlays/InteractionIconsOverlay';
import { MediaNavigationDots } from './overlays/MediaNavigationDots';
import { MediaContainer } from './MediaContainer';

interface IndexFeedPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  golfCourse: GolfCourse | null;
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onDeletePost: () => void;
}

export const IndexFeedPost: React.FC<IndexFeedPostProps> = ({
  post,
  displayName,
  timeAgo,
  golfCourse,
  onProfileClick,
  onMediaClick,
  onDeletePost
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullCourseTag, setShowFullCourseTag] = useState(false);
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.3, // Autoplay when 30% of video is visible (within 20-40% range)
    rootMargin: '0px'
  });

  // Check if this is the user's own post
  const isOwnPost = user?.id === post.user.id;

  useEffect(() => {
    if (isInView && post.post_media?.[currentMediaIndex]?.media_type === 'video') {
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  }, [isInView, currentMediaIndex, post.post_media]);

  // Hide full course tag when scrolling off the post
  useEffect(() => {
    if (!isInView && showFullCourseTag) {
      setShowFullCourseTag(false);
    }
  }, [isInView, showFullCourseTag]);

  const handleCourseTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setShowFullCourseTag(!showFullCourseTag);
    }
  };

  const handleSwipeLeft = () => {
    setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
  };

  const handleSwipeRight = () => {
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
  };

  const handleInteractionClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    // Handle interaction logic here (like, comment, share)
  };

  if (!post.post_media || post.post_media.length === 0) {
    return null; // No media posts don't get special treatment in index feed
  }

  const cleanContent = removeGolfCourseFromContent(post.content);
  
  // Truncate content to around 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };
  
  const truncatedContent = truncateToWords(cleanContent);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden"
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <MediaContainer
        media={post.post_media}
        currentIndex={currentMediaIndex}
        isHovered={isHovered}
        onMediaClick={onMediaClick}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      >
        <UserInfoOverlay
          user={post.user}
          displayName={displayName}
          onProfileClick={onProfileClick}
        />

        <GolfCourseTagOverlay
          golfCourse={golfCourse}
          isMobile={isMobile}
          showFullTag={showFullCourseTag}
          onTagClick={handleCourseTagClick}
        />

        <CaptionOverlay
          content={post.content}
          postTags={post.post_tags || []}
          truncatedContent={truncatedContent}
        />

        <InteractionIconsOverlay
          onInteractionClick={handleInteractionClick}
        />

        <MediaNavigationDots
          mediaCount={post.post_media.length}
          currentIndex={currentMediaIndex}
        />
      </MediaContainer>
    </div>
  );
};