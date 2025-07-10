import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share, VolumeX, Volume2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { formatDistanceToNow } from 'date-fns';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import HighQualityImage from '@/components/ui/high-quality-image';
import VideoPlayer from '@/components/ui/video-player';
import CoursePostBadge from './CoursePostBadge';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags?: any[];
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  };
}

interface IndexFeedPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPost: PostData;
  allUserPosts: PostData[];
}

const IndexFeedPostModal: React.FC<IndexFeedPostModalProps> = ({
  isOpen,
  onClose,
  initialPost,
  allUserPosts
}) => {
  const { user } = useSupabaseSession();
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const isMobile = useIsMobile();
  
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Initialize post index
  useEffect(() => {
    const index = allUserPosts.findIndex(post => post.id === initialPost.id);
    setCurrentPostIndex(index >= 0 ? index : 0);
  }, [initialPost.id, allUserPosts]);

  const currentPost = allUserPosts[currentPostIndex] || initialPost;
  const displayName = currentPost.user.display_name || currentPost.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true });

  // Extract golf course from post
  const getGolfCourse = () => {
    if (currentPost.golfCourse) {
      return currentPost.golfCourse;
    }
    
    const golfCourseTag = currentPost.post_tags?.find(tag => 
      tag.entity_type === 'golf_club' || tag.tagged_entity?.entity_type === 'golf_club'
    );
    
    if (golfCourseTag) {
      if (golfCourseTag.entity_type === 'golf_club') {
        return {
          id: golfCourseTag.entity_id,
          name: golfCourseTag.name,
          country: '',
          region: ''
        };
      }
      if (golfCourseTag.tagged_entity) {
        return {
          id: golfCourseTag.tagged_entity.entity_id,
          name: golfCourseTag.tagged_entity.name,
          country: '',
          region: ''
        };
      }
    }
    
    return null;
  };

  const golfCourse = getGolfCourse();

  // Navigation handlers
  const navigatePost = useCallback((direction: 'prev' | 'next') => {
    let newIndex = currentPostIndex;
    
    if (direction === 'next' && currentPostIndex < allUserPosts.length - 1) {
      newIndex = currentPostIndex + 1;
      setIsAtEnd(false);
    } else if (direction === 'prev' && currentPostIndex > 0) {
      newIndex = currentPostIndex - 1;  
      setIsAtEnd(false);
    } else if (direction === 'next' && currentPostIndex === allUserPosts.length - 1) {
      setIsAtEnd(true);
      setTimeout(() => setIsAtEnd(false), 2000);
      return;
    }
    
    setCurrentPostIndex(newIndex);
    setCurrentMediaIndex(0);
  }, [currentPostIndex, allUserPosts.length]);

  const navigateMedia = useCallback((direction: 'prev' | 'next') => {
    const mediaCount = currentPost.post_media?.length || 0;
    if (mediaCount <= 1) return;

    if (direction === 'next' && currentMediaIndex < mediaCount - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else if (direction === 'prev' && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  }, [currentMediaIndex, currentPost.post_media]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigateMedia('next'),
    onSwipedRight: () => navigateMedia('prev'),
    onSwipedUp: () => navigatePost('next'),
    onSwipedDown: () => navigatePost('prev'),
    preventScrollOnSwipe: true,
    trackMouse: !isMobile,
  });

  // Keyboard navigation
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'ArrowLeft') navigateMedia('prev');
    if (e.key === 'ArrowRight') navigateMedia('next');
    if (e.key === 'ArrowUp') navigatePost('prev');
    if (e.key === 'ArrowDown') navigatePost('next');
    if (e.key === 'Escape') onClose();
  }, [isOpen, navigateMedia, navigatePost, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Handle interaction clicks
  const handleInteractionClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    // Handle interaction logic here
    console.log(`${type} clicked`);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGlobalMute();
  };

  const currentMedia = currentPost.post_media?.[currentMediaIndex];
  const cleanContent = removeGolfCourseFromContent(currentPost.content);

  if (!isOpen || !currentMedia) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-black z-[9999] flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
      {...swipeHandlers}
    >
      {/* Back Button - Top Left */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* Media Container - Square Layout */}
      <div className="relative w-full max-w-[1000px] aspect-square">
        {currentMedia.media_type === 'video' ? (
          <VideoPlayer
            src={currentMedia.media_url}
            autoplay={true}
            loop={true}
            className="w-full h-full object-cover"
            showOverlayControls={false}
            showMuteButton={false}
            isInFeed={true}
            videoId={`modal-${currentMedia.id}`}
          />
        ) : (
          <HighQualityImage
            src={currentMedia.media_url}
            alt="Post content"
            className="w-full h-full object-cover"
          />
        )}

        {/* Top Left - Profile Info (Same styling as index page) */}
        <div className="absolute top-3 left-3 z-10 flex items-center">
          <HighQualityImage
            src={currentPost.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
            alt={displayName}
            className="w-16 h-16 rounded-full mr-2"
            width={64}
            height={64}
          />
          <span 
            className="text-white text-base font-bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {displayName}
          </span>
        </div>

        {/* Top Right - Golf Course Tag (Same styling as index page) */}
        {golfCourse && (
          <div className="absolute top-3 right-3 z-10">
            <CoursePostBadge 
              course={{
                id: golfCourse.id,
                name: golfCourse.name,
                country: golfCourse.country,
                region: golfCourse.region
              }}
              className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
            />
          </div>
        )}

        {/* Bottom Left - Caption Text (Moved up more to avoid overlapping dots) */}
        {cleanContent && (
          <div className="absolute bottom-10 left-3 right-20 z-10 max-w-[70%] group">
            <div 
              className="text-white text-base font-bold leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-200"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {cleanContent}
            </div>
          </div>
        )}

        {/* Bottom Right - Action Icons */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-3">
          {/* Mute/Unmute Button */}
          {currentMedia.media_type === 'video' && (
            <button 
              className="text-white hover:scale-110 transition-transform"
              onClick={handleMuteToggle}
              title={isGloballyMuted ? "Unmute" : "Mute"}
            >
              {isGloballyMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          )}
          
          {/* Like Button */}
          <button 
            className="text-white hover:scale-110 transition-transform"
            onClick={(e) => handleInteractionClick(e, 'like')}
          >
            <Heart className="w-6 h-6" />
          </button>
          
          {/* Comment Button */}
          <button 
            className="text-white hover:scale-110 transition-transform"
            onClick={(e) => handleInteractionClick(e, 'comment')}
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          
          {/* Share Button */}
          <button 
            className="text-white hover:scale-110 transition-transform"
            onClick={(e) => handleInteractionClick(e, 'share')}
          >
            <Share className="w-6 h-6" />
          </button>
        </div>

        {/* Media Navigation Dots - Bottom of square, under post text */}
        {(currentPost.post_media?.length || 0) > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {currentPost.post_media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* End of posts indicator */}
      {isAtEnd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-white text-sm">You've reached the end of this user's posts</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexFeedPostModal;