import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import VideoPlayer from '@/components/ui/video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';

import LazyImage from '@/components/ui/lazy-image';
import PostViewerModal from '@/components/posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface UserPostData {
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
  post_tags: PostTag[];
}

interface InstagramStylePostProps {
  post: UserPostData;
  allUserPosts?: UserPostData[];
}

const InstagramStylePost: React.FC<InstagramStylePostProps> = ({ post, allUserPosts = [] }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [golfCourse, setGolfCourse] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Add video autoplay functionality
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay();
  
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'clubhouse' });

  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const golfClubTags = post.post_tags?.filter(tag => tag.entity_type === 'golf_club') || [];

  // Swipe handlers for media navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (post.post_media.length > 1) {
        setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
      }
    },
    onSwipedRight: () => {
      if (post.post_media.length > 1) {
        setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50
  });

  // Fetch golf course details
  useEffect(() => {
    const fetchGolfCourse = async () => {
      if (golfClubTags.length > 0 && !golfCourse) {
        try {
          const { data: courseData, error } = await supabase
            .from('golf_courses')
            .select('id, name, country, region')
            .eq('id', golfClubTags[0].entity_id)
            .single();

          if (!error && courseData) {
            setGolfCourse(courseData);
          }
        } catch (error) {
          console.error('Error fetching golf course:', error);
        }
      }
    };

    fetchGolfCourse();
  }, [golfClubTags.length > 0 ? golfClubTags[0]?.entity_id : null, golfCourse]);

  const handleProfileClick = () => {
    navigate(`/profile/${post.user.username}`);
  };

  const handleMediaClick = () => {
    // Transform post data for the post viewer
    const transformedPost = {
      ...post,
      golfCourse: golfCourse ? {
        id: golfCourse.id,
        name: golfCourse.name,
        country: golfCourse.country,
        region: golfCourse.region
      } : undefined
    };
    
    const transformedPosts = allUserPosts.map(p => ({
      ...p,
      golfCourse: golfCourse ? {
        id: golfCourse.id,
        name: golfCourse.name,
        country: golfCourse.country,
        region: golfCourse.region
      } : undefined
    }));
    
    openPostViewer(transformedPost, transformedPosts);
  };

  const handleVideoToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
  };

  const currentMedia = post.post_media[currentMediaIndex];

  if (!currentMedia) return null;

  return (
    <>
      <div ref={autoplayRef} className="relative w-full bg-black" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Media Container - Full width, responsive height */}
        <div 
          {...swipeHandlers}
          className="relative w-full aspect-[4/5] md:aspect-[3/4] cursor-pointer" 
          onClick={handleMediaClick}
        >
          {currentMedia.media_type === 'video' ? (
            <VideoPlayer
              src={currentMedia.media_url}
              autoplay={shouldAutoplay}
              muted={true}
              loop={true}
              className="w-full h-full"
              showVideoIcon={false}
              showOverlayControls={false}
            />
          ) : (
            <LazyImage
              src={currentMedia.media_url}
              alt="Post content"
              className="w-full h-full object-cover"
            />
          )}

          {/* User Info Overlay - Top Left */}
          <div className="absolute top-4 left-4 flex items-center space-x-3 z-20">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 flex items-center space-x-3">
              <LazyImage
                src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={displayName}
                className="w-8 h-8 rounded-full border border-white/20 cursor-pointer"
                width={32}
                height={32}
                onClick={handleProfileClick}
              />
              <div className="text-white text-sm">
                <div 
                  className="font-semibold cursor-pointer hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick();
                  }}
                >
                  {displayName}
                </div>
                <div className="text-xs opacity-80">
                  @{post.user.username} • {timeAgo}
                </div>
              </div>
            </div>
          </div>

          {/* Location Tag - Top Right or Bottom Left */}
          {golfCourse && (
            <div className="absolute top-4 right-4 z-20">
              <CoursePostBadge 
                course={{
                  id: golfCourse.id,
                  name: golfCourse.name,
                  country: golfCourse.country,
                  region: golfCourse.region
                }}
                className="bg-black/40 backdrop-blur-sm border border-white/20"
              />
            </div>
          )}

          {/* Video Controls */}
          {currentMedia.media_type === 'video' && (
            <>
              {/* Play/Pause Center Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
                  onClick={handleVideoToggle}
                >
                  {isVideoPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              </div>

              {/* Mute/Unmute - Top Right Corner */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                onClick={handleMuteToggle}
              >
                {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </>
          )}

          {/* Multi-image navigation - only show arrows on desktop */}
          {post.post_media.length > 1 && (
            <>
              {!isMobile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                    onClick={handlePrevMedia}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                    onClick={handleNextMedia}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {post.post_media.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Engagement Icons - Bottom Right */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-3 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-red-500 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Caption & Comments Area - Below Media */}
        {post.content && (
          <div className="bg-background p-4 border-b">
            <div className="text-sm">
              <span className="font-semibold cursor-pointer hover:opacity-80" onClick={handleProfileClick}>
                {displayName}
              </span>
              <span className="ml-2">{post.content}</span>
            </div>
            
            {/* Mock comments - in a real app this would come from a comments API */}
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>View all comments</div>
              <div className="text-xs">{timeAgo}</div>
            </div>
          </div>
        )}
      </div>

      {/* Post Viewer Modal */}
      {currentPost && (
        <PostViewerModal
          isOpen={isOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts}
        />
      )}
    </>
  );
};

export default InstagramStylePost;