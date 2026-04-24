import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { ProfileCompleteNudge } from '@/components/clubhouse/ProfileCompleteNudge';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { Compass, Flag, EyeOff, Link as LinkIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';



// ── New feed components ──
import { SnapFeed } from '@/components/feed/SnapFeed';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { FullscreenCarouselOverlay } from '@/components/media/FullscreenCarouselOverlay';
import { CarouselDots } from '@/components/media/CarouselDots';
import { useClubhouseStore } from '@/store/clubhouseStore';

// ── Data hooks ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
import { usePGACard } from '@/components/media-system/hooks/usePGACard';
import { useEditorialCards } from '@/components/media-system/hooks/useEditorialCards';
import { buildSuggestedFeedWithEditorials, initSessionSeed } from '@/components/media-system/utils/feedAlgorithm';
import type { FeedPost, PGACardFeedPost, CourseOfWeekCardFeedPost } from '@/components/media-system/types/media';
// buildSuggestedFeed/buildFriendsFeed are called inside the feed hooks — not here

// ── Clubhouse UI overlays ──
import CommentsSheet from '@/components/comments/CommentsSheet';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';

import { useActiveActor } from '@/context/ActiveActorContext';
import { getProfilePathById } from '@/lib/profileRoutes';

import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

// ── Decomposed hooks ──
import { useClubhouseLifecycle } from '@/components/clubhouse/hooks/useClubhouseLifecycle';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useClubhouseFeedNav } from '@/components/clubhouse/hooks/useClubhouseFeedNav';

/** Shared More Options Drawer */
interface MoreOptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: () => void;
  onNotInterested: () => void;
  onCopyLink: () => void;
}

const MoreOptionsDrawer: React.FC<MoreOptionsDrawerProps> = ({
  open, onOpenChange, onReport, onNotInterested, onCopyLink
}) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent
      className="rounded-t-[20px]"
      style={{
        background: '#F8FAFC',
        border: 'none',
      }}
    >
      {/* Flat rows */}
      <div style={{ padding: '4px 0 0' }}>
        <button
          onClick={onReport}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' as const }}
        >
          <Flag className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
          <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Report this post</span>
        </button>
        <button
          onClick={onNotInterested}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' as const }}
        >
          <EyeOff className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
          <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Not interested</span>
        </button>
        <button
          onClick={onCopyLink}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
        >
          <LinkIcon className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.35)' }} />
          <span style={{ fontSize: 15, color: '#0F172A', fontWeight: 500 }}>Copy link</span>
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)]" style={{ minHeight: 16 }} />
    </DrawerContent>
  </Drawer>
);


const ClubhouseContent = () => {
  const { isRehydrating } = useRehydrationSafe();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
  }, [queryClient]);
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
  }, []);

  useHeaderVariant('glass-dark');
  useMedianStatusBar("dark", "transparent", true, false, true, pathname);
  
  // route-clubhouse class is now applied by ClubhouseWrapped (eagerly loaded)
  // to prevent white flash during lazy chunk loading
  
  const navigate = useNavigate();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const isBusinessActor = tabContext?.isBusinessActor ?? false;
  
  // Auth + actor context
  const { user, loading: authLoading } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  
  // ── Network status ──
  const { isOnline } = useNetworkStatus();
  
  // ── Store wiring ──
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const carouselPositions = useClubhouseStore(s => s.carouselPositions);
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;
  const isTournamentCardActive = useClubhouseStore(s => s.isTournamentCardActive);





  // ── Hide chrome when PGA card is active ──
   const { setVisible: setBottomNavVisible } = useBottomNavigation();
  // Effect 1: Hide nav on mount, show only when skeleton resolves
  useEffect(() => {
    setBottomNavVisible(false);
    return () => { setBottomNavVisible(true); };
  }, [setBottomNavVisible]);


  // ── Feed hooks ──
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const { pgaCard } = usePGACard(user?.id);
  const { courseOfWeekCard } = useEditorialCards(user?.id);
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
  
  const posts = useMemo(() => {
    if (activeTab === 'foryou') {
      // Seed session entropy here — userId is available in this scope
      if (user?.id) initSessionSeed(user.id);

      return buildSuggestedFeedWithEditorials(
        activeFeed.posts,
        [
          // PGA card temporarily hidden (Zurich Classic team-event week — re-enable after 2026-04-28)
          null,
          courseOfWeekCard as FeedPost | null,
        ]
      );
    }
    return activeFeed.posts;
  }, [
    activeFeed.posts,
    activeTab,
    pgaCard,
    courseOfWeekCard,
    user?.id,
  ]);

  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? false;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady,
    resetSkeleton,
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);

  // Effect 2: Once feed is ready, gate on tournament card state
  useEffect(() => {
    if (!skeletonVisible) {
      setBottomNavVisible(!isTournamentCardActive);
    }
  }, [skeletonVisible, isTournamentCardActive, setBottomNavVisible]);

  // ── Lifecycle ──
  useClubhouseLifecycle();
  
  // ── Active post derivation ──
  const { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo } = useActivePostDerived(posts, activeIndex);
  
  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState, resetLikes } = useClubhouseLikes({ userId: user?.id, activeActor });
  const activeLikeState = getActiveLikeState(activePost);

  // ── Editorial card like count for CommentsSheet ──
  const editorialCardId = ['course_of_week_card'].includes(activePost?.postType ?? '')
    ? (activePost as any)?.cardData?.cardId
    : null;

  const { data: editorialLikeCount } = useQuery({
    queryKey: ['editorial-card-likes-count', editorialCardId],
    queryFn: async () => {
      if (!editorialCardId) return 0;
      const { count } = await supabase
        .from('editorial_card_likes')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', editorialCardId);
      return count ?? 0;
    },
    enabled: !!editorialCardId,
    staleTime: 0,
  });
  
  // ── Optimistic follow state ──
  const { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows } = useClubhouseFollows({ userId: user?.id });
  const isActivePostFollowed = getFollowState(activePost);
  
  // ── Comments state ──
  const { commentsOpen, overlayVisible, openComments, closeComments, handleCommentPosted, handleCommentDeleted, getCommentCount, resetComments } = useClubhouseComments();
  const activeCommentCount = getCommentCount(activePost);
  
  // ── Share / Report / Not Interested ──
  const { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested } = useClubhouseShare(user?.id);
  
  // ── Feed navigation ──
  const { handleNearEnd, handleRefresh } = useClubhouseFeedNav({
    activeTab,
    activeFeed,
    onTabSwitch: () => { resetFollows(); resetComments(); },
  });
  
  // ── Carousel media index ──
  const activeMediaCount = activePost?.mediaItems?.length ?? 0;
  
  // ── Navigation to profile ──
  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    navigate(getProfilePathById(activePost.userId));
  }, [activePost, navigate]);

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  const { data: reviewerStats } = useReviewerStats(activePost?.userId);

  useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);
  
  const isOwnPost = user?.id === activePost?.userId;

  // ── Review tap handler ──
  const handleReviewTap = useCallback(() => {
    if (!activeReview || !activePost) return;
    openReviewSheet({
      user: {
        id: activePost.userId ?? '',
        name: activePost.displayName ?? '',
        username: activePost.username,
        avatar: activePost.avatarUrl,
      },
      courseId: activeReview.courseId ?? '',
      courseName: activeReview.courseName ?? '',
      rating: activeReview.rating ?? 0,
      reviewId: activeReview.reviewId,
      courseCountry: activeReview.courseCountry,
      courseRegion: activeReview.courseRegion,
      courseSubCountry: activeReview.courseSubCountry,
      reviewText: activeReview.reviewText,
      breakdown: activeReview.breakdown ?? null,
      reviewerStats: reviewerStats ?? null,
    });
  }, [activeReview, activePost, openReviewSheet, reviewerStats]);

  const showRehydrationSkeleton = isRehydrating;

  // Guard: wait for auth to resolve before evaluating feed state
  if (authLoading) {
    return <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />;
  }

  return (
    <PageRoot 
      immersiveStatusBar
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      fixedHeight
      hasBottomNav={false}
      style={{ 
        "--bg-page": "var(--color-black, #000000)", 
        position: 'relative', 
        isolation: 'isolate', 
        zIndex: 0
      } as React.CSSProperties}
    >
      {/* Skeleton Shimmer */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
        variant={posts[0]?.isReview ? 'review' : 'regular'}
        isVideo={posts[0]?.mediaItems?.[0]?.type === 'video'}
      />

      {/* Floating top bar — hidden when PGA card active */}
      <ClubhouseTopBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          const targetFeed = tab === 'friends' ? friendsFeed : suggestedFeed;
          if (targetFeed.isLoading) {
            resetSkeleton();
          }
        }}
        isBusinessActor={isBusinessActor}
        user={user}
        carouselCount={posts[activeIndex]?.mediaItems?.length ?? 0}
        carouselIndex={currentMediaIndex}
        hidden={isTournamentCardActive}
      />

      {/* Offline indicator — hidden on editorial cards */}
      {!isOnline && !isTournamentCardActive && (
        <div style={{
          position: 'fixed',
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
          left: 16,
          right: 16,
          zIndex: 200,
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 16px',
          textAlign: 'center',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
        }}>
          No internet connection
        </div>
       )}

      {/* Profile completeness nudge — new users only, first 7 days, hidden on editorial cards */}
      {!isTournamentCardActive && <ProfileCompleteNudge />}

      {/* Rehydration skeleton */}
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} variant={posts[0]?.isReview ? 'review' : 'regular'} isVideo={posts[0]?.mediaItems?.[0]?.type === 'video'} />

      {/* ═══ MAIN FEED AREA ═══ */}
      {!isLoading && posts.length === 0 ? (
        activeTab === 'friends' ? (
          <div
            className="flex flex-col w-full"
            style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 72px)' }}
          >
            <div className="flex flex-col items-center px-8 text-center pb-6">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white/30" />
              </div>
              <p className="text-[17px] font-semibold text-white mb-1">
                No posts from friends yet
              </p>
              <p className="text-[13px] text-white/50 leading-relaxed">
                Follow golfers below to start building your feed
              </p>
            </div>
            <SuggestedCreatorsShelf
              userId={user?.id}
              variant="dark"
              title="Golfers to follow"
              showViewAll={true}
              onViewAll={() => navigate('/golfers')}
            />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
            style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 64px)' }}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Compass className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-lg font-semibold text-white">No posts to show</p>
            <p className="text-sm text-white/50 mt-2">Check back soon for new content</p>
          </div>
        )
      ) : posts.length > 0 ? (
        <>
          <SnapFeed
            posts={posts}
            activeTab={activeTab}
            onNearEnd={handleNearEnd}
            onRefresh={handleRefresh}
            isRefreshing={activeFeed.isRefetching}
            hasNextPage={hasNextPage}
            followOverrides={followOverrides}
            onFollowChange={handleFollowChange}
            onFirstFrameReady={signalFirstFrameReady}
            onLike={(post) => handleLike(post)}
            onComment={openComments}
            onShare={(post) => handleShare(post)}
            getLikeState={(post) => getActiveLikeState(post)}
            getCommentCount={(post) => getCommentCount(post)}
            isFullscreen
          />

          {/* Windowed carousel dots — centred under top chrome */}
          {(activePost?.mediaItems?.length ?? 0) > 1 && (
            <div
              className="fixed pointer-events-none flex justify-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
                left: 0,
                right: 0,
                zIndex: 9029,
              }}
            >
              <CarouselDots
                count={activePost!.mediaItems!.length}
                active={currentMediaIndex}
                variant="windowed"
              />
            </div>
          )}

          {/* Overlay layer — action rail, creator capsule, scrubber, dots */}
          <FeedOverlayLayer
            posts={posts}
            onLike={handleLike}
            onComment={openComments}
            onShare={handleShare}
            onMore={() => setMoreOptionsOpen(true)}
            getLikeState={getActiveLikeState}
            getCommentCount={getCommentCount}
            getFollowState={getFollowState}
            onFollow={handleFollow}
            onViewProfile={handleViewProfile}
            onReviewTap={handleReviewTap}
            overlayVisible={overlayVisible}
            isOwnPost={isOwnPost}
            golfCourse={golfCourse}
            activeReview={activeReview}
            isActiveReview={isActiveReview}
          />
        </>
      ) : (
        <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />
      )}

      {/* ═══ COMMENTS + MORE OPTIONS ═══ */}
      {activePost && posts.length > 0 && (
        <>
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={
              activePost.postType === 'pga_card'
                ? (activePost as unknown as PGACardFeedPost).cardData.postId
                : activePost.postType === 'course_of_week_card'
                ? (activePost as any).cardData.cardId
                : activePost.id
            }
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={
              ['pga_card', 'course_of_week_card'].includes(activePost.postType ?? '')
                ? 'Clbhouz'
                : activePost.displayName
            }
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={
              activePost.postType === 'course_of_week_card'
                ? (editorialLikeCount ?? 0)
                : activeLikeState?.count ?? null
            }
            likeSource={
              activePost.postType === 'course_of_week_card'
                ? 'editorial'
                : 'post'
            }
            editorialCardId={
              activePost.postType === 'course_of_week_card'
                ? (activePost as any).cardData.cardId
                : undefined
            }
            onCommentPosted={() => handleCommentPosted(activePost)}
            onCommentDeleted={() => activePost && handleCommentDeleted(activePost.id, activePost.commentCount)}
          />
          <MoreOptionsDrawer
            open={moreOptionsOpen}
            onOpenChange={setMoreOptionsOpen}
            onReport={() => handleReport(activePost)}
            onNotInterested={() => handleNotInterested(activePost)}
            onCopyLink={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${activePost.id}`);
              toast.success('Link copied');
              setMoreOptionsOpen(false);
            }}
          />
        </>
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

      {/* Review Bottom Sheet now renders via root-level ReviewBottomSheetPortal */}
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
