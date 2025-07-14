import React, { useState } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import { HiOutlineArrowSmLeft, HiOutlineArrowSmRight } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import { useTrendingCard } from '@/hooks/useTrendingCard';

const TrendingCard = () => {
  const { trendingPosts, loading, nextSlide, prevSlide, currentIndex, totalPosts } = useTrendingCard();

  console.log('TrendingCard render - loading:', loading, 'trendingPosts:', trendingPosts.length);

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
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse" />
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse hidden md:block" />
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse hidden md:block" />
        </div>
      </div>
    );
  }

  // Component to render a single trending card
  const TrendingCardItem = ({ post, index }) => {
    const navigate = useNavigate();
    const media = post.post_media || [];
    const videoMedia = media.filter(m => m.media_type === 'video');
    const user = post.user_profiles;
    
    if (videoMedia.length === 0) return null;

    // Only show the first video, no carousel functionality for trending cards
    const firstVideo = videoMedia[0];
    
    // Find golf course tag
    const golfCourseTag = post.post_tags?.find(tag => 
      tag.taggable_entities?.entity_type === 'golf_club'
    )?.taggable_entities;

    const handleGolfClubClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (golfCourseTag) {
        navigate(`/courses/${golfCourseTag.entity_id}`);
      }
    };

    return (
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-card border group">
        {/* Golf Course Tag - top left */}
        {golfCourseTag && (
          <div className="absolute top-2 left-2 z-10">
            <button 
              onClick={handleGolfClubClick}
              className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-white/90 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-gray-700" />
              <span className="text-gray-900 text-sm font-medium truncate max-w-[120px]">
                {golfCourseTag.name}
              </span>
            </button>
          </div>
        )}

        {/* Trending Pill - top right */}
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Trending</span>
          </div>
        </div>

        {/* Single Video - No Carousel */}
        <div className="relative w-full h-full">
          <video
            src={firstVideo.media_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
                  <div className="flex items-end gap-2 mb-1">
                    <img
                      src={user?.profile_photo_url || '/placeholder.svg'}
                      alt={user?.display_name || user?.username || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <p className="text-white font-bold text-base truncate">
                      {user?.display_name || user?.username}
                    </p>
                  </div>
                  {post.content && (
                    <>
                      {/* Default truncated text */}
                      <p className="text-white/90 text-sm mt-1 line-clamp-2 group-hover:hidden">
                        {post.content}
                      </p>
                      {/* Full text on hover (desktop only) */}
                      <p className="text-white/90 text-sm mt-1 hidden group-hover:block md:group-hover:block">
                        {post.content}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-2">
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiHandsClapping className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <GoCommentDiscussion className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
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
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white hover:bg-white/20 transition-colors z-20"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white hover:bg-white/20 transition-colors z-20"
              >
                <HiOutlineArrowSmRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingCard;