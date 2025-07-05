import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, Edit, Trash2, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import EditPostDialog from './EditPostDialog';
import TaggedText from './TaggedText';
import VideoPreview from './VideoPreview';
import CoursePostBadge from './CoursePostBadge';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import { showToast } from '@/utils/toast';
import LazyImage from '@/components/ui/lazy-image';
import PostViewerModal from './PostViewerModal';
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

interface UserPostProps {
  post: UserPostData;
  allUserPosts?: UserPostData[];
  source?: 'clubhouse' | 'profile';
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

const UserPost = ({ post, allUserPosts = [], source = 'clubhouse', onPostUpdated, onPostDeleted }: UserPostProps) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [golfCourse, setGolfCourse] = useState<any>(null);
  
  // Mobile-specific state for Instagram-style layout
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source });
  const { isOpen: isFullscreenOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();

  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwnPost = user?.id === post.user.id;

  // Find golf club tags to show as course badges
  const golfClubTags = post.post_tags?.filter(tag => tag.entity_type === 'golf_club') || [];
  
  // Fetch golf course details if there are golf club tags
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

  const handleDeletePost = async () => {
    if (!isOwnPost || isDeleting) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { error: tagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', post.id);

      if (tagsError) throw tagsError;

      const { error: mediaError } = await supabase
        .from('post_media')
        .delete()
        .eq('post_id', post.id);

      if (mediaError) throw mediaError;

      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (postError) throw postError;

      // Show delete toast
      showToast("Post deleted");

      onPostDeleted?.();

    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.user.username}`);
  };

  const handlePostClick = () => {
    // Transform post data to match PostViewerModal interface
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

  const handleMediaClick = (mediaUrl: string, mediaType: 'image' | 'video') => {
    // On mobile, always use post viewer for tap-to-expand functionality
    if (isMobile) {
      handlePostClick();
    } else if (source === 'clubhouse' || source === 'profile') {
      handlePostClick();
    } else {
      openMedia(mediaUrl, mediaType, undefined, golfCourse ? { id: golfCourse.id, name: golfCourse.name, country: golfCourse.country } : undefined);
    }
  };

  // Mobile video control handlers
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

  // Create carousel items from media
  const carouselItems = post.post_media?.map((media, index) => (
    <div key={media.id} className="w-full aspect-square relative">
      {/* Golf Course Badge overlay on each media item */}
      {golfCourse && (
        <div className="absolute top-2 right-2 z-10">
          <CoursePostBadge 
            course={{
              id: golfCourse.id,
              name: golfCourse.name,
              country: golfCourse.country,
              region: golfCourse.region
            }}
            className="m-0"
          />
        </div>
      )}
      
      {media.media_type === 'image' ? (
        <img
          src={media.media_url}
          alt="Post content"
          className="w-full h-full object-cover object-center cursor-pointer"
          loading="lazy"
          onClick={() => handleMediaClick(media.media_url, 'image')}
        />
      ) : (
        <div onClick={() => handleMediaClick(media.media_url, 'video')}>
          <VideoPreview
            src={media.media_url}
            className="w-full h-full cursor-pointer"
            videoId={`user-post-${post.id}-${index}`}
            isGridThumbnail={true}
          />
        </div>
      )}
    </div>
  )) || [];

  const PostContent = () => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Add intersection observer for scroll-based autoplay on desktop too
    const { ref: postRef, isInView } = useIntersectionObserver({
      threshold: 0.5,
      rootMargin: '0px'
    });

    // Auto-hover for videos when in view to trigger autoplay on desktop
    useEffect(() => {
      if (isInView && post.post_media?.some(media => media.media_type === 'video')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    }, [isInView, post.post_media]);

    return (
      <Card ref={postRef} className="border-0 shadow-sm">
        <div className="p-4">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <LazyImage
                  src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt={displayName}
                  className="w-16 h-16 rounded-[14px] border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  width={64}
                  height={64}
                  onClick={handleProfileClick}
                />
              <div>
                <div className="flex items-center space-x-1">
                  <span 
                    className="font-semibold text-sm cursor-pointer hover:text-gray-400 transition-colors"
                    onClick={handleProfileClick}
                  >
                    {displayName}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
            </div>
            
            {isOwnPost && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-background border shadow-lg z-[100]"
                  sideOffset={5}
                  avoidCollisions={true}
                >
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditDialogOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePost();
                    }}
                    disabled={isDeleting}
                    className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post Content with Tagged Text */}
          {post.content && (
            <div className="text-sm mb-3">
              <TaggedText text={post.content} tags={post.post_tags} />
            </div>
          )}

          {/* Post Media using SwipeCarousel */}
          {carouselItems.length > 0 && (
            <div className="mb-3">
              <div className="rounded-lg overflow-hidden">
                <SwipeCarousel
                  items={carouselItems}
                  showDots={carouselItems.length > 1}
                  showArrows={false}
                />
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center space-x-4 pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
              <Heart className="h-4 w-4 mr-1" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MessageCircle className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Mobile Instagram-style layout
  const MobileInstagramPost = () => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Add intersection observer for scroll-based autoplay
    const { ref: containerRef, isInView } = useIntersectionObserver({
      threshold: 0.5,
      rootMargin: '0px'
    });

    // Auto-hover for videos when in view to trigger autoplay
    useEffect(() => {
      if (isInView && post.post_media?.[currentMediaIndex]?.media_type === 'video') {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    }, [isInView, currentMediaIndex, post.post_media]);

    if (!post.post_media || post.post_media.length === 0) {
      return (
        <div className="bg-background p-4 border-b">
          <div className="flex items-center space-x-3 mb-3">
            <LazyImage
              src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={displayName}
              className="w-8 h-8 rounded-full cursor-pointer"
              width={32}
              height={32}
              onClick={handleProfileClick}
            />
            <div className="text-sm">
              <span className="font-semibold cursor-pointer" onClick={handleProfileClick}>
                {displayName}
              </span>
              <span className="ml-2">{post.content}</span>
            </div>
          </div>
        </div>
      );
    }

    const currentMedia = post.post_media[currentMediaIndex];
    
    return (
      <div 
        ref={containerRef}
        className="relative w-full bg-black"
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Media Container - Full width, responsive height */}
        <div className="relative w-full aspect-[4/5] cursor-pointer" onClick={() => handleMediaClick(currentMedia.media_url, currentMedia.media_type)}>
          {currentMedia.media_type === 'video' ? (
            <VideoPreview
              src={currentMedia.media_url}
              className="w-full h-full object-cover"
              videoId={`mobile-post-${post.id}-${currentMediaIndex}`}
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
                onClick={() => {
                  handleProfileClick();
                }}
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

          {/* Location Tag - Top Right */}
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

          {/* Multi-media navigation */}
          {post.post_media.length > 1 && (
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
              onClick={(e) => e.stopPropagation()}
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
            
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>View all comments</div>
              <div className="text-xs">{timeAgo}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobile ? <MobileInstagramPost /> : <PostContent />}

      <EditPostDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        post={post}
        onPostUpdated={onPostUpdated}
      />

      {/* Post Viewer Modal for clubhouse and profile sources */}
      {(source === 'clubhouse' || source === 'profile') && currentPost && (
        <PostViewerModal
          isOpen={isOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts}
        />
      )}

      {/* Fallback fullscreen modal for other sources */}
      <FullscreenMediaModal
        isOpen={isFullscreenOpen}
        onClose={closeMedia}
        mediaUrl={currentMedia?.url || ''}
        mediaType={currentMedia?.type || 'image'}
        alt={currentMedia?.alt}
        golfCourse={currentMedia?.golfCourse}
      />
    </>
  );
};

export default UserPost;
