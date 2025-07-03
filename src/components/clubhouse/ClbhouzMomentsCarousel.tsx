import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MomentPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media: Array<{
    id: string;
    media_url: string;
    media_type: string;
  }>;
  user_profile: {
    id: string;
    display_name: string;
    username: string;
    profile_photo_url: string;
  };
  course_tags?: Array<{
    course_name: string;
  }>;
  user_tags?: Array<{
    user_name: string;
  }>;
  is_following: boolean;
}

const ClbhouzMomentsCarousel: React.FC = () => {
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Mock data for demonstration
  const mockMoments: MomentPost[] = [
    {
      id: '1',
      content: 'Amazing round at Augusta National! The greens were perfect and the weather couldn\'t have been better. What a dream come true!',
      created_at: '2024-01-15T10:30:00Z',
      user_id: 'user1',
      media: [{
        id: 'media1',
        media_url: 'https://images.unsplash.com/photo-1533618363240-b1e2aa9b1c92?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user1',
        display_name: 'Tiger Woods',
        username: 'tigerwoods',
        profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'Augusta National Golf Club' }],
      user_tags: [{ user_name: 'Phil Mickelson' }, { user_name: 'Rory McIlroy' }],
      is_following: false,
    },
    {
      id: '2', 
      content: 'First time playing St Andrews Old Course! The history and tradition here is incredible. Every hole tells a story.',
      created_at: '2024-01-14T14:20:00Z',
      user_id: 'user2',
      media: [{
        id: 'media2',
        media_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user2',
        display_name: 'Jordan Spieth',
        username: 'jordanspieth',
        profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'St Andrews Links (Old Course)' }],
      is_following: false,
    },
    {
      id: '3',
      content: 'Sunset golf at Pebble Beach is pure magic. The views from the 18th hole are unmatched anywhere in the world!',
      created_at: '2024-01-13T18:45:00Z',
      user_id: 'user3',
      media: [{
        id: 'media3',
        media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user3',
        display_name: 'Justin Thomas',
        username: 'justinthomas',
        profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'Pebble Beach Golf Links' }],
      user_tags: [{ user_name: 'Rickie Fowler' }],
      is_following: false,
    },
    {
      id: '4',
      content: 'Links golf at its finest! Royal County Down never disappoints. The mountain views are absolutely breathtaking.',
      created_at: '2024-01-12T11:15:00Z',
      user_id: 'user4',
      media: [{
        id: 'media4',
        media_url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user4',
        display_name: 'Rory McIlroy',
        username: 'rorymcilroy',
        profile_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'Royal County Down Golf Club' }],
      is_following: false,
    },
    {
      id: '5',
      content: 'Desert golf in Scotland! Castle Stuart is such a unique experience. The coastal winds make every shot interesting.',
      created_at: '2024-01-11T16:30:00Z',
      user_id: 'user5',
      media: [{
        id: 'media5',
        media_url: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user5',
        display_name: 'Collin Morikawa',
        username: 'collinmorikawa',
        profile_photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'Castle Stuart Golf Links' }],
      user_tags: [{ user_name: 'Viktor Hovland' }],
      is_following: false,
    },
    {
      id: '6',
      content: 'Championship golf at Kiawah Island! The Ocean Course is a true test of golf. Wind is everything here.',
      created_at: '2024-01-10T09:45:00Z',
      user_id: 'user6',
      media: [{
        id: 'media6',
        media_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
        media_type: 'video'
      }],
      user_profile: {
        id: 'user6',
        display_name: 'Bryson DeChambeau',
        username: 'brysondechambeau',
        profile_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      },
      course_tags: [{ course_name: 'Kiawah Island Golf Resort' }],
      is_following: false,
    }
  ];

  const [moments, setMoments] = useState<MomentPost[]>(mockMoments);

  const nextSlide = () => {
    const maxIndex = isMobile ? moments.length - 1 : moments.length - 4;
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Swipe gesture handling
  const swipeRef = useSwipeGesture({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    threshold: 50,
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFollow = async (userId: string, momentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      // Update the moment to reflect the follow status
      setMoments(prev => prev.map(moment => 
        moment.id === momentId 
          ? { ...moment, is_following: true }
          : moment
      ));

      toast({
        title: "Following!",
        description: "You're now following this user",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleVideoPlay = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video && video.paused) {
      video.play().catch(console.error);
    }
  };

  const handleVideoPause = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video && !video.paused) {
      video.pause();
    }
  };

  const getVisibleCards = () => {
    const cardsToShow = isMobile ? 1 : 4;
    return moments.slice(currentIndex, currentIndex + cardsToShow);
  };

  // Auto-play videos when they come into view on mobile
  useEffect(() => {
    if (isMobile && moments.length > 0) {
      const currentMoment = moments[currentIndex];
      if (currentMoment) {
        // Play current video
        handleVideoPlay(currentMoment.id);
        
        // Pause all other videos
        moments.forEach(moment => {
          if (moment.id !== currentMoment.id) {
            handleVideoPause(moment.id);
          }
        });
      }
    }
  }, [currentIndex, isMobile, moments]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Loading Moments...</span>
      </div>
    );
  }

  if (moments.length === 0) {
    // Show empty state instead of null for debugging
    return (
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Discover Golf Moments</h2>
          <p className="text-sm text-muted-foreground">From golfers you might like</p>
        </div>
        <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">No moments available at this time</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Discover Golf Moments</h2>
        <p className="text-sm text-muted-foreground">From golfers you might like</p>
      </div>
      
      <div className="relative">
        {/* Desktop Navigation Arrows */}
        {!isMobile && (
          <>
            {currentIndex > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {currentIndex < moments.length - 4 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {/* Carousel Container */}
        <div 
          ref={swipeRef}
          className="overflow-hidden rounded-lg touch-pan-y"
        >
          <div 
            className={`flex transition-transform duration-300 ease-out ${
              isMobile ? 'gap-0' : 'gap-4'
            }`}
            style={{
              transform: `translateX(-${currentIndex * (isMobile ? 100 : 25)}%)`,
            }}
          >
            {moments.map((moment) => (
              <Card
                key={moment.id}
                className={`flex-shrink-0 relative overflow-hidden group cursor-pointer ${
                  isMobile ? 'w-full' : 'w-1/4'
                }`}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setHoveredCard(moment.id);
                    handleVideoPlay(moment.id);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHoveredCard(null);
                    handleVideoPause(moment.id);
                  }
                }}
                onClick={() => {
                  // Handle opening full moment view
                  console.log('Open moment:', moment.id);
                }}
              >
                {/* Video Background */}
                <div className="relative aspect-[9/16] bg-black">
                  {moment.media[0] && (
                    <video
                      ref={el => {
                        if (el) videoRefs.current[moment.id] = el;
                      }}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                      poster={moment.media[0].media_url}
                    >
                      <source src={moment.media[0].media_url} type="video/mp4" />
                    </video>
                  )}
                  
                  {/* Overlay */}
                  <div 
                    className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${
                      hoveredCard === moment.id || isMobile 
                        ? 'opacity-100' 
                        : 'opacity-0'
                    }`}
                  />
                  
                  {/* User Info Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <img
                      src={moment.user_profile.profile_photo_url || '/placeholder.svg'}
                      alt={moment.user_profile.display_name}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <div className="text-white">
                      <p className="text-sm font-medium drop-shadow-lg">
                        {moment.user_profile.display_name}
                      </p>
                      {moment.user_profile.username && (
                        <p className="text-xs opacity-90 drop-shadow-lg">
                          @{moment.user_profile.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Course/Tags Info */}
                  <div className="absolute bottom-16 left-3 right-3 text-white">
                    {moment.course_tags && moment.course_tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs drop-shadow-lg">
                          {moment.course_tags[0].course_name}
                        </span>
                      </div>
                    )}
                    
                    {moment.user_tags && moment.user_tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs drop-shadow-lg">
                          with {moment.user_tags.map(tag => tag.user_name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Follow Button */}
                  <div 
                    className={`absolute bottom-3 left-3 right-3 transition-all duration-200 ${
                      hoveredCard === moment.id || isMobile
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-4'
                    }`}
                  >
                    {!moment.is_following && (
                      <Button
                        size="sm"
                        className="w-full bg-white text-black hover:bg-gray-100 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(moment.user_id, moment.id);
                        }}
                      >
                        FOLLOW
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Swipe Indicators */}
        {isMobile && (
          <div className="flex justify-center mt-4 gap-1">
            {moments.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClbhouzMomentsCarousel;