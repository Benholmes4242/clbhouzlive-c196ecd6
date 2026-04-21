/**
 * TrendingCard - Trending video carousel
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { TrendingUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import { HiOutlineArrowSmLeft, HiOutlineArrowSmRight } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import { useTrendingCard } from '@/hooks/useTrendingCard';
import { useFullscreenVideoModal } from '@/hooks/useFullscreenVideoModal';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import PostContentWithTags from '@/components/posts/PostContentWithTags';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const TrendingCard = () => {
  const { trendingPosts, loading, nextSlide, prevSlide, currentIndex, totalPosts } = useTrendingCard();
  const navigate = useNavigate();
  const modalManager = useFullscreenVideoModal();

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  if (loading || trendingPosts.length === 0) {
    return (
      <div className="px-1 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="w-full aspect-[3/4] bg-muted animate-pulse" />
          <div className="w-full aspect-[3/4] bg-muted animate-pulse hidden md:block" />
          <div className="w-full aspect-[3/4] bg-muted animate-pulse hidden md:block" />
        </div>
      </div>
    );
  }

  // Component to render a single trending card
  const TrendingCardItem = ({ post, index }) => {
    const media = post.post_media || [];
    const videoMedia = media.filter(m => m.media_type === 'video');
    const user = post.user_profiles;
    
    if (videoMedia.length === 0) return null;

    // Only show the first video, no carousel functionality for trending cards
    const firstVideo = videoMedia[0];
    const isMobile = window.innerWidth < 768;
    
    // Visibility-based autoplay (40% threshold)
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setIsVisible(entry.intersectionRatio >= 0.4);
        },
        { threshold: [0, 0.4, 0.5, 1.0] }
      );
      
      if (cardRef.current) {
        observer.observe(cardRef.current);
      }
      
      return () => observer.disconnect();
    }, []);
    
    const shouldShowPlayIcon = !isVisible;

    const handleVideoClick = () => {
      if (isMobile) {
        // Mobile: videos auto-manage via intersection observer
      } else {
        // Desktop: open fullscreen modal
        modalManager.openModal({
          src: firstVideo.media_url,
          user: {
            id: user?.id || post.id,
            profile_photo_url: user?.profile_photo_url || undefined,
            display_name: user?.display_name || undefined,
            username: user?.username || undefined
          },
          content: post.content || undefined
        });
      }
    };
    
    return (
      <div 
        ref={cardRef}
        className="relative w-full aspect-[3/4] overflow-hidden bg-card group" 
        onClick={handleVideoClick}
      >

        {/* Trending Icon - top right */}
        <div className="absolute top-2 right-2 z-10">
          <button className="p-1.5 text-white hover:bg-white/20 transition-colors">
            <TrendingUp className="w-6 h-6" />
          </button>
        </div>

        {/* Video Icon - top left (shows when paused) */}
        {shouldShowPlayIcon && (
          <div className="absolute top-2 left-2 z-10">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-white bg-black/50 hover:bg-black/70 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Single Video - UNIFIED WITH CLUBHOUSE */}
        <div className="relative w-full h-full">
          <EnhancedVideoPlayer
            src={firstVideo.media_url}
            className="w-full h-full object-cover"
            autoplay={isVisible}
            muted={true}
            loop={true}
            enableHLS={true}
            onClick={handleVideoClick}
            onPlay={() => {}}
            onPause={() => {}}
          />
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
                  <div className="flex items-end gap-2 mb-1">
                    <SquircleAvatar
                      src={user?.profile_photo_url}
                      alt={user?.display_name || user?.username || 'User'}
                      userId={user?.id}
                      size={48}
                      hideRing
                    />
                    <p className="text-white font-bold text-base truncate">
                      {user?.display_name || user?.username}
                    </p>
                  </div>
                  {post.content && (() => {
                    // Filter out golf club tags from content
                    let filteredContent = post.content;
                    if (post.post_tags) {
                      post.post_tags.forEach(tag => {
                        if (tag.taggable_entities?.entity_type === 'golf_club') {
                          // Remove the tagged text using start and end indices
                          const tagText = filteredContent.substring(tag.start_index, tag.end_index);
                          filteredContent = filteredContent.replace(tagText, '');
                        }
                      });
                    }
                    
                    // Remove golf course patterns but keep @mentions
                    filteredContent = filteredContent
                      .replace(/\s*Played at[^.]*\.?\s*/gi, '')
                      .replace(/\s+/g, ' ')
                      .trim();

                    // Build mentionable tags for PostContentWithTags
                    const mentionTags = (post.post_tags || [])
                      .filter((tag: any) => {
                        const entityType = tag.taggable_entities?.entity_type || tag.entity_type;
                        return entityType === 'user' || entityType === 'business';
                      })
                      .map((tag: any) => ({
                        id: tag.id,
                        entity_type: tag.taggable_entities?.entity_type || tag.entity_type,
                        entity_id: tag.taggable_entities?.entity_id || tag.entity_id,
                        name: tag.taggable_entities?.name || tag.name || 'Unknown',
                        username: tag.taggable_entities?.username || tag.username || null,
                        start_index: tag.start_index ?? 0,
                        end_index: tag.end_index ?? 0,
                      }));
                    
                    return filteredContent ? (
                      <>
                        {/* Default truncated text */}
                        <PostContentWithTags
                          content={filteredContent}
                          tags={mentionTags}
                          className="text-white/90 text-sm mt-1 line-clamp-2 group-hover:hidden"
                        />
                        {/* Full text on hover (desktop only) */}
                        <PostContentWithTags
                          content={filteredContent}
                          tags={mentionTags}
                          className="text-white/90 text-sm mt-1 hidden group-hover:block md:group-hover:block"
                        />
                      </>
                    ) : null;
                  })()}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-2">
                  <button className="p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiHandsClapping className="w-6 h-6" />
                  </button>
                  <button className="p-1.5 text-white hover:bg-white/20 transition-colors">
                    <GoCommentDiscussion className="w-6 h-6" />
                  </button>
                  <button className="p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiShareFat className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-1 mb-6 relative">
      {/* Mobile: Swipeable single card with navigation arrows */}
      <div className="md:hidden" {...swipeHandlers}>
        <div className="relative">
          <TrendingCardItem post={trendingPosts[0]} index={0} />
          
          {/* Mobile Navigation Arrows */}
          {totalPosts > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Desktop: Show three cards with navigation */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="grid grid-cols-3 gap-2">
            {trendingPosts.slice(0, 3).map((post, index) => (
              <TrendingCardItem key={`${post.id}-${currentIndex + index}`} post={post} index={index} />
            ))}
          </div>
          
          {/* Desktop Navigation Arrows */}
          {totalPosts > 3 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        isOpen={modalManager.isOpen}
        onClose={modalManager.closeModal}
        videoData={modalManager.videoData}
      />
    </div>
  );
};

export default TrendingCard;
