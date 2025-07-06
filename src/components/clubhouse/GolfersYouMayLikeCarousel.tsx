import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { useNavigate } from 'react-router-dom';
import { useGolfersYouMayLike } from './hooks/useGolfersYouMayLike';
import { useIsMobile } from '@/hooks/use-mobile';
import HighQualityImage from '@/components/ui/high-quality-image';

interface GolferProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  most_recent_video: {
    id: string;
    media_url: string;
    post_id: string;
    created_at: string;
  };
  is_following: boolean;
}

const GolfersYouMayLikeCarousel = () => {
  const { user: currentUser } = useSupabaseSession();
  const { golfers, loading, loadMore, hasMore } = useGolfersYouMayLike();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handle infinite scroll
  const handleScroll = () => {
    if (!carouselRef.current || !hasMore || loading) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    if (scrollLeft + clientWidth >= scrollWidth - 100) {
      loadMore();
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading]);

  if (loading && golfers.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Golfers you may like</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: isMobile ? 2 : 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-lg h-80 animate-pulse flex-shrink-0" 
                 style={{ width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (golfers.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Golfers you may like</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No suggested video content yet – follow more golfers to discover their moments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Golfers you may like</h2>
      </div>
      
      <div 
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {golfers.map((golfer) => (
          <GolferCard 
            key={golfer.id}
            golfer={golfer}
            currentUserId={currentUser?.id}
            isMobile={isMobile}
          />
        ))}
        
        {loading && (
          <div className="bg-muted rounded-lg h-80 animate-pulse flex-shrink-0" 
               style={{ width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)' }} />
        )}
      </div>
    </div>
  );
};

interface GolferCardProps {
  golfer: GolferProfile;
  currentUserId?: string;
  isMobile: boolean;
}

const GolferCard: React.FC<GolferCardProps> = ({ golfer, currentUserId, isMobile }) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { handleFollow } = useProfileActions({
    targetUserId: golfer.id,
    currentUserId: currentUserId || ''
  });

  const displayName = golfer.display_name || golfer.username || 'User';
  const username = golfer.username || `user_${golfer.id.slice(0, 8)}`;

  // Video control logic - separate for mobile and desktop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !golfer.most_recent_video?.media_url) return;

    let observer: IntersectionObserver | null = null;

    if (isMobile) {
      // Mobile: autoplay based on intersection
      observer = new IntersectionObserver(
        ([entry]) => {
          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          setIsInView(isVisible);
          
          if (isVisible && !isHovered) { // Don't conflict with hover
            video.currentTime = 0;
            video.play().catch(() => {
              // Silent fail for autoplay prevention
            });
          } else if (!isVisible) {
            video.pause();
          }
        },
        { 
          threshold: 0.5,
          rootMargin: '50px'
        }
      );

      const card = cardRef.current;
      if (card) {
        observer.observe(card);
      }
    } else {
      // Desktop: autoplay based on hover only
      if (isHovered) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Silent fail for autoplay prevention
        });
      } else {
        video.pause();
      }
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [golfer.most_recent_video?.media_url, isMobile, isHovered]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || currentUserId === golfer.id) return;
    
    await handleFollow(golfer.is_following);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${username}`);
  };

  // Generate poster image from profile photo or use default
  const posterImage = golfer.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face';

  return (
    <div 
      ref={cardRef}
      className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 snap-start carousel-card"
      style={{ width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)' }}
    >
      {/* Video Background */}
      <div 
        className="w-full h-80 relative"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {golfer.most_recent_video?.media_url ? (
          <>
            {/* Always show poster image as background */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${posterImage})` }}
            />
            <video
              ref={videoRef}
              src={golfer.most_recent_video.media_url}
              poster={posterImage}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ 
                opacity: isMobile 
                  ? (isInView ? 1 : 0)  // Mobile: show when in view
                  : (isHovered ? 1 : 0) // Desktop: show only on hover
              }}
              autoPlay={false}
              muted
              loop
              playsInline
              preload={isMobile ? "metadata" : "auto"}
              onError={(e) => {
                // Keep video hidden on error to show poster background
                if (videoRef.current) {
                  videoRef.current.style.opacity = '0';
                }
              }}
            />
          </>
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat flex items-center justify-end flex-col pb-4"
            style={{ backgroundImage: `url(${posterImage})` }}
          >
            <div className="bg-black/50 text-white text-sm px-3 py-1 rounded">
              No video available
            </div>
          </div>
        )}
        
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* User info overlay - Top */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex items-center gap-3">
            <HighQualityImage 
              src={golfer.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
              alt={displayName} 
              className="w-10 h-10 rounded-full border-2 border-white cursor-pointer hover:border-white/80 transition-colors flex-shrink-0" 
              width={40}
              height={40}
              onClick={handleProfileClick}
            />
            <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100% - 52px)' }}>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 
                      className="text-white font-semibold text-sm cursor-pointer hover:text-white/80 transition-colors"
                      onClick={handleProfileClick}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2',
                        display: 'block',
                        width: '100%'
                      }}
                    >
                      {displayName}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block">
                    <p>{displayName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="text-white/80 text-xs cursor-pointer hover:text-white/60 transition-colors"
                      onClick={handleProfileClick}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%'
                      }}
                    >
                      @{username}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block">
                    <p>@{username}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        {/* Follow Button - Bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          {currentUserId && currentUserId !== golfer.id && (
            <Button 
              size="sm" 
              variant={golfer.is_following ? "secondary" : "default"}
              className={`w-full text-sm font-medium ${
                golfer.is_following 
                  ? "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                  : "bg-white text-black hover:bg-white/90"
              }`}
              onClick={handleFollowClick}
            >
              {golfer.is_following ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GolfersYouMayLikeCarousel;