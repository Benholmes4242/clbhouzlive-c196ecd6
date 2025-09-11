import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import { useModalState } from '@/hooks/useModalDetector';
import { MapPin, UserPlus, UserCheck, Loader2, Minimize2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PaperAirplaneIcon, HeartIcon, SpeakerXMarkIcon, SpeakerWaveIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamHLS, getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoManager } from '@/contexts/VideoManagerContext';
import CommentsModal from '@/components/posts/CommentsModal';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { FLAGS } from '@/config/flags';


interface DiscoverVerticalFeedProps {
  isOpen: boolean;
  onClose: () => void;
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onScroll?: (scrollDirection: 'up' | 'down') => void;
  initialItem?: ExploreContentItem;
  initialMediaIndex?: number;
}

// VideoWithAutoplay component with observer-controlled playback
const VideoWithAutoplay: React.FC<{
  src: string;
  muted: boolean;
  className: string;
  objectFit?: 'cover' | 'contain';
  shouldAttach: boolean;
  autoplay: boolean;
}> = React.memo(({ src, muted, className, objectFit = 'cover', shouldAttach, autoplay }) => {
  const [apiHlsUrl, setApiHlsUrl] = useState<string | null>(null);
  const [apiPoster, setApiPoster] = useState<string | null>(null);
  
  // Extract video ID and fetch from API
  const uid = uidFromNode({ src });
  
  useEffect(() => {
    if (uid) {
      getCloudflareStreamHLS(uid).then(setApiHlsUrl);
      getCloudflareStreamPoster(uid).then(setApiPoster);
    }
  }, [uid]);

  // Use API values first, then fallbacks
  const hlsUrl = apiHlsUrl || (uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null);
  const poster = apiPoster || (uid ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600` : undefined);

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      {hlsUrl ? (
        <HLSVideoCard
          hlsUrl={hlsUrl}
          poster={poster}
          className="w-full h-full fullscreenVideoStage"
          aspectRatio="auto"
          muted={muted}
          loop={true}
          shouldAttach={shouldAttach}
          autoplay={autoplay}
          externallyManaged={true}
          showMuteButton={false}
          fit={isDesktop ? 'contain' : 'cover'}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
    </div>
  );
});

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

// ImageWithPinchZoom component for image media with pinch-zoom support
const ImageWithPinchZoom: React.FC<{
  src: string;
  alt?: string;
  currentMediaIndex: number;
  scale: number;
  onSwipeDisabled: (disabled: boolean) => void;
}> = ({ src, alt, currentMediaIndex, scale, onSwipeDisabled }) => {
  const { ref, style, onTouchStart, onTouchMove, onTouchEnd, reset, scale: currentScale } = usePinchZoom();

  // Disable swipe when zoomed
  useEffect(() => {
    onSwipeDisabled(currentScale > 1);
  }, [currentScale, onSwipeDisabled]);

  return (
    <div className="relative w-full h-full bg-black">
      <div
        ref={ref}
        style={FLAGS.USE_PINCH_ZOOM ? style : undefined}
        onTouchStart={FLAGS.USE_PINCH_ZOOM ? onTouchStart : undefined}
        onTouchMove={FLAGS.USE_PINCH_ZOOM ? onTouchMove : undefined}
        onTouchEnd={FLAGS.USE_PINCH_ZOOM ? onTouchEnd : undefined}
        className="flex items-center justify-center w-full h-full"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-[90vw] object-contain select-none"
          draggable={false}
          loading="eager"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        {FLAGS.USE_PINCH_ZOOM && currentScale > 1 && (
          <button
            onClick={reset}
            className="absolute bottom-4 right-4 rounded bg-black/50 text-white px-2 py-1 text-xs z-50"
            aria-label="Reset zoom"
          >
            Reset zoom
          </button>
        )}
      </div>
    </div>
  );
};

const DiscoverVerticalFeed: React.FC<DiscoverVerticalFeedProps> = ({
  isOpen,
  onClose,
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onScroll,
  initialItem,
  initialMediaIndex = 0
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const { setActiveVideo } = useVideoManager();
  const { deletePost } = usePostDeletion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [currentMediaIndices, setCurrentMediaIndices] = useState<{ [postId: string]: number }>({});
  const [shouldAttach, setShouldAttach] = useState<Record<string, boolean>>({});
  const [autoplay, setAutoplay] = useState<Record<string, boolean>>({});
  const [swipeDisabled, setSwipeDisabled] = useState(false);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const nearObserverRef = useRef<IntersectionObserver | null>(null);
  const playObserverRef = useRef<IntersectionObserver | null>(null);
  const queryClient = useQueryClient();

  // Register modal state for Echo detection
  useModalState(isOpen);

  // Lock body scroll when feed is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Two-observer pattern for seamless autoplay
  useEffect(() => {
    nearObserverRef.current = new IntersectionObserver((entries) => {
      setShouldAttach((prev) => {
        const next = { ...prev };
        for (const e of entries) {
          const id = e.target.getAttribute('data-postid') || '';
          if (id) next[id] = e.isIntersecting || e.intersectionRatio > 0;
        }
        return next;
      });
    }, { root: null, rootMargin: '300px 0px', threshold: 0 });

    playObserverRef.current = new IntersectionObserver((entries) => {
      setAutoplay((prev) => {
        const next = { ...prev };
        for (const e of entries) {
          const id = e.target.getAttribute('data-postid') || '';
          if (id) next[id] = e.intersectionRatio >= 0.65;
        }
        return next;
      });
    }, { root: null, threshold: [0, 0.65, 1] });

    return () => {
      nearObserverRef.current?.disconnect();
      playObserverRef.current?.disconnect();
    };
  }, []);

  // Hide header when modal opens, show when closed
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      if (isOpen) {
        header.style.display = 'none';
      } else {
        header.style.display = '';
      }
    }

    // Cleanup: ensure header is shown when component unmounts
    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = '';
      }
    };
  }, [isOpen]);

  // Find initial index when modal opens
  useEffect(() => {
    if (isOpen && initialItem && posts.length > 0) {
      const index = posts.findIndex(post => post.id === initialItem.id);
      if (index !== -1) {
        setCurrentIndex(index);
        
        // Set initial media index for the initial item if provided
        if (initialMediaIndex > 0) {
          setCurrentMediaIndices(prev => ({
            ...prev,
            [initialItem.id]: initialMediaIndex
          }));
        }
        
        // Scroll to the correct item
        if (scrollViewRef.current) {
          const element = scrollViewRef.current;
          const targetScrollTop = index * element.clientHeight;
          element.scrollTo({ top: targetScrollTop, behavior: 'instant' });
        }
      }
    }
  }, [isOpen, initialItem, posts, initialMediaIndex]);

  // Check if current user follows the displayed user
  const { data: isFollowing, isLoading: isFollowingLoading } = useQuery({
    queryKey: ['user-follows', user?.id, posts[currentIndex]?.user?.id],
    queryFn: async () => {
      if (!user?.id || !posts[currentIndex]?.user?.id || user.id === posts[currentIndex]?.user?.id) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', posts[currentIndex]?.user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id
  });

  // Check if current user has liked the displayed post
  const { data: likedPosts } = useQuery({
    queryKey: ['user-post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'like') {
        const { data, error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      // Update the liked posts cache
      queryClient.setQueryData(['user-post-likes', user?.id], (oldData: string[] | undefined) => {
        if (!oldData) return variables.action === 'like' ? [variables.postId] : [];
        
        if (variables.action === 'like') {
          return [...oldData, variables.postId];
        } else {
          return oldData.filter(id => id !== variables.postId);
        }
      });
    },
    onError: (error) => {
      console.error('Like/unlike error:', error);
    }
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, shouldFollow }: { targetUserId: string; shouldFollow: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (shouldFollow) {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id, posts[currentIndex]?.user?.id] });
    }
  });

  const toggleGlobalMute = useCallback(() => {
    setGlobalMute(!isGloballyMuted);
  }, [isGloballyMuted, setGlobalMute]);

  const handleLike = useCallback((postId: string) => {
    onLike(postId);
  }, [onLike]);

  const handleFollow = useCallback(() => {
    const targetUser = posts[currentIndex]?.user;
    if (!targetUser?.id || !user?.id || targetUser.id === user.id) return;
    
    followMutation.mutate({
      targetUserId: targetUser.id,
      shouldFollow: !isFollowing
    });
  }, [followMutation, posts, currentIndex, user?.id, isFollowing]);

  const handleComment = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;
    
    await deletePost(postId);
    onClose(); // Close the modal after deletion
  };

  // Handle post editing
  const handleEditPost = (postId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', postId);
    onClose();
  };

  // Handle media navigation for posts with multiple media
  const handlePrevMedia = (postId: string, mediaLength: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentMediaIndices(prev => ({
      ...prev,
      [postId]: prev[postId] > 0 ? prev[postId] - 1 : mediaLength - 1
    }));
  };

  const handleNextMedia = (postId: string, mediaLength: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentMediaIndices(prev => ({
      ...prev,
      [postId]: prev[postId] < mediaLength - 1 ? prev[postId] + 1 : 0
    }));
  };

  // Function to truncate words properly
  const truncateToWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const scrollTop = element.scrollTop;
    const itemHeight = element.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      
      // If scrolling to a photo post, stop all videos
      const currentPost = posts[newIndex];
      if (currentPost && currentPost.type !== 'video') {
        setActiveVideo(null);
      }
      
      // Call onScroll callback if provided
      if (onScroll) {
        const direction = newIndex > currentIndex ? 'down' : 'up';
        onScroll(direction);
      }
    }

    // Load more when near the end
    if (hasMore && !isLoadingMore && newIndex >= posts.length - 3) {
      onLoadMore();
    }
  }, [currentIndex, posts.length, onScroll, hasMore, isLoadingMore, onLoadMore, posts, setActiveVideo]);

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < posts.length && scrollViewRef.current) {
      const element = scrollViewRef.current;
      const targetScrollTop = index * element.clientHeight;
      element.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  }, [posts.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            navigateToIndex(currentIndex - 1);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < posts.length - 1) {
            navigateToIndex(currentIndex + 1);
          }
          break;
        case ' ':
          event.preventDefault();
          toggleGlobalMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex, posts.length, navigateToIndex, toggleGlobalMute]);

  if (!isOpen) return null;

  if (posts.length === 0) {
    return createPortal(<ClubhouzLoading />, document.body);
  }

  const content = (
    <div className="fixed inset-0 z-[1000] bg-black overflow-hidden">
      {/* Scrollable Content */}
      <div 
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((item, index) => {
          // Get media items for this post
          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = currentMediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          // Touch handlers for media navigation
          const createTouchHandlers = () => {
            let startX = 0;
            let startY = 0;
            
            return {
              onTouchStart: (e: any) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
              },
              onTouchEnd: (e: any) => {
                if (!startX || !startY || swipeDisabled) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Handle media navigation with vertical swipes when multiple media exists
                if (hasMultipleMedia && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (diffY > 0) {
                    // Swiped up - next media item
                    handleNextMedia(item.id, mediaItems.length);
                  } else if (diffY < 0) {
                    // Swiped down - previous media item
                    handlePrevMedia(item.id, mediaItems.length);
                  }
                }
                
                startX = 0;
                startY = 0;
              }
            };
          };

          const touchHandlers = hasMultipleMedia ? createTouchHandlers() : {};

          return (
            <div 
              key={item.id}
              data-postid={item.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[index] = el;
                  nearObserverRef.current?.observe(el);
                  playObserverRef.current?.observe(el);
                }
              }}
              className="relative w-full snap-start snap-always flex items-center justify-center"
              style={{ 
                height: '100vh',
                minHeight: '100vh',
                maxHeight: '100vh'
              }}
              {...touchHandlers}
            >
              {/* Close Button - Top Left */}
              <button
                onClick={onClose}
                className="absolute top-6 left-6 z-30 p-0 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <Minimize2 className="w-6 h-6" />
              </button>

              {/* Golf Course Tag - Top Right */}
              {item.golfCourse && (
                <div className="absolute top-6 right-6 z-30">
                  <CoursePostBadge 
                    course={{
                      id: item.golfCourse.id,
                      name: item.golfCourse.name,
                      country: item.golfCourse.country
                    }}
                    isClubhouse={true}
                  />
                </div>
              )}

              {/* Media Content */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
              >
                {currentMedia.media_type === 'video' ? (
                  <VideoWithAutoplay
                    src={currentMedia.media_url}
                    muted={isGloballyMuted}
                    className="w-full h-full"
                    objectFit="contain"
                    shouldAttach={!!shouldAttach[item.id]}
                    autoplay={!!autoplay[item.id]}
                  />
                ) : (
                  <ImageWithPinchZoom
                    src={currentMedia.media_url}
                    alt={item.title}
                    currentMediaIndex={currentMediaIndex}
                    scale={1} // This will be managed internally by the component
                    onSwipeDisabled={setSwipeDisabled}
                  />
                )}
                
                
                {/* Media navigation dots for multiple media */}
                {hasMultipleMedia && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <MediaNavigationDots
                      mediaCount={mediaItems.length}
                      currentIndex={currentMediaIndex}
                    />
                  </div>
                )}
              </div>

              {/* User Profile and Caption - Bottom Left */}
              <div className="absolute bottom-6 left-3 right-20 z-20">
                {/* User Profile Section */}
                {index === currentIndex && (
                  <div className="mb-3 flex items-end space-x-3">
                    {/* Profile Photo */}
                    <div className="relative">
                      <img
                        src={item.user?.avatar || '/placeholder.svg'}
                        alt={item.user?.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    {/* Username */}
                    <div className="flex flex-col">
                      <span className="font-semibold text-xl text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                        {item.user?.name || 'Unknown User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Caption Text */}
                {item.title && removeGolfCourseFromContent(item.title) && (
                  <div 
                    className="text-white text-base font-medium cursor-default"
                    style={{ 
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginLeft: '0px',
                      marginTop: '0px',
                      wordBreak: 'break-word',
                      width: '70vw', // 70% of screen width
                      maxWidth: '70vw'
                    }}
                  >
                    <span className="text-base font-medium">
                      {removeGolfCourseFromContent(item.title)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Bottom Right */}
              <div className="absolute bottom-6 right-4 z-10 flex flex-col space-y-6">
                {/* Mute/Unmute toggle button - only show for video posts */}
                {currentMedia.media_type === 'video' && (
                  <button 
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={toggleGlobalMute}
                  >
                    {isGloballyMuted ? (
                      <SpeakerXMarkIcon className="w-8 h-8 text-white" />
                    ) : (
                      <SpeakerWaveIcon className="w-8 h-8 text-white" />
                    )}
                  </button>
                )}

                {/* Heart Button with Like Count */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleLike(item.id)}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    disabled={likeMutation.isPending}
                  >
                    <HeartIcon 
                      className={`h-8 w-8 ${likedPosts?.includes(item.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                    />
                  </button>
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 1000) + 10}
                  </span>
                </div>

                {/* Message Button with Comment Count */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleComment(item.id)}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-white" />
                  </button>
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 50) + 5}
                  </span>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <PaperAirplaneIcon className="h-8 w-8 text-white" />
                </button>

                {/* Three dots menu - only show for own posts */}
                {user && item.user?.id === user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-8 h-8 text-white" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border border-white/10 shadow-xl z-[1000000]"
                    >
                      <DropdownMenuItem onClick={() => handleEditPost(item.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePost(item.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        postId={selectedPostId}
      />

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-white/70">Loading more posts...</div>
        </div>
      )}

      <style>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .snap-y {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .snap-y::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
};

export default DiscoverVerticalFeed;