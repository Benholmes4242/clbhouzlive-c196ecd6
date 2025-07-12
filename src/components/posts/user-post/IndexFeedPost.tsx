import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { UserPostData, GolfCourse } from './types';
import { UserInfoOverlay } from './overlays/UserInfoOverlay';
import { GolfCourseTagOverlay } from './overlays/GolfCourseTagOverlay';
import { CaptionOverlay } from './overlays/CaptionOverlay';
import { InteractionIconsOverlay } from './overlays/InteractionIconsOverlay';
import { MediaNavigationDots } from './overlays/MediaNavigationDots';
import { MediaContainer } from './MediaContainer';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenPostNavigation } from '@/hooks/useFullscreenPostNavigation';

interface IndexFeedPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  golfCourse: GolfCourse | null;
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  onDeletePost: () => void;
}

const IndexFeedPostComponent: React.FC<IndexFeedPostProps> = ({
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
  const { pauseVideo, pauseAllAndSetActive } = useVideoPlaybackManager();
  const { isGloballyMuted } = useGlobalAudio();
  const isMobile = useIsMobile();
  
  // Use the new fullscreen post navigation hook
  const {
    isOpen: isFullscreenOpen,
    currentMedia,
    userPosts,
    currentPostIndex,
    loading: postsLoading,
    openMedia: openFullscreenMedia,
    closeMedia: closeFullscreenMedia,
    goToNextPost,
    goToPreviousPost,
    canGoNext,
    canGoPrevious
  } = useFullscreenPostNavigation();
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5, // Optimized threshold
    rootMargin: '0px 0px -20% 0px' // Only trigger when entering from bottom, more selective
  });

  // Check if this is the user's own post
  const isOwnPost = user?.id === post.user.id;

  useEffect(() => {
    const currentMedia = post.post_media?.[currentMediaIndex];
    if (!currentMedia) return;
    
    console.log('🎬 IndexFeedPost: isInView changed:', isInView, 'for video:', `index-${currentMedia.id}`, 'mediaType:', currentMedia.media_type);
    
    if (isInView) {
      // When ANY post comes into view, pause all videos first
      pauseAllAndSetActive(''); // Pass empty string to just pause all videos
      
      if (currentMedia.media_type === 'video') {
        const videoId = `index-${currentMedia.id}`;
        console.log('🎬 Video entering view, setting as active:', videoId);
        setIsHovered(true);
        // Allow this video to play by calling pauseAllAndSetActive with the actual videoId
        pauseAllAndSetActive(videoId);
      } else {
        setIsHovered(true);
      }
    } else {
      setIsHovered(false);
      
      // When leaving view, pause this video if it's a video
      if (currentMedia.media_type === 'video') {
        const videoId = `index-${currentMedia.id}`;
        console.log('🎬 Video exiting view, pausing:', videoId);
        pauseVideo(videoId);
      }
    }
  }, [isInView, currentMediaIndex, post.post_media, pauseVideo, pauseAllAndSetActive]);

  // Hide full course tag when scrolling off the post
  useEffect(() => {
    if (!isInView && showFullCourseTag) {
      setShowFullCourseTag(false);
    }
  }, [isInView, showFullCourseTag]);

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

  const handleMaximizeClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentMedia = post.post_media[currentMediaIndex];
    const mediaUrls = post.post_media.map(m => m.media_url);
    const mediaTypes = post.post_media.map(m => m.media_type as 'image' | 'video');
    
    // Open with post navigation enabled
    await openFullscreenMedia(
      mediaUrls,
      mediaTypes,
      'Post content',
      golfCourse || undefined,
      post.user,
      displayName,
      post.content,
      post.post_tags,
      currentMediaIndex,
      post.id, // Pass post ID
      post.user.id // Pass user ID for fetching other posts
    );
  }, [currentMediaIndex, post, golfCourse, displayName, openFullscreenMedia]);

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
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: '4/5' }}
    >
      <MediaContainer
        media={post.post_media}
        currentIndex={currentMediaIndex}
        isHovered={isHovered}
        onMediaClick={() => {}} // Disable media click actions
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      >
        <UserInfoOverlay
          user={post.user}
          displayName={displayName}
          onProfileClick={onProfileClick}
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

        {/* Only show overlay golf course tag on mobile, desktop shows in caption */}
        {isMobile && (
          <GolfCourseTagOverlay
            golfCourse={golfCourse}
            isMobile={isMobile}
            showFullTag={showFullCourseTag}
            onTagClick={handleCourseTagClick}
          />
        )}

        <CaptionOverlay
          content={post.content}
          postTags={post.post_tags || []}
          truncatedContent={truncatedContent}
          golfCourse={golfCourse}
          showFullCourseTag={showFullCourseTag}
          onCourseTagClick={handleCourseTagClick}
        />

        <InteractionIconsOverlay
          onInteractionClick={handleInteractionClick}
          currentMediaType={post.post_media[currentMediaIndex]?.media_type}
        />

        <MediaNavigationDots
          mediaCount={post.post_media.length}
          currentIndex={currentMediaIndex}
        />
      </MediaContainer>

      {/* Enhanced Fullscreen Modal with Post Navigation */}
      <FullscreenMediaModal
        isOpen={isFullscreenOpen}
        onClose={closeFullscreenMedia}
        mediaUrl={currentMedia?.mediaUrls || []}
        mediaType={currentMedia?.mediaTypes || []}
        alt={currentMedia?.alt}
        golfCourse={golfCourse || undefined}
        user={currentMedia?.user}
        displayName={currentMedia?.displayName}
        content={currentMedia?.content}
        postTags={currentMedia?.postTags}
        initialIndex={currentMedia?.initialIndex || 0}
        canNavigatePosts={userPosts.length > 1}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNextPost={goToNextPost}
        onPreviousPost={goToPreviousPost}
        currentPostIndex={currentPostIndex}
        totalPosts={userPosts.length}
      />
    </div>
  );
};

// Memoized export for performance
export const IndexFeedPost = memo(IndexFeedPostComponent);