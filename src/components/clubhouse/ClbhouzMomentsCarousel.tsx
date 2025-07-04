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
  const [moments, setMoments] = useState<MomentPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

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

  useEffect(() => {
    if (user) {
      fetchMoments();
    }
  }, [user]);

  const fetchMoments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get all posts with media (both video and image posts)
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media (
            id,
            media_url,
            media_type
          )
        `)
        .not('user_id', 'eq', user.id) // Still exclude current user's posts
        .order('created_at', { ascending: false })
        .limit(50); // Get more posts to have better selection per user

      if (error) throw error;

      if (!posts || posts.length === 0) {
        setMoments([]);
        return;
      }

      // Group posts by user and get the most recent post per user
      const userPostsMap = new Map<string, any>();
      posts.forEach(post => {
        if (!userPostsMap.has(post.user_id) || 
            new Date(post.created_at) > new Date(userPostsMap.get(post.user_id).created_at)) {
          userPostsMap.set(post.user_id, post);
        }
      });

      const uniqueUserPosts = Array.from(userPostsMap.values());

      // Get user profiles for these posts
      const userIds = uniqueUserPosts.map(post => post.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get follow relationships
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

      if (followError) throw followError;

      const followedUserIds = new Set(followedUsers?.map(f => f.following_id) || []);

      // Get course and user tags for posts
      const { data: postTags, error: tagsError } = await supabase
        .from('post_tags')
        .select(`
          post_id,
          tagged_entity_id,
          taggable_entities!inner (
            id,
            entity_type,
            entity_id,
            name
          )
        `)
        .in('post_id', uniqueUserPosts.map(p => p.id))
        .limit(50);

      if (tagsError) throw tagsError;

      // For users without videos in their latest post, get any images from their other posts
      const usersNeedingImages = uniqueUserPosts.filter(post => 
        !post.post_media?.some(media => media.media_type === 'video')
      ).map(post => post.user_id);

      let additionalImages: any[] = [];
      if (usersNeedingImages.length > 0) {
        const { data: imagePosts, error: imageError } = await supabase
          .from('posts')
          .select(`
            user_id,
            post_media!inner (
              media_url,
              media_type
            )
          `)
          .in('user_id', usersNeedingImages)
          .eq('post_media.media_type', 'image')
          .limit(usersNeedingImages.length * 3); // Get a few images per user

        if (!imageError && imagePosts) {
          additionalImages = imagePosts;
        }
      }

      // Transform the data
      const transformedMoments: MomentPost[] = uniqueUserPosts.map(post => {
        const userProfile = profiles?.find(p => p.id === post.user_id);
        const isFollowing = followedUserIds.has(post.user_id);
        
        // Get tags for this post
        const postTagsData = postTags?.filter(tag => tag.post_id === post.id) || [];
        const courseTags = postTagsData
          .filter(tag => tag.taggable_entities?.entity_type === 'course' || tag.taggable_entities?.entity_type === 'golf_club')
          .map(tag => ({ course_name: tag.taggable_entities?.name || '' }));
        
        const userTags = postTagsData
          .filter(tag => tag.taggable_entities?.entity_type === 'user')
          .map(tag => ({ user_name: tag.taggable_entities?.name || '' }));

        // Check if post has video content
        const hasVideo = post.post_media?.some(media => media.media_type === 'video');
        
        // Get media to use - prefer videos, then post images, then additional images
        let mediaToUse = post.post_media || [];
        
        if (!hasVideo) {
          // Look for images in this post first
          const postImages = post.post_media?.filter(media => media.media_type === 'image') || [];
          
          if (postImages.length > 0) {
            mediaToUse = [postImages[0]]; // Use first image from the post
          } else {
            // Look for images from user's other posts
            const userImages = additionalImages.filter(img => img.user_id === post.user_id);
            if (userImages.length > 0 && userImages[0].post_media?.length > 0) {
              mediaToUse = [userImages[0].post_media[0]];
            }
          }
        }
        
        return {
          id: post.id,
          content: post.content || '',
          created_at: post.created_at,
          user_id: post.user_id,
          media: mediaToUse,
          user_profile: {
            id: userProfile?.id || '',
            display_name: userProfile?.display_name || 'Unknown User',
            username: userProfile?.username || '',
            profile_photo_url: userProfile?.profile_photo_url || '',
          },
          course_tags: courseTags,
          user_tags: userTags,
          is_following: isFollowing,
        };
      });

      // Filter to only include posts that have some media and limit to reasonable number
      const postsWithMedia = transformedMoments
        .filter(moment => moment.media && moment.media.length > 0)
        .slice(0, 10); // Limit to 10 unique users

      setMoments(postsWithMedia);
    } catch (error) {
      console.error('Error fetching moments:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-lg font-semibold">Golfers you may like</h2>
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
                {/* Video/Image Background */}
                <div className={`relative bg-black ${isMobile ? 'aspect-[4/5]' : 'aspect-[9/16]'}`}>
                  {moment.media[0] && (
                    <>
                      {moment.media[0].media_type === 'video' ? (
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
                      ) : (
                        <img
                          src={moment.media[0].media_url}
                          alt={moment.user_profile.display_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </>
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

                  {/* Follow Button - Above course tag */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    {!moment.is_following ? (
                      <button
                        className="bg-black/80 text-white hover:bg-black/90 cursor-pointer transition-all duration-200 hover:shadow-sm px-3 py-1.5 rounded-full text-xs font-medium border-0 backdrop-blur-sm inline-flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(moment.user_id, moment.id);
                        }}
                      >
                        Follow
                      </button>
                    ) : (
                      <div className="bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-medium border-0 backdrop-blur-sm inline-flex items-center justify-center">
                        Following
                      </div>
                    )}
                  </div>

                  {/* Course/Tags Info - Almost at bottom */}
                  <div className="absolute bottom-1 left-3 right-3 text-white">
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