import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { cn } from '@/lib/utils';
import { Compass, Flag, EyeOff, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

// ── New feed components ──
import { SnapFeed } from '@/components/feed/SnapFeed';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { useClubhouseStore } from '@/store/clubhouseStore';

// ── Data hooks ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
import type { FeedPost, TournamentResultFeedPost } from '@/components/media-system/types/media';
import { TournamentResultCard } from '@/components/clubhouse/cinematic/TournamentResultCard';
import { useTournamentLiveFeed } from '@/components/media-system/hooks/useTournamentLiveFeed';
import { buildSuggestedFeed, buildFriendsFeed, injectLiveTournamentCards } from '@/components/media-system/utils/feedAlgorithm';

// ── Clubhouse UI overlays ──
import { CinematicActionRail } from '@/components/clubhouse/cinematic/CinematicActionRail';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';

import { useActiveActor } from '@/context/ActiveActorContext';
import { getProfilePathById } from '@/lib/profileRoutes';

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
      className="border-white/[0.08] rounded-t-[20px]"
      style={{
        background: 'rgba(13, 13, 13, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="p-4 space-y-1">
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onReport}
        >
          <Flag className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Report this post</span>
        </button>
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onNotInterested}
        >
          <EyeOff className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Not interested</span>
        </button>
        <button
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/10 transition-colors"
          onClick={onCopyLink}
        >
          <LinkIcon className="w-5 h-5 text-white/50" />
          <span className="text-[15px] text-white/80">Copy link</span>
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </DrawerContent>
  </Drawer>
);


const ClubhouseContent = () => {
  const { isRehydrating } = useRehydrationSafe();
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
  }, []);

  useHeaderVariant('glass-dark');
  useMedianStatusBar("dark", "transparent", true, false, true, pathname);
  
  useLayoutEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => { document.body.classList.remove('route-clubhouse'); };
  }, []);
  
  const navigate = useNavigate();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const isBusinessActor = tabContext?.isBusinessActor ?? false;
  
  // Auth + actor context
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  
  // ── Network status ──
  const { isOnline } = useNetworkStatus();
  
  // ── Store wiring ──
  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const carouselPositions = useClubhouseStore(s => s.carouselPositions);
  const currentMediaIndex = carouselPositions.get(activeIndex) ?? 0;

  // ── GlobalAudio bridge ──
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  useEffect(() => {
    useClubhouseStore.getState().setIsMuted(isGloballyMuted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setGlobalMute(isMuted);
  }, [isMuted, setGlobalMute]);

  // ── Feed hooks ──
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed(user?.id);
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
  
  // ── Live tournament injection ──
  const { livePosts, liveTourSlugs } = useTournamentLiveFeed(user?.id);
  const livePostIds = useMemo(() => livePosts.map(p => p.id).join(','), [livePosts]);
  const liveTourSlugsKey = liveTourSlugs.join(',');
  
  const posts = useMemo(() => {
    if (activeTab === 'foryou') {
      const base = buildSuggestedFeed(activeFeed.posts);
      return injectLiveTournamentCards(base, livePosts, liveTourSlugs);
    } else {
      return buildFriendsFeed(activeFeed.posts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFeed.posts, activeTab, livePostIds, liveTourSlugsKey]);

  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? true;
  
  // Skeleton timing
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady,
    resetSkeleton,
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);
  
  // ── Lifecycle ──
  useClubhouseLifecycle();
  
  // ── Active post derivation ──
  const { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo } = useActivePostDerived(posts, activeIndex);
  const isTournamentCardActive =
    activePost?.postType === 'tournament_result' ||
    activePost?.postType === 'tournament_live';

  // Hide bottom nav when tournament card is active
  const { setVisible: setBottomNavVisible } = useBottomNavigation();
  useEffect(() => {
    setBottomNavVisible(!isTournamentCardActive);
    return () => setBottomNavVisible(true);
  }, [isTournamentCardActive, setBottomNavVisible]);
  
  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState, resetLikes } = useClubhouseLikes({ userId: user?.id, activeActor });
  const activeLikeState = getActiveLikeState(activePost);
  
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
    onTabSwitch: () => { resetLikes(); resetFollows(); resetComments(); },
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

  useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);
  
  const isOwnPost = user?.id === activePost?.userId;

  // ── Review tap handler ──
  const handleReviewTap = useCallback(() => {
    if (!activeReview) return;
    navigate(`/courses/${activeReview.courseId}?tab=reviews&review=${activeReview.reviewId}`);
  }, [activeReview, navigate]);

  const showRehydrationSkeleton = isRehydrating;

  return (
    <PageRoot 
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
      />

      {/* Floating top bar */}
      <div style={{
        opacity: isTournamentCardActive ? 0 : 1,
        pointerEvents: isTournamentCardActive ? 'none' : 'auto',
        transition: 'opacity 0.18s ease',
        position: 'relative',
        zIndex: 50,
      }}>
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
        />
      </div>

      {/* Offline indicator */}
      {!isOnline && (
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

      {/* Rehydration skeleton */}
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} />

      {/* ═══ MAIN FEED AREA ═══ */}
      {!isLoading && posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 64px)' }}
        >
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
          />

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
      ) : null}

      {/* ═══ COMMENTS + MORE OPTIONS (tournament cards) ═══ */}
      {activePost && posts.length > 0 &&
        (activePost.postType === 'tournament_result' || activePost.postType === 'tournament_live') && (
        <>
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={activePost.id}
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={activePost.displayName}
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={activeLikeState?.count ?? null}
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

      {/* ═══ COMMENTS + MORE OPTIONS (regular posts) ═══ */}
      {activePost && posts.length > 0 && !isTournamentCardActive && (
        <>
          <CommentsSheet
            isOpen={commentsOpen}
            onClose={closeComments}
            postId={activePost.id}
            currentUserId={user?.id}
            creatorUserId={activePost.userId}
            creatorName={activePost.displayName}
            creatorAvatar={activePost.avatarUrl}
            caption={activePost.caption}
            theme="dark"
            likesCount={activeLikeState?.count ?? null}
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
