import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { MapPin, UserPlus, UserCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { EmojiReactionTray } from './EmojiReactionTray';
import { usePostReactions } from '@/hooks/usePostReactions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import ClubTagPill from './ClubTagPill';
import MiniProfileSheetWithData from './MiniProfileSheetWithData';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import CommentsModal from '@/components/posts/CommentsModal';
import { useVideoManager } from '@/contexts/VideoManagerContext';
import { AudioStrip } from './AudioStrip';
import { SocialDock } from './social-dock/SocialDock';
import { TopBar } from './social-dock/TopBar';
import { VideoReactionTray } from './social-dock/VideoReactionTray';
import { useTopBarVisibility } from '@/hooks/useTopBarVisibility';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';
import { logClubhouseFiltering } from '@/utils/clubhouseTelemetry';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { 
  auditComponentMount, 
  auditIntersectionObserver,
  logIntersectionEvent,
  trackScrollMetrics,
  resetScrollMetrics,
  markPerformance
} from '@/utils/clubhouseAudit';

// Video ref management - keep only current + neighbors to prevent memory leaks
const MAX_VIDEO_REFS = 20;
const VIDEO_WINDOW_RADIUS = 2; // keep current ± 2 posts "warm"

interface ClubhouseVerticalFeedProps {
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onCurrentPostChange?: (index: number) => void;
  onScroll?: (scrollTop: number) => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
  onActiveVideoRefChange?: (ref: HTMLVideoElement | null) => void;
  onCommentsOpenChange?: (isOpen: boolean) => void;
  onProfileOpenChange?: (isOpen: boolean) => void;
  chromeState?: 'visible' | 'hidden';
  onPostDetailsOpen?: () => void;
  onDismissNavOverlay?: () => void;
  onNavOverlayRequest?: () => void;
}

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

// VideoWithAutoplay component moved outside to prevent recreation on re-renders
const VideoWithAutoplay = React.memo(forwardRef<HTMLVideoElement, {
  src: string;
  muted: boolean;
  className: string;
  isMobile?: boolean;
  shouldAttach?: boolean;
  autoplay?: boolean;
  isNearby?: boolean;
  isActive?: boolean;
}>(({ src, muted, className, isMobile: isMobileProp = false, shouldAttach = false, autoplay = false, isNearby = true, isActive = true }, ref) => {
  // Generate HLS URL from source
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null;
  const poster = uid ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600` : undefined;

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {hlsUrl ? (
        <div className="absolute inset-0" style={{ objectPosition: 'center center' }}>
          <HLSVideoCard
            ref={ref}
            hlsUrl={hlsUrl}
            poster={poster}
            className="absolute inset-0 w-full h-full"
            aspectRatio="auto"
            muted={muted}
            loop={true}
            autoplay={autoplay}
            shouldAttach={shouldAttach}
            showMuteButton={false}
            externallyManaged={true}
            fit="cover"
            isNearby={isNearby}
            isActive={isActive}
          />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
      
      {/* Readability gradient - 35% height from bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
        }}
      />
    </div>
  );
}));

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

const ClubhouseVerticalFeed: React.FC<ClubhouseVerticalFeedProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onCurrentPostChange,
  onScroll,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onActiveVideoRefChange,
  onCommentsOpenChange,
  onProfileOpenChange,
  chromeState = 'visible',
  onPostDetailsOpen,
  onDismissNavOverlay,
  onNavOverlayRequest
}) => {
  const { isVisible: topBarVisible, resetTimer: resetTopBar } = useTopBarVisibility();
  const [showVideoReactions, setShowVideoReactions] = useState(false);
  const [reactionPosition, setReactionPosition] = useState({ x: 0, y: 0 });
  const { user } = useSupabaseSession();
  
  // Portrait-only aspect ratio constant (height/width >= 1.2)
  const PORTRAIT_MIN_AR = 1.2;

  // Helper function to check if media is portrait
  const isPortrait = useCallback((media?: { width?: number; height?: number; aspect_ratio?: number }) => {
    if (!media) return false;
    
    // Check width/height first
    if (media.width && media.height) {
      return media.height / media.width >= PORTRAIT_MIN_AR;
    }
    
    // If aspect_ratio is stored as width/height, invert it
    if (media.aspect_ratio) {
      const heightOverWidth = 1 / media.aspect_ratio;
      return heightOverWidth >= PORTRAIT_MIN_AR;
    }
    
    // Exclude items with missing metadata (no letterboxing allowed)
    return false;
  }, []);

  // Client-side defensive filtering: ensure only short videos
  const filteredPosts = useMemo(() => {
    // First: defensive guard for shorts-only (should be server-filtered already)
    const shortsOnly = posts.filter(post => {
      if (post.type !== 'video') return false;
      if (typeof post.durationSeconds !== 'number') return false;
      if (post.durationSeconds >= 120) return false;
      return true;
    });

    // Second: portrait filter if enabled
    if (!FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) return shortsOnly;
    
    const filtered = shortsOnly.filter(post => {
      const media = post.media?.[0];
      if (!media) return false;
      
      // Cast to include dimension properties
      const mediaWithDimensions = media as any;
      return isPortrait({
        width: mediaWithDimensions.width,
        height: mediaWithDimensions.height,
        aspect_ratio: mediaWithDimensions.aspect_ratio
      });
    });

    // Log telemetry for filtering effectiveness
    if (posts.length > 0) {
      logClubhouseFiltering(posts.length, filtered.length);
    }
    
    return filtered;
  }, [posts, isPortrait]);
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const { setActiveVideo } = useVideoManager();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visualIndex, setVisualIndex] = useState(0);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showMiniProfile, setShowMiniProfile] = useState(false);

  // Get engagement data for the current post
  const currentPost = filteredPosts[currentIndex];
  const currentPostEngagement = usePostEngagement(currentPost?.id || null);

  // Notify parent when drawer states change
  useEffect(() => {
    onCommentsOpenChange?.(commentsModalOpen);
  }, [commentsModalOpen, onCommentsOpenChange]);

  useEffect(() => {
    onProfileOpenChange?.(showMiniProfile);
  }, [showMiniProfile, onProfileOpenChange]);

  // Cleanup visualIndexTimeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
    };
  }, []);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  // Removed isTextExpanded state as mouse handlers were removed to prevent re-renders
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const queryClient = useQueryClient();
  
  // Two-observer system for prebuffer and autoplay
  const nearRef = useRef<IntersectionObserver | null>(null);
  const playRef = useRef<IntersectionObserver | null>(null);
  const [shouldAttachMap, setShouldAttachMap] = useState<Record<string, boolean>>({});
  const [autoplayMap, setAutoplayMap] = useState<Record<string, boolean>>({});

  // Helper to safely disconnect observers
  const disconnectObserver = useCallback((observerRef: React.MutableRefObject<IntersectionObserver | null>) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);
  const [videoProgress, setVideoProgress] = useState(0); // 0-100
  
  // Post reactions
  const { getUserReaction, handleReaction } = usePostReactions();
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [reactionTrayPosition, setReactionTrayPosition] = useState({ x: 0, y: 0 });
  const [reactionPostId, setReactionPostId] = useState<string>('');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Double-tap like state
  const [showTapHeart, setShowTapHeart] = useState<Record<string, boolean>>({});
  const lastTapRef = useRef<Record<string, number>>({});

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
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id
  });

  // Setup dual intersection observers
  useEffect(() => {
    if (!filteredPosts?.length) {
      // Nothing to observe; clean up existing observers
      disconnectObserver(nearRef);
      disconnectObserver(playRef);
      return;
    }

    // Always clear old observers before creating new ones
    disconnectObserver(nearRef);
    disconnectObserver(playRef);

    markPerformance('feed-observer-setup-start');
    
    const nearObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          logIntersectionEvent('nearRef', id, e.isIntersecting, e.intersectionRatio);
          setShouldAttachMap((m) => ({ ...m, [id]: e.isIntersecting || e.intersectionRatio > 0 }));
        });
      },
      { root: null, rootMargin: '300px 0px 300px 0px', threshold: 0 }
    );

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          logIntersectionEvent('playRef', id, e.isIntersecting, e.intersectionRatio);
          setAutoplayMap((m) => ({ ...m, [id]: e.intersectionRatio >= 0.65 }));
        });
      },
      { root: null, threshold: [0.0, 0.65, 1.0] }
    );

    nearRef.current = nearObserver;
    playRef.current = playObserver;

    auditIntersectionObserver(nearObserver, 'nearRef (prebuffer)');
    auditIntersectionObserver(playObserver, 'playRef (autoplay@65%)');
    
    markPerformance('feed-observer-setup-end');

    // Cleanup when deps change / component unmounts
    return () => {
      disconnectObserver(nearRef);
      disconnectObserver(playRef);
    };
  }, [filteredPosts, disconnectObserver]);

  // Reset itemRefs when posts change dramatically
  useEffect(() => {
    itemRefs.current = {};
  }, [filteredPosts]);

  // Notify parent component when current post changes
  useEffect(() => {
    onCurrentPostChange?.(currentIndex);
  }, [currentIndex, onCurrentPostChange]);

  // Prune videoRefs to prevent memory leaks
  useEffect(() => {
    if (!filteredPosts || filteredPosts.length === 0) return;

    const allowedIds = computeAllowedVideoIds(filteredPosts, currentIndex);

    const entries = Object.entries(videoRefs.current);
    if (entries.length <= MAX_VIDEO_REFS && allowedIds.size === entries.length) {
      return;
    }

    const pruned: { [key: string]: HTMLVideoElement | null } = {};

    for (const [key, value] of entries) {
      if (allowedIds.has(key)) {
        pruned[key] = value;
      } else {
        // Pause and clear video that's being pruned
        if (value) {
          value.pause();
          value.removeAttribute('src');
          value.load();
        }
      }
    }

    videoRefs.current = pruned;
  }, [filteredPosts, currentIndex]);

  // Track video progress for the current video
  useEffect(() => {
    const currentPost = filteredPosts[currentIndex];
    if (!currentPost) return;
    
    const videoEl = videoRefs.current[currentPost.id];
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (videoEl.duration > 0) {
        const progress = (videoEl.currentTime / videoEl.duration) * 100;
        setVideoProgress(progress);
      }
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentIndex, filteredPosts]);

  // Check which posts the user has liked
  const { data: likedPosts } = useQuery({
    queryKey: ['post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const postIds = filteredPosts.map(post => post.id);
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (error) {
        console.error('Error fetching liked posts:', error);
        return [];
      }
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id && filteredPosts.length > 0
  });

  // Optimize likedPosts lookup with Set for O(1) performance
  const likedPostSet = useMemo(
    () => new Set(likedPosts ?? []),
    [likedPosts]
  );

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'follow') {
        const { data, error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['user-follows', user?.id, variables.targetUserId],
        variables.action === 'follow'
      );
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
    }
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
      queryClient.setQueryData(['post-likes', user?.id], (oldData: string[] | undefined) => {
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

  const handleFollowToggle = () => {
    const targetUserId = posts[currentIndex]?.user?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    
    followMutation.mutate({
      targetUserId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  const handleLike = useCallback((postId: string) => {
    if (!user?.id) return;
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  }, [user?.id, likedPosts, likeMutation]);

  // Double-tap like handler
  const handleDoubleTap = useCallback((postId: string, e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    const timeDiff = now - lastTap;
    
    lastTapRef.current[postId] = now;
    
    // Double-tap detected (within 300ms)
    if (timeDiff < 300 && timeDiff > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger like if not already liked
      const isLiked = likedPosts?.includes(postId);
      if (!isLiked) {
        handleLike(postId);
      }
      
      // Show heart burst animation
      setShowTapHeart(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setShowTapHeart(prev => ({ ...prev, [postId]: false }));
      }, 450);
      
      return true; // Signal that double-tap was handled
    }
    
    return false; // Not a double-tap
  }, [likedPosts, handleLike]);
  
  // Video play/pause state
  const [videoControlsVisible, setVideoControlsVisible] = useState<Record<string, boolean>>({});
  const [videosPlaying, setVideosPlaying] = useState<Record<string, boolean>>({});
  const controlsHideTimers = useRef<Record<string, number>>({});
  
  // Single tap handler for video play/pause
  const handleVideoSingleTap = useCallback((postId: string, e: React.MouseEvent | React.TouchEvent) => {
    // Check if this is a double-tap first
    const isDoubleTap = handleDoubleTap(postId, e);
    if (isDoubleTap) return;
    
    // Dismiss nav overlay if active
    if (onDismissNavOverlay) {
      onDismissNavOverlay();
    }
    
    // Wait a tiny bit to ensure this isn't a double-tap
    setTimeout(() => {
      const wasDouble = Date.now() - (lastTapRef.current[postId] || 0) < 300;
      if (wasDouble) return; // Don't execute single tap if double-tap just occurred
      
      // Toggle play/pause
      const videoEl = videoRefs.current[postId];
      if (!videoEl) return;
      
      const isCurrentlyPlaying = !videoEl.paused;
      if (isCurrentlyPlaying) {
        videoEl.pause();
        setVideosPlaying(prev => ({ ...prev, [postId]: false }));
      } else {
        videoEl.play();
        setVideosPlaying(prev => ({ ...prev, [postId]: true }));
      }
      
      // Show controls briefly
      setVideoControlsVisible(prev => ({ ...prev, [postId]: true }));
      
      // Clear existing timer
      if (controlsHideTimers.current[postId]) {
        clearTimeout(controlsHideTimers.current[postId]);
      }
      
      // Auto-hide controls after 2s
      controlsHideTimers.current[postId] = window.setTimeout(() => {
        setVideoControlsVisible(prev => ({ ...prev, [postId]: false }));
      }, 2000);
    }, 320); // Wait just past double-tap window
  }, [handleDoubleTap, onDismissNavOverlay]);
  
  // Video long press handler for reactions
  const videoLongPressTimers = useRef<Record<string, number>>({});
  
  const handleVideoLongPressStart = useCallback((e: React.TouchEvent, postId: string) => {
    const touch = e.touches[0];
    const position = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    // Start long-press timer
    videoLongPressTimers.current[postId] = window.setTimeout(() => {
      setReactionPosition(position);
      setShowVideoReactions(true);
      resetTopBar(); // Reset top bar timer on interaction
    }, 400); // 400ms for long-press
  }, [resetTopBar]);
  
  const handleVideoLongPressEnd = useCallback((postId: string) => {
    if (videoLongPressTimers.current[postId]) {
      clearTimeout(videoLongPressTimers.current[postId]);
      delete videoLongPressTimers.current[postId];
    }
  }, []);

  // Media swipe gesture handlers (memoized to prevent re-renders)
  const handleMediaTouchStart = useCallback((e: React.TouchEvent, postId: string, hasMultipleMedia: boolean) => {
    if (e.currentTarget.closest('[data-media-container]')) {
      handleVideoLongPressStart(e, postId);
    }
    
    if (hasMultipleMedia) {
      (e.currentTarget as any).touchStartX = e.touches[0].clientX;
      (e.currentTarget as any).touchStartY = e.touches[0].clientY;
    }
  }, [handleVideoLongPressStart]);

  const handleMediaTouchEnd = useCallback((
    e: React.TouchEvent,
    postId: string,
    hasMultipleMedia: boolean,
    currentMediaIndex: number,
    mediaItemsLength: number,
    isVideo: boolean
  ) => {
    if (isVideo) {
      handleVideoLongPressEnd(postId);
    }
    
    if (!hasMultipleMedia) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchStartX = (e.currentTarget as any).touchStartX || 0;
    const touchStartY = (e.currentTarget as any).touchStartY || 0;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous media
        setMediaIndices(prev => ({
          ...prev,
          [postId]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItemsLength - 1
        }));
      } else {
        // Swipe left - next media
        setMediaIndices(prev => ({
          ...prev,
          [postId]: currentMediaIndex < mediaItemsLength - 1 ? currentMediaIndex + 1 : 0
        }));
      }
    }
  }, [handleVideoLongPressEnd]);

  // Helper function to truncate text to 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Track previous scroll position for direction detection
  const prevScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const lastIndexChangeTimeRef = useRef(0);
  const hasIndexChangedOnceRef = useRef(false);
  const visualIndexTimeoutRef = useRef<number | null>(null);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    // Track scroll metrics for audit
    trackScrollMetrics(scrollTop);
    
    // Call chrome state handler if provided
    if (onScroll) {
      requestAnimationFrame(() => {
        onScroll(scrollTop);
      });
    }
    
    // Index update with hysteresis to prevent flicker
    const now = Date.now();
    const MIN_INDEX_CHANGE_INTERVAL = 80; // ms
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredPosts.length) {
      // Small hysteresis window to avoid flicker when hovering between posts
      if (now - lastIndexChangeTimeRef.current < MIN_INDEX_CHANGE_INTERVAL) {
        // Too soon after last change – ignore to prevent flicker
        return;
      }

      lastIndexChangeTimeRef.current = now;
      setCurrentIndex(newIndex);

      if (!hasIndexChangedOnceRef.current) {
        hasIndexChangedOnceRef.current = true;
      }

      // Soft delay for visual HUD switch - lets scroll snap settle
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
      visualIndexTimeoutRef.current = window.setTimeout(() => {
        setVisualIndex(newIndex);
      }, 40);
      
      // If scrolling to a photo post, stop all videos
      const currentPost = filteredPosts[newIndex];
      if (currentPost && currentPost.type !== 'video') {
        setActiveVideo(null);
      }
    }

    // Debounced loading check to prevent excessive calls
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (newIndex >= filteredPosts.length - 3 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }, 150);

    prevScrollTopRef.current = scrollTop;
  }, [currentIndex, filteredPosts, hasMore, isLoadingMore, onLoadMore, onScroll]);

  // Notify parent of active video ref changes
  useEffect(() => {
    if (!onActiveVideoRefChange) return;
    
    const currentPost = filteredPosts[currentIndex];
    
    if (currentPost && currentPost.type === 'video') {
      const videoRef = videoRefs.current[currentPost.id];
      
      // If video ref isn't available yet, wait a bit for it to mount
      if (!videoRef) {
        const checkRef = setInterval(() => {
          const ref = videoRefs.current[currentPost.id];
          if (ref) {
            onActiveVideoRefChange(ref);
            clearInterval(checkRef);
          }
        }, 50); // Check every 50ms
        
        // Clean up after 500ms if ref still not found
        setTimeout(() => clearInterval(checkRef), 500);
        return () => clearInterval(checkRef);
      } else {
        onActiveVideoRefChange(videoRef);
      }
    } else {
      onActiveVideoRefChange(null);
    }
  }, [currentIndex, filteredPosts, onActiveVideoRefChange]);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;

    const itemHeight = window.innerHeight; // Full screen height now
    scrollViewRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredPosts.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
            
            // Load more if near end
            if (newIndex >= filteredPosts.length - 3 && hasMore && !isLoadingMore) {
              onLoadMore();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredPosts.length, hasMore, isLoadingMore, onLoadMore]);



  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  };

  // Long press handlers for reaction tray
  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const newPosition = {
      x: rect.left - 80, // Position to the left of the button
      y: rect.top + rect.height / 2
    };
    
    setReactionTrayPosition(newPosition);
    setReactionPostId(postId);

    longPressTimer.current = setTimeout(() => {
      setShowReactionTray(true);
    }, 500); // 500ms long press threshold
  }, []);

  const handleLongPressEnd = useCallback((postId: string) => {
    // Restore scroll behavior
    document.documentElement.style.touchAction = '';
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!showReactionTray) {
      // Quick tap - toggle heart reaction
      const currentReaction = getUserReaction(postId);
      if (currentReaction === '❤️') {
        handleReaction(postId, ''); // Remove reaction
      } else {
        handleReaction(postId, '❤️'); // Add heart reaction
      }
    }
  }, [showReactionTray, getUserReaction, handleReaction]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const currentReaction = getUserReaction(reactionPostId);
    if (currentReaction === emoji) {
      handleReaction(reactionPostId, ''); // Remove reaction if same emoji selected
    } else {
      handleReaction(reactionPostId, emoji); // Set new reaction
    }
    setShowReactionTray(false);
  }, [reactionPostId, getUserReaction, handleReaction]);

  const handleReactionCancel = useCallback(() => {
    setShowReactionTray(false);
  }, []);

  // Preload next video HLS manifest
  useEffect(() => {
    if (!filteredPosts || filteredPosts.length === 0) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= filteredPosts.length) return;

    const nextPost = filteredPosts[nextIndex];
    if (!nextPost || nextPost.media?.[0]?.media_type !== 'video') return;

    const src = nextPost.media[0]?.media_url;
    if (!src) return;

    const uid = uidFromNode({ src });
    if (!uid) return;

    const hlsUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`;
    preloadHlsManifest(hlsUrl);
  }, [currentIndex, filteredPosts]);

  // Audit on mount
  useEffect(() => {
    markPerformance('feed-mount-start');
    auditComponentMount(scrollViewRef.current, 'ClubhouseVerticalFeed', {
      checkScroll: true,
      checkLayers: true
    });
    markPerformance('feed-mount-end');
    
    if (scrollViewRef.current) {
      markPerformance('first-scroll-ready');
    }

    return () => {
      resetScrollMetrics();
      if (visualIndexTimeoutRef.current) {
        window.clearTimeout(visualIndexTimeoutRef.current);
      }
    };
  }, []);

  if (filteredPosts.length === 0) {
    return (
      <div className="fixed inset-0 z-10 bg-black flex items-center justify-center">
        <InlineSpinner size="lg" className="border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 bg-black overflow-hidden">
      {/* Scrollable Content */}
      <div
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollBehavior: isMobile ? 'auto' : 'smooth',
          overscrollBehavior: 'none',
          touchAction: 'pan-y'
        }}
      >

        {filteredPosts.map((item, index) => {
          // Virtualization: calculate distance from current index
          const distance = Math.abs(index - currentIndex);
          const isNearby = distance <= 1;

          // Get media array for this item
          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          // Navigation handlers for this specific item
          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
            }));
          };

          // Render lightweight placeholder for off-screen items
          if (!isNearby) {
            return (
              <div
                key={item.id}
                data-postid={item.id}
                ref={(el) => {
                  if (el) {
                    itemRefs.current[index] = el;
                    nearRef.current?.observe(el);
                    playRef.current?.observe(el);
                  }
                }}
                className="relative w-full snap-start snap-always bg-black"
                style={{ 
                  height: '100svh',
                  minHeight: '100svh',
                  maxHeight: '100svh',
                  width: '100vw',
                  maxWidth: '100vw',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always'
                }}
              />
            );
          }

          // Render full card for nearby items
          return (
            <div
              key={item.id}
              data-postid={item.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[index] = el;
                  nearRef.current?.observe(el);
                  playRef.current?.observe(el);
                }
              }}
              className="relative w-full snap-start snap-always"
              style={{ 
                height: '100svh',
                minHeight: '100svh',
                maxHeight: '100svh',
                width: '100vw',
                maxWidth: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Media Content */}
              <div 
                onClick={(e) => {
                  if (currentMedia.media_type === 'video') {
                    handleVideoSingleTap(item.id, e);
                  }
                }}
                onTouchStart={(e) => {
                  handleMediaTouchStart(
                    e,
                    item.id,
                    hasMultipleMedia
                  );
                }}
                onTouchEnd={(e) => {
                  handleMediaTouchEnd(
                    e,
                    item.id,
                    hasMultipleMedia,
                    currentMediaIndex,
                    mediaItems.length,
                    currentMedia.media_type === 'video'
                  );
                }}
                className="relative w-full h-full z-10"
                data-media-container
              >
                {/* Double-tap heart burst */}
                {showTapHeart[item.id] && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-white opacity-0 scale-75 animate-[heart-burst_0.45s_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:scale-100">
                      <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {currentMedia.media_type === 'video' ? (
                  <>
                    <VideoWithAutoplay
                      ref={(el) => {
                        videoRefs.current[item.id] = el;
                        // If this is the current post, notify parent immediately
                        if (index === currentIndex && el && onActiveVideoRefChange) {
                          onActiveVideoRefChange(el);
                        }
                      }}
                      src={currentMedia.media_url}
                      muted={isGloballyMuted}
                      className="w-full h-full"
                      isMobile={isMobile}
                      shouldAttach={!!shouldAttachMap[item.id]}
                      autoplay={!!autoplayMap[item.id]}
                      isNearby={isNearby}
                      isActive={index === currentIndex}
                    />
                    
                    {/* Simple video controls overlay */}
                    {videoControlsVisible[item.id] && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                        <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm animate-fade-in">
                          {videosPlaying[item.id] !== false ? (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full bg-black overflow-hidden">
                    <img
                      src={currentMedia.media_url}
                      alt={item.title || 'Content image'}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      style={{ objectPosition: 'center center' }}
                      draggable={false}
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                      }}
                    />
                    
                    {/* Readability gradient for images */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                      style={{
                        height: '35vh',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
                      }}
                    />
                  </div>
                )}


                {/* Navigation Arrows - Left and Right */}
                {hasMultipleMedia && (
                  <>
                     {/* Left Arrow */}
                    <button
                      data-control="media-nav"
                      onClick={handlePrevMedia}
                      className={`absolute ${isMobile ? 'left-4' : 'left-4'} top-1/2 -translate-y-1/2 z-30 p-0 transition-all duration-200 w-10 h-10 flex items-center justify-center`}
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    {/* Right Arrow */}
                    <button
                      data-control="media-nav"
                      onClick={handleNextMedia}
                      className={`absolute ${isMobile ? 'right-4' : 'right-4'} top-1/2 -translate-y-1/2 z-30 p-0 transition-all duration-200 w-10 h-10 flex items-center justify-center`}
                      aria-label="Next media"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
              </div>

              {/* Social Dock removed from here - now rendered as sibling outside the feed */}
            </div>
          );
        })}

        {/* Loading indicator at the bottom */}
        {isLoadingMore && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-white/70">Loading more posts...</div>
          </div>
        )}
      </div>

      {/* Emoji Reaction Tray */}
      <EmojiReactionTray
        isVisible={showReactionTray}
        onEmojiSelect={handleEmojiSelect}
        onCancel={handleReactionCancel}
        position={reactionTrayPosition}
        selectedEmoji={getUserReaction(reactionPostId)}
      />

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
          scroll-snap-type: y mandatory;
          will-change: scroll-position;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .snap-y::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .snap-start {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          will-change: transform;
        }
        @media (max-width: 768px) {
          .snap-y {
            scroll-behavior: auto !important;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
            overscroll-behavior-y: none;
          }
        }
      `}</style>

      {/* Comments Modal */}
      {commentsModalOpen && selectedPostId && (
        <CommentsModal
          isOpen={commentsModalOpen}
          postId={selectedPostId}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId('');
          }}
        />
      )}

      {/* Mini Profile Sheet */}
      <MiniProfileSheetWithData
        userId={selectedUserId}
        isOpen={showMiniProfile}
        onClose={() => setShowMiniProfile(false)}
        onFollow={() => {
          // Handle follow action - could update local state or refetch
        }}
      />

      {/* Top Bar */}
      <TopBar isVisible={topBarVisible} />

      {/* Fixed Social Dock - Dynamically updates based on currentIndex */}
      {chromeState === 'hidden' && filteredPosts[currentIndex] && (
        <SocialDock
          post={{
            id: filteredPosts[currentIndex].id,
            user: {
              id: filteredPosts[currentIndex].user?.id || '',
              name: filteredPosts[currentIndex].user?.name || 'Unknown User',
              avatar: filteredPosts[currentIndex].user?.avatar
            },
            caption: removeGolfCourseFromContent(
              (filteredPosts[currentIndex].title as string | null) ?? 
              (filteredPosts[currentIndex].ctaDescription as string | null) ?? ''
            ),
            courseName: filteredPosts[currentIndex].golfCourse?.name,
            holeNumber: undefined,
            isMuted: isGloballyMuted,
          }}
          likesCount={currentPostEngagement.likesCount}
          commentsCount={currentPostEngagement.commentsCount}
          hasLiked={currentPostEngagement.hasLiked}
          isVisible={true}
          onSwipeUp={() => onPostDetailsOpen?.()}
          onProfileClick={() => {
            setSelectedUserId(filteredPosts[currentIndex].user?.id || null);
            setShowMiniProfile(true);
          }}
          onCourseClick={() => console.log('Course clicked')}
          onLike={() => currentPostEngagement.toggleLike()}
          onComment={() => handleComment(filteredPosts[currentIndex].id)}
          onShare={handleShare}
          onMuteToggle={() => setGlobalMute(!isGloballyMuted)}
          onSearch={() => console.log('Search clicked')}
          onNavigationTap={onNavOverlayRequest}
        />
      )}

      {/* Video Reaction Tray */}
      <VideoReactionTray
        isVisible={showVideoReactions}
        position={reactionPosition}
        onEmojiSelect={(emoji) => {
          console.log('Emoji selected:', emoji);
          setShowVideoReactions(false);
        }}
        onCancel={() => setShowVideoReactions(false)}
      />
    </div>
  );
};

export default ClubhouseVerticalFeed;