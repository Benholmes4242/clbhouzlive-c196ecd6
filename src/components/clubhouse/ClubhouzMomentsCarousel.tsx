import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FollowButton from '@/components/profile/actions/FollowButton';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

interface MomentCardProps {
  moment: {
    id: string;
    user: {
      id: string;
      display_name: string | null;
      username: string | null;
      profile_photo_url: string | null;
    };
    post_media: {
      id: string;
      media_type: 'image' | 'video';
      media_url: string;
    }[];
    post_tags: {
      id: string;
      entity_type: 'user' | 'golf_club' | 'business';
      name: string;
    }[];
  };
  currentUserId: string;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, currentUserId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { loading, handleFollow } = useProfileActions({
    targetUserId: moment.user.id,
    currentUserId: currentUserId
  });

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', currentUserId, moment.user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', moment.user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentUserId && !!moment.user.id && currentUserId !== moment.user.id,
  });

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      
      const playVideo = async () => {
        try {
          await video.play();
        } catch (error) {
          console.log('Video autoplay failed:', error);
        }
      };
      
      playVideo();
    }
  }, []);

  const videoMedia = moment.post_media.find(media => media.media_type === 'video');
  const imageMedia = moment.post_media.find(media => media.media_type === 'image');
  const mediaToShow = videoMedia || imageMedia;
  
  const golfCourseTag = moment.post_tags.find(tag => tag.entity_type === 'golf_club');

  const handleFollowClick = async () => {
    await handleFollow(isFollowing);
    setIsFollowing(!isFollowing);
  };

  if (!mediaToShow) return null;

  return (
    <div className="relative bg-card rounded-xl overflow-hidden shadow-sm border group">
      {/* Media Container */}
      <div className="relative aspect-[3/4] bg-muted">
        {videoMedia ? (
          <video
            ref={videoRef}
            src={mediaToShow.media_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={mediaToShow.media_url}
            alt="Moment"
            className="w-full h-full object-cover hq-image"
          />
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-3">
          {/* Top Section - User Info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border-2 border-white/20">
              {moment.user.profile_photo_url ? (
                <img
                  src={moment.user.profile_photo_url}
                  alt={moment.user.display_name || moment.user.username || 'User'}
                  className="w-full h-full object-cover hq-image"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-medium">
                    {(moment.user.display_name || moment.user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {moment.user.display_name || moment.user.username || 'User'}
              </p>
              {moment.user.username && (
                <p className="text-white/80 text-xs truncate">
                  @{moment.user.username}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Section - Golf Course Tag & Follow Button */}
          <div className="space-y-2">
            {golfCourseTag && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 self-start cursor-default max-w-[160px]">
                      <p className="text-white text-xs font-medium truncate">
                        {golfCourseTag.name}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top"
                    className="hidden md:block bg-gray-900 text-white border-gray-700 shadow-lg rounded-md px-2 py-1 text-xs max-w-[200px] z-[300]"
                  >
                    {golfCourseTag.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {currentUserId !== moment.user.id && (
              <div className="flex justify-end">
                <FollowButton
                  isFollowing={isFollowing}
                  loading={loading}
                  onFollow={handleFollowClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClubhouzMomentsCarousel: React.FC = () => {
  const { user } = useSupabaseSession();
  const { posts, loading } = useClubhouseContent();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMobile = useIsMobile();

  // Filter posts with video content and valid users, then deduplicate by user
  const filteredPosts = posts.filter(post => 
    post.post_media.some(media => media.media_type === 'video' || media.media_type === 'image') &&
    post.user.id !== user?.id // Don't show current user's posts
  );

  // Deduplicate by user - keep only the most recent post per user
  const userPostMap = new Map<string, typeof filteredPosts[0]>();
  
  filteredPosts.forEach(post => {
    const existingPost = userPostMap.get(post.user.id);
    if (!existingPost || new Date(post.created_at) > new Date(existingPost.created_at)) {
      userPostMap.set(post.user.id, post);
    }
  });

  const moments = Array.from(userPostMap.values()).slice(0, 20); // Limit for performance

  console.log('ClubhouzMomentsCarousel - moments:', moments.length);

  const updateScrollButtons = () => {
    const container = carouselRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = carouselRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [moments]);

  const scroll = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (container) {
      const cardWidth = isMobile ? 180 : 220; // Approximate card width
      const scrollDistance = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Clubhouz Moments</h2>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 md:w-52">
                <div className="bg-muted rounded-xl aspect-[3/4] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || moments.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Clubhouz Moments</h2>
          
          {/* Desktop Navigation Arrows */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {moments.map((moment) => (
              <div
                key={moment.id}
                className="flex-shrink-0 w-44 md:w-52"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MomentCard moment={moment} currentUserId={user.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubhouzMomentsCarousel;