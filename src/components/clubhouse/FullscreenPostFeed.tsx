import React, { useState, useEffect, useRef } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { ChevronUp, ChevronDown, Volume2, VolumeX, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { ExploreContentItem } from '@/components/explore/types';
import MediaDisplay from '@/components/explore/MediaDisplay';
import { QuickReactionButton } from './QuickReactionButton';
import { usePostReactions } from '@/hooks/usePostReactions';

import { FullscreenReviewPost, ReviewMediaItem } from '@/components/posts/FullscreenReviewPost';

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

  // Check if current post is a review post (only if linked to actual review)
  const isReviewPost = currentPost?.isReview || !!currentPost?.sourceReviewId;

  // Format location string for review posts
  const formatLocation = (course?: ExploreContentItem['golfCourse']) => {
    if (!course) return '';
    const parts = [course.sub_country || course.region, course.country].filter(Boolean);
    return parts.join(', ');
  };

  // Transform media for FullscreenReviewPost
  const reviewMedia: ReviewMediaItem[] = currentPost?.media?.map(m => ({
    id: m.id,
    media_type: m.media_type,
    media_url: m.media_url,
    poster_url: (m as any).poster_url,
    display_order: (m as any).display_order,
  })) || [];

  // Check if current media has video type
  const hasVideoMedia = currentPost.media?.some(m => m.media_type === 'video');
  
  // Action bar component - reused for both review and regular posts
  // pointer-events-auto ensures buttons work even when parent has pointer-events-none
  const ActionBar = () => (
    <div className="right-action-bar absolute right-4 bottom-24 flex flex-col gap-3 z-40 pointer-events-auto">
      {/* Mute/Unmute Toggle */}
      {(currentPost.type === 'video' || hasVideoMedia) && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md bg-black/35 border border-white/10 text-white hover:bg-black/50 transition-colors"
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
        className="w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md bg-black/35 border border-white/10 text-white hover:bg-black/50 transition-colors relative"
      >
        <MessageCircle className="w-5 h-5" />
        {(currentPost.comments ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {currentPost.comments}
          </span>
        )}
      </button>
      
      {/* Share Button */}
      <button className="w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md bg-black/35 border border-white/10 text-white hover:bg-black/50 transition-colors">
        <Send className="w-5 h-5" />
      </button>
      
      {/* More Options */}
      <button className="w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md bg-black/35 border border-white/10 text-white hover:bg-black/50 transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );

  // Navigation controls - positioned on left to avoid action bar conflict
  const NavigationControls = () => (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30 pointer-events-auto">
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white transition-all ${
          currentIndex === 0 ? 'opacity-30 pointer-events-none' : 'hover:bg-black/60'
        }`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        disabled={currentIndex === content.length - 1}
        className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white transition-all ${
          currentIndex === content.length - 1 ? 'opacity-30 pointer-events-none' : 'hover:bg-black/60'
        }`}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );

  // Render review post with FullscreenReviewPost
  if (isReviewPost) {
    return (
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black"
        {...swipeHandlers}
        style={{ overscrollBehavior: 'none' }}
      >
        <FullscreenReviewPost
          mode="live"
          courseId={currentPost.golfCourse?.id || ''}
          courseName={currentPost.golfCourse?.name || 'Course'}
          heroSubtitle={formatLocation(currentPost.golfCourse)}
          rating={currentPost.reviewRating ?? 0}
          reviewText={(currentPost as any).review?.reviewText ?? null}
          reviewId={(currentPost as any).sourceReviewId || currentPost.id}
          media={reviewMedia}
          initialIndex={0}
        >
          {/* Navigation + Action bar rendered as children */}
          <NavigationControls />
          <ActionBar />
        </FullscreenReviewPost>
      </div>
    );
  }

  // Regular post rendering (existing code)
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
          studioEdits={currentPost.media?.[0]?.studio_edits}
        />
      </div>

      {/* Navigation Arrows */}
      <NavigationControls />

      {/* Right-hand Action Bar */}
      <ActionBar />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6 z-10">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentPost.user?.avatar || '/placeholder.svg'}
            alt={currentPost.user?.name || 'User'}
            className="w-11 h-11 rounded-full object-cover shadow-sm"
          />
          <div className="flex flex-col leading-tight flex-1 min-w-0">
            <span className="text-body-md font-medium text-white drop-shadow-sm truncate">
              {currentPost.user?.name || currentPost.user?.username || 'Anonymous'}
            </span>
            {currentPost.golfCourse && (
              <span className="text-body-md text-white/85 leading-snug truncate">
                📍 {currentPost.golfCourse.name}
              </span>
            )}
          </div>
          <button className="p-2">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Caption */}
        {currentPost.title && (
          <div className="mb-3">
            <p className="text-[14px] text-white/85 leading-snug">
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