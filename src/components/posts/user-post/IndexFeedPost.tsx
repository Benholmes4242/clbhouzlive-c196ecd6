import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
  const { muteAllOtherVideos, setActiveAudioVideo, pauseVideo } = useVideoPlaybackManager();
  const { isGloballyMuted } = useGlobalAudio();
  const isMobile = useIsMobile();
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.45, // Autoplay when 45% of video is visible (within 40-50% range)
    rootMargin: '0px'
  });

  // Check if this is the user's own post
  const isOwnPost = user?.id === post.user.id;

  useEffect(() => {
    console.log('🎬 IndexFeedPost: isInView changed:', isInView, 'currentMediaIndex:', currentMediaIndex, 'mediaType:', post.post_media?.[currentMediaIndex]?.media_type);
    
    const currentMedia = post.post_media?.[currentMediaIndex];
    if (!currentMedia) return;
    
    if (isInView && currentMedia.media_type === 'video') {
      console.log('🎬 Setting isHovered to true for video autoplay');
      setIsHovered(true);
    } else {
      console.log('🎬 Setting isHovered to false');
      setIsHovered(false);
      
      // When video goes out of view, pause it directly and clear audio
      if (currentMedia.media_type === 'video') {
        const videoId = `index-${currentMedia.id}`;
        console.log('🎬 Video out of view, pausing video:', videoId);
        pauseVideo(videoId);
      }
    }
  }, [isInView, currentMediaIndex, post.post_media, pauseVideo]);

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
    // On desktop, the full tag is always shown, so clicking navigates to course
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

  const handleMaximizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentMedia = post.post_media[currentMediaIndex];
    onMediaClick(currentMedia.media_url, currentMedia.media_type);
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
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
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
    </div>
  );
};