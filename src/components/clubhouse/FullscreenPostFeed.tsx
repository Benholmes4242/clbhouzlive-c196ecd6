import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Volume2, VolumeX, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { ExploreContentItem } from '@/components/explore/types';
import MediaDisplay from '@/components/explore/MediaDisplay';
import { QuickReactionButton } from './QuickReactionButton';
import { usePostReactions } from '@/hooks/usePostReactions';

interface FullscreenPostFeedProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onMediaClick: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const FullscreenPostFeed: React.FC<FullscreenPostFeedProps> = ({ 
  content, 
  onLike, 
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [commentText, setCommentText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { getUserReaction, handleReaction } = usePostReactions();
  const currentPost = content[currentIndex];

  // Navigate to next/previous post
  const goToNext = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Removed global touchmove preventDefault to allow native gestures in WKWebView
  useEffect(() => {
    // Intentionally left blank
  }, []);

  // Swipe handlers with exclusion for right action bar
  const swipeHandlers = useSwipeable({
    onSwipedUp: (eventData) => {
      // Don't handle swipe if it started from the right action area
      if (eventData.event.target && (eventData.event.target as Element).closest('.right-action-bar')) {
        return;
      }
      goToNext();
    },
    onSwipedDown: (eventData) => {
      // Don't handle swipe if it started from the right action area
      if (eventData.event.target && (eventData.event.target as Element).closest('.right-action-bar')) {
        return;
      }
      goToPrevious();
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false }
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Truncate caption
  const truncateCaption = (text: string, maxLength: number = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Mock comments data
  const mockComments = [
    {
      id: '1',
      user: { name: 'Alex Johnson', avatar: '/placeholder.svg' },
      text: 'Amazing shot! 🔥',
      timestamp: '2h'
    }
  ];

  if (!currentPost) {
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentIndex === content.length - 2) { // Load more when near the end
      const sentinel = document.getElementById('scroll-sentinel');
      if (sentinel) {
        observer.observe(sentinel);
      }
    }

    return () => observer.disconnect();
  }, [currentIndex, content.length, hasMore, isLoading, onLoadMore]);

  return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No posts available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      {...swipeHandlers}
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Main Media Content */}
      <div className="absolute inset-0">
        <MediaDisplay
          media={{
            id: currentPost.id,
            media_type: currentPost.type as 'video' | 'image',
            media_url: currentPost.src
          }}
          itemTitle={currentPost.title}
          shouldAutoplay={true}
          isLoading={false}
          onImageError={() => {}}
          onImageLoad={() => {}}
          itemId={currentPost.id}
          currentIndex={currentIndex}
          loop={true}
          muted={isMuted}
        />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`p-0 rounded-full bg-white/20 backdrop-blur-sm text-white ${
            currentIndex === 0 ? 'opacity-50' : 'hover:bg-white/30'
          }`}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === content.length - 1}
          className={`p-0 rounded-full bg-white/20 backdrop-blur-sm text-white ${
            currentIndex === content.length - 1 ? 'opacity-50' : 'hover:bg-white/30'
          }`}
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Right-hand Action Bar */}
      <div className="right-action-bar absolute right-4 bottom-20 flex flex-col gap-4 z-20">
        {/* Mute/Unmute Toggle */}
        {currentPost.type === 'video' && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        
        {/* Emoji Reaction Button */}
        <QuickReactionButton
          postId={currentPost.id}
          userReaction={getUserReaction(currentPost.id)}
          onReact={handleReaction}
        />
        
        {/* Comment Button */}
        <button
          onClick={() => onMediaClick(currentPost)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 relative"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            24
          </span>
        </button>
        
        {/* Share Button */}
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70">
          <Send className="w-5 h-5" />
        </button>
        
        {/* More Options */}
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6 z-10">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentPost.user?.avatar || '/placeholder.svg'}
            alt={currentPost.user?.name || 'User'}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-base truncate">
                {currentPost.user?.name || currentPost.user?.username || 'Anonymous'}
              </p>
              <span className="text-white/60 text-sm">2h</span>
            </div>
            {currentPost.golfCourse && (
              <p className="text-white/80 text-sm truncate">
                📍 {currentPost.golfCourse.name}
              </p>
            )}
          </div>
          <button className="p-2">
            <MoreHorizontal className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Caption */}
        {currentPost.title && (
          <div className="mb-3">
            <p className="text-white text-sm leading-5">
              {truncateCaption(currentPost.title)}
              {currentPost.title.length > 80 && (
                <button className="text-white/60 ml-1">more</button>
              )}
            </p>
          </div>
        )}


        {/* Recent Comment */}
        {mockComments.length > 0 && (
          <div className="mb-3">
            <div className="flex items-start gap-2">
              <img
                src={mockComments[0].user.avatar}
                alt={mockComments[0].user.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">
                  <span className="font-medium">{mockComments[0].user.name}</span>
                  <span className="ml-2">{mockComments[0].text}</span>
                </p>
              </div>
              <span className="text-white/60 text-xs">{mockComments[0].timestamp}</span>
            </div>
            <button className="text-white/60 text-sm mt-1 ml-8">
              View all 24 comments
            </button>
          </div>
        )}

        {/* Add Comment */}
        <div className="flex items-center gap-3">
          <img
            src="/placeholder.svg"
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-transparent text-white placeholder-white/60 text-sm border-none outline-none"
            />
          </div>
          {commentText && (
            <button className="text-blue-400 text-sm font-medium">
              Post
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default FullscreenPostFeed;