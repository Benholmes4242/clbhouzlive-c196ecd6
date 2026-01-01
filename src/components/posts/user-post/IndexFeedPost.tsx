import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMediaAutoplay } from '@/media';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { UserPostData, GolfCourse } from './types';
import { UserInfoOverlay } from './overlays/UserInfoOverlay';

import { CaptionOverlay } from './overlays/CaptionOverlay';
import { InteractionIconsOverlay } from './overlays/InteractionIconsOverlay';
import { MediaNavigationDots } from './overlays/MediaNavigationDots';
import { MediaContainer } from './MediaContainer';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenPostNavigation } from '@/hooks/useFullscreenPostNavigation';
import { AchievementBadgesOverlay } from '@/components/post/badges/AchievementBadgesOverlay';


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
  const [shouldResumeOnReturn, setShouldResumeOnReturn] = useState(false);
  const { user } = useSupabaseSession();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const isMobile = useIsMobile();
  
  // Unified media autoplay system
  const mediaId = `index-${post.id}`;
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'feed',
    startThreshold: 0.4,
    stopThreshold: 0.35,
  });
  
  const isPlaying = playingIds.has(mediaId);
  
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

  const handleMaximizeClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMediaMemo) return;
    
    let videoPosition = 0;
    let videoMuted = true;
    
    // Store current state and get current position for videos
    if (currentMediaMemo.media_type === 'video') {
      const videoId = `index-${currentMediaMemo.id}`;
      const video = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLVideoElement;
      
      if (video) {
        videoPosition = video.currentTime;
        videoMuted = video.muted;
      }
      
      setShouldResumeOnReturn(true);
    }
    
    const mediaUrls = post.post_media.map(m => m.media_url);
    const mediaTypes = post.post_media.map(m => m.media_type as 'image' | 'video');
    const filterIds = post.post_media.map(m => m.filter_id ?? null);
    const studioEdits = post.post_media.map(m => m.studio_edits ?? null);
    
    // Open with post navigation enabled, passing current video position and mute state
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
      post.user.id, // Pass user ID for fetching other posts
      videoPosition, // Pass current video position
      videoMuted // Pass current mute state
    );
  }, [currentMediaIndex, currentMediaMemo, post, golfCourse, displayName, openFullscreenMedia]);

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
          golfCourse={golfCourse}
          source="index"
        />

        {/* Achievement Badges overlay - top left below user info */}
        <AchievementBadgesOverlay badgeIds={post.badges} className="top-14 left-2" />

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

      {/* Enhanced Fullscreen Modal with Post Navigation */}
      <FullscreenMediaModal
        isOpen={isFullscreenOpen}
        onClose={(videoPosition, videoMuted) => {
          // Handle video resume on modal close
          if (shouldResumeOnReturn && currentMediaMemo) {
            if (currentMediaMemo.media_type === 'video') {
              const videoId = `index-${currentMediaMemo.id}`;
              const video = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLVideoElement;
              
              if (video && videoPosition !== undefined) {
                // Set the video to the position and mute state from the modal
                video.currentTime = videoPosition;
                if (videoMuted !== undefined) {
                  video.muted = videoMuted;
                  // Update global audio state to match the video's new mute state
                  setGlobalMute(videoMuted);
                }
                console.log('▶️ Resumed video from modal position:', videoPosition, 'muted:', videoMuted);
              }
            }
            setShouldResumeOnReturn(false);
          }
          closeFullscreenMedia();
        }}
        mediaUrl={currentMedia?.mediaUrls || []}
        mediaType={currentMedia?.mediaTypes || []}
        alt={currentMedia?.items?.[currentMedia?.initialIndex ?? 0]?.alt}
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
        initialVideoPosition={currentMedia?.videoPosition}
        initialVideoMuted={currentMedia?.videoMuted}
        filterIds={currentMedia?.filterIds}
        studioEdits={currentMedia?.studioEdits}
        postId={post.id}
        onPostDeleted={() => {
          onDeletePost?.();
          closeFullscreenMedia();
        }}
        onPostEdit={(postId) => {
          // TODO: Implement edit functionality 
          console.log('Edit post:', postId);
          closeFullscreenMedia();
        }}
      />
    </div>
  );
};

// Memoized export for performance
export const IndexFeedPost = memo(IndexFeedPostComponent);
