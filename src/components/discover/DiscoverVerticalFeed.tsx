import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useModalState } from '@/hooks/useModalDetector';
import { MapPin, UserPlus, UserCheck, Loader2, Minimize2, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PaperAirplaneIcon, HeartIcon, SpeakerXMarkIcon, SpeakerWaveIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import ClubTagPill from '@/components/clubhouse/ClubTagPill';
import EngagementRail from '@/components/clubhouse/EngagementRail';
import PostMetadata from '@/components/clubhouse/PostMetadata';
import { AudioStrip } from '@/components/clubhouse/AudioStrip';
import { UnifiedVideoPlayer } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getCloudflareStreamPoster } from '@/utils/cloudflareStreamAPI';
import { useHlsUrlCache, warmHlsJs } from '@/hooks/useHlsUrlCache';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import CommentsModal from '@/components/posts/CommentsModal';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { FLAGS } from '@/config/flags';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { AchievementBadgesOverlay } from '@/components/post/badges/AchievementBadgesOverlay';

// Video ref management - keep only current + neighbors to prevent memory leaks
const MAX_VIDEO_REFS = 20;
const VIDEO_WINDOW_RADIUS = 2; // keep current ± 2 posts "warm"

// Helper to compute which video IDs to keep in memory
function computeAllowedVideoIds(
  posts: { id: string }[],
  currentIndex: number
): Set<string> {
  const allowed = new Set<string>();

  if (!posts || posts.length === 0) return allowed;

  const start = Math.max(0, currentIndex - VIDEO_WINDOW_RADIUS);
  const end = Math.min(posts.length - 1, currentIndex + VIDEO_WINDOW_RADIUS);

  for (let i = start; i <= end; i++) {
    const post = posts[i];
    if (post?.id) allowed.add(post.id);
  }

  return allowed;
}

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
  isActive?: boolean;
}> = React.memo(({ src, muted, className, objectFit = 'contain', shouldAttach, autoplay, isActive = true }) => {
  const [apiHlsUrl, setApiHlsUrl] = useState<string | null>(null);
  const [apiPoster, setApiPoster] = useState<string | null>(null);
  const { getHlsUrl } = useHlsUrlCache();
  
  // Extract video ID and fetch from API
  const uid = uidFromNode({ src });

  // Warm hls.js on component mount
  useEffect(() => {
    warmHlsJs();
  }, []);
  
  useEffect(() => {
    if (uid) {
      getHlsUrl(uid).then((url) => {
        setApiHlsUrl(url);
      });
      getCloudflareStreamPoster(uid).then(setApiPoster);
    }
  }, [uid, getHlsUrl]);

  // Use API values first, then fallbacks using centralized config
  const hlsUrl = apiHlsUrl || (uid ? generateStreamHlsUrl(uid) : null);
  const poster = apiPoster || (uid ? generateStreamThumbnailUrl(uid, { height: 600 }) : undefined);

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Top gradient for readability */}
      <div className="absolute inset-x-0 top-0 z-10 h-[28vh] bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
      
      {/* Bottom gradient for readability */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-[35vh] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      
      {hlsUrl ? (
        <UnifiedVideoPlayer
          src={hlsUrl}
          posterUrl={poster}
          className="absolute inset-0 w-full h-full fullscreenVideoStage"
          aspectRatio="9:16"
          muted={muted}
          loop={true}
          autoplay={autoplay}
          surface="clubhouse"
          managedByMediaRuntime={true}
          showMuteButton={false}
          objectFit={objectFit}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
    </div>
  );
});

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

// ImageWithPinchZoom component for image media with pointer-based pinch-zoom support
const ImageWithPinchZoom: React.FC<{
  src: string;
  alt?: string;
  currentMediaIndex: number;
  scale: number;
  onSwipeDisabled: (disabled: boolean) => void;
}> = ({ src, alt, currentMediaIndex, scale, onSwipeDisabled }) => {
  const { ref, imgRef, style, scale: currentScale, reset } = usePinchZoomPointer({ doubleTapZoom: 2, overScrollMargin: 30 });

  // Disable swipe when zoomed
  useEffect(() => {
    onSwipeDisabled(currentScale > 1);
  }, [currentScale, onSwipeDisabled]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Top gradient for readability */}
      <div className="absolute inset-x-0 top-0 z-10 h-[20vh] bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
      
      {/* Bottom gradient for readability */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-[28vh] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      
      <div
        ref={ref}
        style={FLAGS.USE_PINCH_ZOOM ? style : undefined}
        className="flex items-center justify-center w-full h-full pinch-zoom-wrapper"
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-full object-contain select-none pinch-zoom-image"
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
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const nearObserverRef = useRef<IntersectionObserver | null>(null);
  const playObserverRef = useRef<IntersectionObserver | null>(null);
  const queryClient = useQueryClient();

  // Helper to safely disconnect observers
  const disconnectObserver = useCallback((observerRef: React.MutableRefObject<IntersectionObserver | null>) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

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
    if (!posts?.length) {
      // Nothing to observe; clean up existing observers
      disconnectObserver(nearObserverRef);
      disconnectObserver(playObserverRef);
      return;
    }

    // Always clear old observers before creating new ones
    disconnectObserver(nearObserverRef);
    disconnectObserver(playObserverRef);

    const nearObserver = new IntersectionObserver((entries) => {
      setShouldAttach((prev) => {
        const next = { ...prev };
        for (const e of entries) {
          const id = e.target.getAttribute('data-postid') || '';
          if (id) next[id] = e.isIntersecting || e.intersectionRatio > 0;
        }
        return next;
      });
    }, { root: null, rootMargin: '300px 0px', threshold: 0 });

    const playObserver = new IntersectionObserver((entries) => {
      setAutoplay((prev) => {
        const next = { ...prev };
        for (const e of entries) {
          const id = e.target.getAttribute('data-postid') || '';
          if (id) next[id] = e.intersectionRatio >= 0.65;
        }
        return next;
      });
    }, { root: null, threshold: [0, 0.65, 1] });

    nearObserverRef.current = nearObserver;
    playObserverRef.current = playObserver;

    // Cleanup when deps change / component unmounts
    return () => {
      disconnectObserver(nearObserverRef);
      disconnectObserver(playObserverRef);
    };
  }, [posts, disconnectObserver]);

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

  // Reset itemRefs when posts change dramatically
  useEffect(() => {
    itemRefs.current = {};
  }, [posts]);

  // Prune videoRefs to prevent memory leaks
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const allowedIds = computeAllowedVideoIds(posts, currentIndex);

    const entries = Object.entries(videoRefs.current);
    if (entries.length <= MAX_VIDEO_REFS && allowedIds.size === entries.length) {
      return;
    }

    const pruned: { [key: string]: HTMLVideoElement | null } = {};

    for (const [key, value] of entries) {
      if (allowedIds.has(key)) {
        pruned[key] = value;
      } else {
        // CLEANUP_PAUSE: Pause and clear video that's being pruned from memory
        // This is acceptable as it's resource cleanup, not playback control
        if (value) {
          value.pause();
          value.removeAttribute('src');
          value.load();
        }
      }
    }

    videoRefs.current = pruned;
  }, [posts, currentIndex]);

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
            user_id: user.id,
            actor_type: 'personal',
            actor_id: user.id
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
          .eq('actor_type', 'personal')
          .eq('actor_id', user.id);
        
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
    if (!user?.id) return;
    
    const isCurrentlyLiked = likedPosts?.includes(postId) || false;
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    
    likeMutation.mutate({ postId, action });
  }, [user?.id, likedPosts, likeMutation]);

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
  const discoverNavigate = useNavigate();
  const handleEditPost = (postId: string) => {
    onClose();
    discoverNavigate('/create-moment', { state: { editPostId: postId, backgroundLocation: location } });
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
      // Note: MediaRuntime handles video pause/play automatically via intersection observers
      
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
  }, [currentIndex, posts.length, onScroll, hasMore, isLoadingMore, onLoadMore]);

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
    return createPortal(
      <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center">
        <InlineSpinner size="lg" className="border-white border-t-transparent" />
      </div>,
      document.body
    );
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

          // Enhanced touch handlers for media navigation with vertical intent guardrail
          const createTouchHandlers = () => {
            // Constants for swipe detection
            const HORIZONTAL_TRIGGER_PX = 50;     // minimum horizontal distance to count as swipe
            const VERTICAL_EARLY_EXIT_PX = 15;    // if user moves vertically by this much early, treat as scroll
            const MAX_ANGLE_DEG = 30;             // only trigger if within ±30° of horizontal

            let startX = 0;
            let startY = 0;
            let peakAbsDx = 0;
            let peakAbsDy = 0;
            let canceledByVerticalIntent = false;

            const angleDeg = (dx: number, dy: number) => {
              // 0° = pure horizontal, 90° = pure vertical
              return Math.abs((Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI);
            };
            
            return {
              onTouchStart: (e: any) => {
                const t = e.touches?.[0] ?? e;
                startX = t.clientX;
                startY = t.clientY;
                peakAbsDx = 0;
                peakAbsDy = 0;
                canceledByVerticalIntent = false;
              },
              onTouchMove: (e: any) => {
                const t = e.touches?.[0] ?? e;
                const dx = t.clientX - startX;
                const dy = t.clientY - startY;

                peakAbsDx = Math.max(peakAbsDx, Math.abs(dx));
                peakAbsDy = Math.max(peakAbsDy, Math.abs(dy));

                // Early vertical intent guard: if user climbs vertical threshold before horizontal builds, bail
                if (!canceledByVerticalIntent && peakAbsDy > VERTICAL_EARLY_EXIT_PX && peakAbsDy > peakAbsDx) {
                  canceledByVerticalIntent = true;
                  return; // let native scroll happen; do not preventDefault here
                }

                // Only prevent default if we're confident it's a horizontal swipe
                if (Math.abs(dx) > 10 && angleDeg(dx, dy) < 45) {
                  e.preventDefault();
                }
              },
              onTouchEnd: (e: any) => {
                if (canceledByVerticalIntent || swipeDisabled) return;
                
                const t = e.changedTouches?.[0] ?? e;
                const dx = (t.clientX ?? 0) - startX;
                const dy = (t.clientY ?? 0) - startY;
                
                // Angle + magnitude check
                if (Math.abs(dx) >= HORIZONTAL_TRIGGER_PX) {
                  const ang = angleDeg(dx, dy);
                  if (ang <= MAX_ANGLE_DEG) {
                    e.preventDefault();
                    if (dx < 0 && hasMultipleMedia) {
                      // Swiped left - next media
                      handleNextMedia(item.id, mediaItems.length);
                    } else if (dx > 0 && hasMultipleMedia) {
                      // Swiped right - previous media
                      handlePrevMedia(item.id, mediaItems.length);
                    }
                  }
                }
                
                // Reset for next gesture
                startX = 0;
                startY = 0;
                peakAbsDx = 0;
                peakAbsDy = 0;
                canceledByVerticalIntent = false;
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
              className="relative w-full snap-start snap-always flex items-center justify-center bg-black"
              style={{ 
                height: '100dvh',
                minHeight: '100dvh',
                maxHeight: '100dvh',
                width: '100vw'
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

              {/* Golf Course Tag - Top Right Glass Pill */}
              {item.golfCourse && (
                <div className="absolute top-6 right-6 z-30 animate-fade-in">
                  <ClubTagPill 
                    course={{
                      id: item.golfCourse.id,
                      name: item.golfCourse.name,
                      country: item.golfCourse.country
                    }}
                    className="!static !right-auto"
                  />
                </div>
              )}

              {/* Achievement Badges - Top Left, below close button */}
              <AchievementBadgesOverlay badgeIds={item.badges} className="top-14 left-6" />
              <div 
                className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
              >
                {currentMedia.media_type === 'video' ? (
                  <VideoWithAutoplay
                    src={currentMedia.media_url}
                    muted={isGloballyMuted}
                    className="w-full h-full"
                    objectFit="contain"
                    shouldAttach={!!shouldAttach[item.id]}
                    autoplay={!!autoplay[item.id]}
                    isActive={index === currentIndex}
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
                
                {/* Navigation arrows for multiple media */}
                {hasMultipleMedia && (
                  <>
                    {/* Left Arrow */}
                    <button
                      onClick={(e) => handlePrevMedia(item.id, mediaItems.length, e)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-1 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Right Arrow */}
                    <button
                      onClick={(e) => handleNextMedia(item.id, mediaItems.length, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-1 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </>
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

              {/* Post Metadata - Bottom Left */}
              <PostMetadata
                title={removeGolfCourseFromContent(item.title)}
                description={item.ctaDescription}
                user={{
                  name: item.user?.name || 'Golfer',
                  avatar: item.user?.avatar
                }}
                onUserClick={() => {
                  // TODO: Add user profile navigation
                  console.log('Navigate to user profile:', item.user?.id);
                }}
                className="!bottom-[50px]"
              />

              {/* Audio Strip - Only show for video posts with custom audio */}
              {currentMedia.media_type === 'video' && item.audioTrack && !item.audioTrack.isOriginal && (
                <div className="absolute bottom-20 left-4 md:left-8 z-20">
                  <AudioStrip audioTrack={item.audioTrack} />
                </div>
              )}

              {/* Engagement Rail - Bottom Right */}
              <EngagementRail
                postId={item.id}
                stats={{
                  likes: item.likes || 0,
                  comments: item.comments || 0,
                  shares: item.shares || 0
                }}
                isLiked={likedPosts?.includes(item.id)}
                isVideo={currentMedia.media_type === 'video'}
                onLike={() => handleLike(item.id)}
                onComment={() => handleComment(item.id)}
                onShare={handleShare}
                isOwnPost={user && item.user?.id === user.id}
                onEdit={!item.achievementId ? () => handleEditPost(item.id) : undefined}
                onDelete={() => handleDeletePost(item.id)}
                className="absolute bottom-[50px] right-4 z-35"
              />

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
        .pinch-zoom-image {
          -webkit-user-drag: none;
          user-select: none;
        }
        .pinch-zoom-wrapper {
          touch-action: pan-y; /* Defensive: ensure vertical pass-through when not zoomed */
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
};

export default DiscoverVerticalFeed;