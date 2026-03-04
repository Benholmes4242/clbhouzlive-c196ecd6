import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { NewSeasonBanner } from '@/components/feed/NewSeasonBanner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { cn } from '@/lib/utils';
import { Compass } from 'lucide-react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse, logLoadingPostsShow, logLoadingPostsHide } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { ClubhouseTabProvider, useClubhouseTab, type ClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { clubhouseDebug } from '@/debug/clubhouseDebug';
import MobileVideoDebugPanel from '@/components/debug/MobileVideoDebugPanel';

// ── New Media System imports ──
import { VideoPoolProvider } from '@/components/media-system/VideoPoolProvider';
import { FeedContainer } from '@/components/media-system/FeedContainer';
import { usePreloader } from '@/components/media-system/hooks/usePreloader';
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
import { useMediaStore } from '@/components/media-system/store/mediaStore';
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
import type { FeedPost } from '@/components/media-system/types/media';

// ── Clubhouse UI overlays ──
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { CommentsPage } from '@/components/clubhouse/cinematic/CommentsPage';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { Top100OverlayPills } from '@/components/clubhouse/Top100OverlayPills';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { useActiveActor } from '@/context/ActiveActorContext';
import { getProfilePathById } from '@/lib/profileRoutes';

/** Feed + preloader wrapper — preloader must be inside VideoPoolProvider */
function FeedWithPreloader({
  posts,
  onNearEnd,
  onRefresh,
  isRefreshing,
  hasNextPage,
  followOverrides,
  onFollowChange,
}: {
  posts: FeedPost[];
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
}) {
  usePreloader(posts);
  return (
    <FeedContainer
      posts={posts}
      onNearEnd={onNearEnd}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      hasNextPage={hasNextPage}
      followOverrides={followOverrides}
      onFollowChange={onFollowChange}
    />
  );
}

const ClubhouseContent = () => {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST - before any early returns
  // ============================================================================
  
  const { isRehydrating } = useRehydrationSafe();
  
  useEffect(() => {
    logRouteClubhouse();
    clubhouseDebug.pageMount();
    return () => { clubhouseDebug.pageUnmount(); };
  }, []);
  
  useHeaderVariant('glass-dark');
  useMedianStatusBar("dark", "transparent", true, false);
  
  useLayoutEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => { document.body.classList.remove('route-clubhouse'); };
  }, []);
  
  const location = useLocation();
  const navigate = useNavigate();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const isBusinessActor = tabContext?.isBusinessActor ?? false;
  const prevTabRef = useRef(activeTab);
  
  // Auth + actor context
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const queryClient = useQueryClient();
  
  // ── Feed hooks (both tabs stay mounted for instant switching) ──
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
  
  const posts = activeFeed.posts;
  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? true;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady 
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);
  
  // ── Media store state ──
  const activeIndex = useMediaStore((s) => s.activeIndex);
  const isMuted = useMediaStore((s) => s.isMuted);
  const toggleMute = useMediaStore((s) => s.toggleMute);
  const activePost = posts[activeIndex] ?? null;
  
  // ── Optimistic like state ──
  const likeMutation = useLikeMutation();
  const [localLikeState, setLocalLikeState] = useState<Map<string, { isLiked: boolean; count: number }>>(new Map());
  
  const handleLike = useCallback((post: FeedPost | null) => {
    if (!user?.id || !post || !activeActor) return;
    
    const current = localLikeState.get(post.id) ?? { isLiked: post.isLikedByMe, count: post.likeCount };
    const newState = { isLiked: !current.isLiked, count: current.isLiked ? current.count - 1 : current.count + 1 };
    
    setLocalLikeState(prev => new Map(prev).set(post.id, newState));
    
    likeMutation.mutate(
      { 
        postId: post.id, 
        userId: user.id, 
        actorId: activeActor.id ?? user.id, 
        actorType: activeActor.type === 'business' ? 'business' : 'personal',
        isLiked: current.isLiked,
      },
      { onError: () => setLocalLikeState(prev => new Map(prev).set(post.id, current)) }
    );
  }, [user?.id, activeActor, localLikeState, likeMutation]);
  
  const activeLikeState = localLikeState.get(activePost?.id ?? '') ?? {
    isLiked: activePost?.isLikedByMe ?? false,
    count: activePost?.likeCount ?? 0,
  };
  
  // ── Optimistic follow state ──
  const followMutation = useFollowMutation();
  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());
  
  const handleFollow = useCallback((post: FeedPost | null) => {
    if (!user?.id || !post) return;
    
    const currentlyFollowed = followOverrides.has(post.userId) 
      ? followOverrides.get(post.userId)! 
      : post.isFollowedByMe;
    
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(post.userId, !currentlyFollowed);
      return next;
    });
    
    followMutation.mutate(
      {
        targetUserId: post.userId,
        targetActorType: post.actorType,
        targetActorId: post.actorId,
        currentUserId: user.id,
        isFollowed: currentlyFollowed,
      },
      { onError: () => {
        setFollowOverrides(prev => {
          const next = new Map(prev);
          next.set(post.userId, currentlyFollowed);
          return next;
        });
      }}
    );
  }, [user?.id, followOverrides, followMutation]);
  
  const handleFollowChange = useCallback((userId: string, isFollowed: boolean) => {
    setFollowOverrides(prev => {
      const next = new Map(prev);
      next.set(userId, isFollowed);
      return next;
    });
  }, []);
  
  const isActivePostFollowed = activePost
    ? (followOverrides.has(activePost.userId) 
        ? followOverrides.get(activePost.userId)! 
        : activePost.isFollowedByMe)
    : false;
  
  // ── Comments state ──
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // ── Carousel media index for multi-media posts ──
  const carouselPositions = useMediaStore((s) => s.carouselPositions);
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const activeMediaCount = activePost?.mediaItems?.length ?? 0;
  
  // ── Share handler ──
  const handleShare = useCallback((post: FeedPost | null) => {
    if (!post) return;
    if (navigator.share) {
      navigator.share({
        title: post.displayName,
        text: post.caption || undefined,
        url: `${window.location.origin}/post/${post.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success('Link copied');
    }
  }, []);
  
  // ── Navigation to profile ──
  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    navigate(getProfilePathById(activePost.userId));
  }, [activePost, navigate]);
  
  // ── Tab switching: reset state ──
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      clubhouseDebug.tabChange(prevTabRef.current, activeTab);
      useMediaStore.getState().setActiveIndex(0);
      setLocalLikeState(new Map());
      setFollowOverrides(new Map());
      setCommentsOpen(false);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);
  
  // ── Infinite scroll ──
  const handleNearEnd = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage();
    }
  }, [activeFeed]);
  
  // ── Pull to refresh ──
  const handleRefresh = useCallback(async () => {
    activeFeed.resetSeen();
    setLocalLikeState(new Map());
    setFollowOverrides(new Map());
    await activeFeed.refetch();
  }, [activeFeed]);

  // Navigation handlers
  const { handleTabClick } = useNavigationHandlers();
  
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

  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = React.useState(false);

  React.useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);

  // ── Overlay visibility: hide during comments ──
  const overlayVisible = !commentsOpen;
  
  // ── Is active post a video? ──
  const isActiveVideo = (activePost?.mediaItems?.[0]?.hlsUrl || activePost?.mediaItems?.[0]?.mp4Url) ? true : false;
  
  // ── Is active post own? ──
  const isOwnPost = user?.id === activePost?.userId;
  
  // ── Review data for FullscreenReviewPost ──
  const activeReview = activePost?.review ?? null;
  const isActiveReview = activePost?.isReview ?? false;

  // ── Review tap handler ──
  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    navigate(`/courses/${activeReview.courseId}?tab=reviews&review=${activeReview.reviewId}`);
  }, [activeReview, navigate]);

  // ── Double-tap like from VideoPlayer ──
  // The VideoPlayer component already handles double-tap hearts visually,
  // but we need to wire the actual like mutation. This is done via the
  // FeedItem/VideoPlayer onDoubleTapLike prop which we don't have direct
  // access to from here. For now, the action rail like button is the primary like path.

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================
  
  if (isRehydrating) {
    return <ClubhouseSkeleton />;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      fixedHeight
      hasBottomNav={false}
      style={{ 
        "--bg-page": "#000000", 
        position: 'relative', 
        isolation: 'isolate', 
        zIndex: 0
      } as React.CSSProperties}
    >
      {/* Skeleton Shimmer - Overlays content until first frame is ready */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
      />

      {/* Floating top bar: Tab Toggle + Search + Profile Pill — z-40 */}
      <ClubhouseTopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBusinessActor={isBusinessActor}
        user={user}
      />

      {/* ═══ MAIN FEED AREA ═══ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-white/30 animate-pulse" />
          </div>
          <p className="text-sm text-white/50">Loading feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-lg font-semibold text-white">
            {activeTab === 'friends' ? 'No posts from friends yet' : 'No posts to show'}
          </p>
          <p className="text-sm text-white/50 mt-2">
            {activeTab === 'friends' 
              ? 'Follow golfers to see their posts here' 
              : 'Check back soon for new content'}
          </p>
        </div>
      ) : (
        <VideoPoolProvider>
          <FeedWithPreloader
            key={activeTab}
            posts={posts}
            onNearEnd={handleNearEnd}
            onRefresh={handleRefresh}
            isRefreshing={activeFeed.isRefetching}
            hasNextPage={hasNextPage}
            followOverrides={followOverrides}
            onFollowChange={handleFollowChange}
          />
        </VideoPoolProvider>
      )}

      {/* ═══ OVERLAY LAYER ═══ */}
      {activePost && posts.length > 0 && (
        <>
          {/* Review overlay — z-10 */}
          {isActiveReview && activeReview && (
            <FullscreenReviewPost
              mode="live"
              courseId={activeReview.courseId}
              courseName={activeReview.courseName}
              rating={activeReview.rating}
              reviewId={activeReview.reviewId}
              media={activePost?.mediaItems?.map((m, i) => ({
                id: m.id ?? `media-${i}`,
                media_type: m.type === 'video' ? 'video' as const : 'image' as const,
                media_url: m.imageUrl ?? m.mp4Url ?? '',
                stream_id: m.hlsUrl?.split('/').pop()?.replace('/manifest/video.m3u8', '') ?? undefined,
                poster_url: m.thumbnailUrl ?? undefined,
                display_order: i,
              })) ?? []}
              user={{
                name: activePost.displayName,
                username: activePost.username,
                avatar: activePost.avatarUrl,
              }}
              renderMedia={false}
              hideCarouselArrows
            />
          )}

          {/* REMOVED: Top100OverlayPills — not appropriate for feed context */}

          {/* Media navigation dots for multi-media posts */}
          {activeMediaCount > 1 && (
            <MediaNavigationDots
              mediaCount={activeMediaCount}
              currentIndex={currentMediaIndex}
              onJump={(idx) => useMediaStore.getState().setCarouselPosition(activeIndex, idx)}
            />
          )}

          {/* CinematicActionRail — z-40, right side */}
          <CinematicActionRail
            postId={activePost.id}
            likesCount={activeLikeState.count}
            commentsCount={activePost.commentCount}
            hasLiked={activeLikeState.isLiked}
            isMuted={isMuted}
            isVisible={overlayVisible}
            onLike={() => handleLike(activePost)}
            onComment={() => setCommentsOpen(true)}
            onShare={() => handleShare(activePost)}
            onMore={() => console.log('[More] Options for post:', activePost?.id)}
            onMuteToggle={toggleMute}
            isVideo={isActiveVideo}
            hasNextMedia={currentMediaIndex < activeMediaCount - 1}
            hasPrevMedia={currentMediaIndex > 0}
            onNextMedia={activeMediaCount > 1 
              ? () => useMediaStore.getState().setCarouselPosition(activeIndex, currentMediaIndex + 1) 
              : undefined}
            onPrevMedia={activeMediaCount > 1 
              ? () => useMediaStore.getState().setCarouselPosition(activeIndex, currentMediaIndex - 1) 
              : undefined}
          />

          {/* CreatorCapsule — z-50, bottom-left */}
          <CreatorCapsule
            user={{
              id: activePost.userId,
              name: activePost.displayName,
              username: activePost.username,
              avatar: activePost.avatarUrl,
            }}
            caption={activePost.caption}
            golfCourse={activePost.review ? {
              id: activePost.review.courseId,
              name: activePost.review.courseName,
            } : undefined}
            isFollowing={isActivePostFollowed}
            isOwnPost={isOwnPost}
            isVisible={overlayVisible}
            onFollow={() => handleFollow(activePost)}
            onViewProfile={handleViewProfile}
            isReview={isActiveReview}
            reviewData={isActiveReview && activeReview ? {
              rating: activeReview.rating,
              courseName: activeReview.courseName,
              courseId: activeReview.courseId,
              tierLabel: activeReview.rating >= 9 ? 'Outstanding' : activeReview.rating >= 7 ? 'Excellent' : 'Good',
              sourceReviewId: activeReview.reviewId,
            } : undefined}
            onReviewTap={handleReviewTap}
          />

          {/* Comments sheet — z-100+ */}
          <CommentsPage
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            postId={activePost.id}
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={activePost.displayName}
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
          />
        </>
      )}

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

      {/* Mobile Video Debug Panel */}
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
