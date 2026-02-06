import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import ClubhouseVerticalGrid from '@/components/grid/ClubhouseVerticalGrid';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { useInfiniteClubhouseShorts } from '@/hooks/useInfiniteFollowedPosts';
import { useClubhouseFriendsShorts } from '@/hooks/useClubhouseFriendsShorts';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import { NewSeasonBanner } from '@/components/feed/NewSeasonBanner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { cn } from '@/lib/utils';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse, logLoadingPostsShow, logLoadingPostsHide } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { ClubhouseTabProvider, useClubhouseTab, type ClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { clubhouseDebug } from '@/debug/clubhouseDebug';
import MobileVideoDebugPanel from '@/components/debug/MobileVideoDebugPanel';
import { useKeepAliveActivation } from '@/hooks/useKeepAliveActivation';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { videoDebug } from '@/config/videoDebug';

const ClubhouseContent = () => {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST - before any early returns
  // ============================================================================
  
  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();
  
  // Keep-Alive activation - respond to tab switches without unmounting
  // This allows instant video resume when user returns to Clubhouse tab
  const activeVideoUrlRef = useRef<string | null>(null);
  
  const { isActive: isKeepAliveActive } = useKeepAliveActivation({
    onActivate: () => {
      // Resume the current video when tab becomes active
      videoDebug('keepAlive', 'Tab activated - resuming video');
      
      // Resume HLS instance for the active video
      if (activeVideoUrlRef.current) {
        HLSPoolManager.resumeActive(activeVideoUrlRef.current);
      }
    },
    onDeactivate: () => {
      // Suspend all HLS instances when tab becomes inactive
      videoDebug('keepAlive', 'Tab deactivated - suspending HLS');
      HLSPoolManager.suspendAll();
    }
  });
  
  // Log route entry for boot timeline + debug
  useEffect(() => {
    logRouteClubhouse();
    clubhouseDebug.pageMount();
    
    return () => {
      clubhouseDebug.pageUnmount();
    };
  }, []);
  
  // Set header variant for clubhouse (glass-dark)
  useHeaderVariant('glass-dark');
  
  // Transparent status bar for immersive video bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  
  // Cinema Dim: register this page as Clubhouse
  const { setIsClubhousePage, cinemaDim } = useCinemaDimContext();
  
  // Use useLayoutEffect for route class to prevent flash
  useLayoutEffect(() => {
    document.body.classList.add('route-clubhouse');
    setIsClubhousePage(true);
    return () => {
      document.body.classList.remove('route-clubhouse');
      setIsClubhousePage(false);
    };
  }, [setIsClubhousePage]);
  
  const location = useLocation();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const prevTabRef = useRef(activeTab);
  
  // Parse focusPostId from URL params (for deep linking from "View in Clubhouse")
  const focusPostId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('focusPostId');
  }, [location.search]);
  
  // Clubhouse: explore feed with short videos only (<120s)
  const forYouQuery = useInfiniteClubhouseShorts();
  const friendsQuery = useClubhouseFriendsShorts();
  
  // Select active feed data based on tab
  const activeQuery = activeTab === 'foryou' ? forYouQuery : friendsQuery;
  const { posts, isLoading, hasMore, loadMore, isLoadingMore } = activeQuery;
  
  // Reset scroll position when tab changes
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      clubhouseDebug.tabChange(prevTabRef.current, activeTab);
      if (feedContainerRef.current) {
        feedContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);
  
  // DEBUG: Log when posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      clubhouseDebug.feedReady(posts.length);
    }
  }, [posts.length]);
  
  // Note: focusPostId is passed directly to ClubhouseVerticalGrid which calculates
  // the correct index from filteredPosts (fixes race condition and index mismatch)

  // Skeleton timing for smooth loading experience
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady 
  } = useClubhouseSkeletonTiming(posts.length > 0);
  
  // Track loading posts state for boot timeline (audit only)
  const wasShowingLoadingRef = useRef(false);
  useEffect(() => {
    const showingLoading = isLoading && posts.length === 0;
    if (showingLoading && !wasShowingLoadingRef.current) {
      wasShowingLoadingRef.current = true;
      logLoadingPostsShow();
    } else if (!showingLoading && wasShowingLoadingRef.current) {
      wasShowingLoadingRef.current = false;
      logLoadingPostsHide();
    }
  }, [isLoading, posts.length]);

  // Callback for when first video frame is ready
  const handleFirstFrameReady = useCallback(() => {
    signalFirstFrameReady();
  }, [signalFirstFrameReady]);

  // Navigation handlers
  const { handleTabClick } = useNavigationHandlers();
  
  // Track active video for progress HUD
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Composer state management
  const {
    isComposerOpen,
    mediaItems,
    setMediaItems,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openComposer,
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = React.useState(false);

  React.useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);

  // Stable key for post IDs to ensure query refreshes when posts change
  const postIdsKey = useMemo(() => posts.map(p => p.id).join(','), [posts]);

  // Check which posts the user has liked
  const { data: likedPosts = [] } = useQuery({
    queryKey: ['post-likes', user?.id, postIdsKey],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const postIds = posts.map(post => post.id);
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
    enabled: !!user?.id && posts.length > 0
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
      // Update all post-likes queries for this user (handles varying postIds keys)
      queryClient.setQueriesData(
        { queryKey: ['post-likes', user?.id] },
        (oldData: string[] | undefined) => {
          if (!oldData) return variables.action === 'like' ? [variables.postId] : [];
          
          if (variables.action === 'like') {
            return [...oldData, variables.postId];
          } else {
            return oldData.filter(id => id !== variables.postId);
          }
        }
      );
    },
    onError: (error) => {
      console.error('Like/unlike error:', error);
      toast({
        title: "Error",
        description: "We couldn't update your like. Please try again.",
        variant: "destructive",
      });
    }
  });

  // ============================================================================
  // EARLY RETURNS - Safe now that ALL hooks are declared above
  // ============================================================================
  
  // Show skeleton during rehydration
  if (isRehydrating) {
    return <ClubhouseSkeleton />;
  }

  // ============================================================================
  // EVENT HANDLERS (not hooks, can be after early returns)
  // ============================================================================

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    if (likeMutation.isPending) return; // Prevent duplicate submissions
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className={cn("clubhouse-root", cinemaDim && "cinema-dim")} 
      style={{ 
        "--bg-page": "#0F0F0F", 
        position: 'relative', 
        isolation: 'isolate', 
        zIndex: 0
      } as React.CSSProperties}
    >
      {/* Intersection sentinel for header fade-away */}
      <div id="clubhouse-sentinel" className="h-1 w-px absolute top-0 left-0" />

      {/* Skeleton Shimmer - Overlays content until first frame is ready */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
      />

      {/* Tab Toggle now rendered inside CompactHeader */}

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll relative" ref={feedContainerRef}>
        
        {/* New Season Banner */}
        {user && (
          <div className="px-4 pt-20">
            <NewSeasonBanner />
          </div>
        )}

        {/* Always render feed when posts exist (skeleton handles loading UI) */}
        {posts.length > 0 ? (
          <ClubhouseVerticalGrid
            posts={posts}
            onLike={handleLike}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onCurrentPostChange={handleCurrentPostChange}
            onActiveVideoRefChange={(ref) => {
              activeVideoRef.current = ref;
            }}
            onCommentsOpenChange={() => {}}
            onPostDetailsOpen={() => {}}
            onFirstFrameReady={handleFirstFrameReady}
            focusPostId={focusPostId ?? undefined}
          />
        ) : !isLoading ? (
          // Empty state for friends tab vs for-you tab
          activeTab === 'friends' ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-white/70 px-8 text-center">
              <p className="text-lg font-medium mb-2">No moments from friends yet</p>
              <p className="text-sm text-white/50">
                Follow golfers to see their moments here
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
              No posts available
            </div>
          )
        ) : null}
        {/* Note: "Loading posts..." is now replaced by ClubhouseSkeletonShimmer */}
      </div>

      
      {/* Post Submission Handler */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
        onMediaChange={setMediaItems}
      />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />

      {/* Comments handled inside ClubhouseVerticalFeed with cinematic CommentsPage */}

      {/* Season Recap Modal */}
      {seasonRecap && user && (
        <SeasonRecapModal
          isOpen={showRecapModal}
          onClose={() => setShowRecapModal(false)}
          seasonName={seasonRecap.seasonName}
          finalRank={seasonRecap.finalRank}
          finalXP={seasonRecap.finalXP}
          rewardTier={seasonRecap.rewardTier}
          seasonId={seasonRecap.seasonId}
          userId={user.id}
        />
      )}

      {/* Mobile Video Debug Panel - Only visible when MOBILE_VIDEO_DEBUG is true */}
      <MobileVideoDebugPanel />
    </PageRoot>
  );
};

// Wrap with tab provider
const Clubhouse = () => (
  <ClubhouseTabProvider>
    <ClubhouseContent />
  </ClubhouseTabProvider>
);

export default Clubhouse;