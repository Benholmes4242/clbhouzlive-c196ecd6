import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import NavigationBar from '@/components/bottom-navigation/NavigationBar';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import { useChromeAnchors } from '@/hooks/useChromeAnchors';


import { useInfiniteClubhouseShorts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CommentsModal from '@/components/posts/CommentsModal';
import { NewSeasonBanner } from '@/components/feed/NewSeasonBanner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

const Clubhouse = () => {
  // Set header variant for clubhouse (glass-dark)
  useHeaderVariant('glass-dark');
  
  const location = useLocation();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  
  // Clubhouse: explore feed with short videos only (<120s)
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteClubhouseShorts();

  // Navigation handlers
  const { activeTab, handleTabClick } = useNavigationHandlers();
  
  // Track active video for progress HUD
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Route guard: only show progress bar on /clubhouse and when no overlay is active
  const state = location.state as { backgroundLocation?: Location } | null;
  const isOverlayActive = !!state?.backgroundLocation;
  const isClubhouseRoute = location.pathname.startsWith('/clubhouse') || location.pathname === '/';
  const showProgressBar = isClubhouseRoute && !isOverlayActive;
  
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


  const [headerActiveTab, setHeaderActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const isMobile = useIsMobile();
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
  
  // Track overlay states
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  
  // Chrome auto-hide state - force hidden when any overlay is open
  const isAnyOverlayOpen = isProfileDrawerOpen || isCommentsDrawerOpen || isComposerOpen;
  const chromeControls = useChromeState({
    forceHidden: isAnyOverlayOpen,
    disabled: false // Set to true via env var for emergency rollback
  });
  
  // Chrome anchors for dynamic re-positioning
  useChromeAnchors();

  // Check which posts the user has liked
  const { data: likedPosts } = useQuery({
    queryKey: ['post-likes', user?.id],
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

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  };

  const handleShare = () => {
    console.log('Share clicked');
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    console.log('[DEBUG] Clubhouse: handleTabClickWithCamera called with:', tab);
    
    if (tab.isAction && tab.id === 'post') {
      // Open composer directly with empty state
      console.log('[DEBUG] Clubhouse: Opening composer directly');
      openComposerWithFiles([]);
    } else {
      // Handle regular navigation
      console.log('[DEBUG] Clubhouse: Handling regular navigation');
      handleTabClick(tab);
    }
  };

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Debug logging for Clubhouse page
  useEffect(() => {
    console.log("[DEBUG] Clubhouse page mounted, headerActiveTab:", headerActiveTab);
  }, [headerActiveTab]);

  // Mark body for Clubhouse-specific CSS overrides
  useEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => document.body.classList.remove('route-clubhouse');
  }, []);

  // No loading state needed - Suspense at route level handles it
  // if (isLoading && posts.length === 0) return null;

  return (
    <div ref={clubhouseRootRef} className="clubhouse-root" style={{ position: 'relative', isolation: 'isolate', zIndex: 0 }}>
      {/* Intersection sentinel for header fade-away */}
      <div id="clubhouse-sentinel" className="h-1 w-px absolute top-0 left-0" />
      
      <ClubhouseHeaderNew />

      {/* Edge gradients when chrome is hidden (Apple-level polish) */}
      {chromeControls.chromeState === 'hidden' && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 via-black/10 to-transparent z-[45]" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-[45]" />
        </>
      )}

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        {/* New Season Banner */}
        {user && (
          <div className="px-4 pt-20">
            <NewSeasonBanner />
          </div>
        )}

        {posts.length > 0 ? (
          <ClubhouseVerticalFeed
            posts={posts}
            onLike={handleLike}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onCurrentPostChange={handleCurrentPostChange}
            onScroll={chromeControls.handleScroll}
            onTap={chromeControls.handleTap}
            onTouchStart={chromeControls.handleTouchStart}
            onTouchMove={chromeControls.handleTouchMove}
            onTouchEnd={chromeControls.handleTouchEnd}
            onActiveVideoRefChange={(ref) => {
              activeVideoRef.current = ref;
            }}
            onCommentsOpenChange={setIsCommentsDrawerOpen}
            onProfileOpenChange={setIsProfileDrawerOpen}
            chromeState={chromeControls.chromeState}
            onPostDetailsOpen={() => console.log('Post details opened')}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-muted-foreground">Loading posts...</div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen text-muted-foreground">
            No posts available
          </div>
        )}
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
    </div>
  );
};

export default Clubhouse;