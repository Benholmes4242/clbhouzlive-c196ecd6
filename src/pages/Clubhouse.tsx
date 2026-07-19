import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClubhouseIslandTabs } from '@/components/clubhouse/ClubhouseIslandTabs';
import { useSetChromeLeftSlot, useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';

import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { motion, AnimatePresence } from 'framer-motion';
// Chrome owned solely by AppRoutes; no local status-bar imports.

import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { usePageReady } from '@/perf/usePageReady';
import { ClubhouseTabProvider, useClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';



// ── New feed components ──
import { CardFeed, type CardFeedHandle } from '@/components/feed/CardFeed';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { safeInitialState } from '@/components/feed/feedSnapshot';
import type { StateSnapshot } from 'react-virtuoso';

// FullscreenCarouselOverlay is referenced by legacy consumers (see comment below).
import { useClubhouseStore } from '@/store/clubhouseStore';

// ── Data hooks ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/hooks/useFriendsFeed';
import type { FeedPost } from '@/components/media-system/types/media';
// buildSuggestedFeed/buildFriendsFeed are called inside the feed hooks — not here

// ── Clubhouse UI overlays ──
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { FriendsEmptyState } from '@/components/clubhouse/FriendsEmptyState';

import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';

import { useActiveActor } from '@/context/ActiveActorContext';
import { getActorRouteByType } from '@/types/actor';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';

import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

// ── Decomposed hooks ──
import { useClubhouseLifecycle } from '@/components/clubhouse/hooks/useClubhouseLifecycle';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useClubhouseFeedNav } from '@/components/clubhouse/hooks/useClubhouseFeedNav';

import { MoreOptionsDrawer } from '@/components/clubhouse/MoreOptionsDrawer';
import { ClubhouseEmptyState } from '@/components/clubhouse/ClubhouseEmptyState';



const ClubhouseContent = () => {
  const { isRehydrating } = useRehydrationSafe();



  // Note: do NOT invalidate the suggested feed on every mount — it caused a
  // cold refetch + full video/HLS teardown each time the user returned to
  // Clubhouse, tipping the WebView over its renderer/video-element budget and
  // producing a black/white screen. React Query's staleTime handles freshness.
  const { pathname } = useLocation();
  
  useEffect(() => {
    logRouteClubhouse();
  }, []);

  useHeaderVariant('solid-light');
  // NOTE: useHeaderVariant('solid-light') targets the legacy GlobalHeader
  // (CompactHeader) variant + status-bar coordination. Left in place —
  // ChromeIsland ignores it, but other consumers still read the variant.
  // Chrome (shield + status bar) owned solely by AppRoutes. Do not write here.

  
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
  const isTournamentCardActive = useClubhouseStore(s => s.isTournamentCardActive);
  const setStoreActiveTab = useClubhouseStore(s => s.setActiveTab);

  // Keep the store's active-tab mirror in sync so legacy consumers
  // (FeedOverlayLayer, top-bar carousel chip, FullscreenCarouselOverlay)
  // read the correct tab's slot after a switch.
  useEffect(() => {
    setStoreActiveTab(activeTab);
  }, [activeTab, setStoreActiveTab]);

  // H4b — ChromeIsland integration.
  // The page is keep-alive-mounted, so slot + suppress registrations are
  // gated by pathname to avoid leaking Clubhouse chrome onto other routes
  // when the user navigates away.
  const isClubhouseRoute = pathname === '/' || pathname === '/clubhouse';
  const handleIslandTabChange = useCallback((tab: 'foryou' | 'friends') => {
    if (tab === activeTab) return;
    // Preserve outgoing tab's Virtuoso snapshot before the keyed remount.
    cardFeedRef.current?.captureSnapshot();
    setActiveTab(tab);
  }, [activeTab, setActiveTab]);
  const islandSlot = useMemo(
    () =>
      isClubhouseRoute ? (
        <ClubhouseIslandTabs
          activeTab={activeTab}
          onTabChange={handleIslandTabChange}
          isBusinessActor={isBusinessActor}
        />
      ) : null,
    [isClubhouseRoute, activeTab, handleIslandTabChange, isBusinessActor],
  );
  useSetChromeLeftSlot(islandSlot);
  // PGA "This Week" card takeover — suppress both island capsules while active.
  useSetChromeSuppressed(isClubhouseRoute && isTournamentCardActive);



  // Per-tab Virtuoso snapshots — captured on switch-AWAY (CardFeed unmount)
  // and restored on switch-BACK so each tab retains its exact scroll offset.
  const virtuosoSnapshots = useRef<Record<string, StateSnapshot | undefined>>({});
  // Imperative ref into CardFeed so we can capture the outgoing tab's
  // snapshot BEFORE flipping activeTab (the keyed remount tears down the
  // instance, which makes a post-flip capture impossible).
  const cardFeedRef = useRef<CardFeedHandle | null>(null);
  // Per-tab last-known posts length. When a feed shrinks (PTR trims, cache
  // eviction, refetch resets) below the snapshot's referenced ranges,
  // restoring the snapshot crashes Virtuoso. Evict the snapshot in that
  // case so the tab remounts fresh.
  const lastPostsLenRef = useRef<Record<string, number>>({});
  // Bumped on error-boundary recovery to force a fresh CardFeed remount.
  const [feedResetKey, setFeedResetKey] = useState(0);





  // ── Hide chrome when PGA card is active ──
   const { setVisible: setBottomNavVisible } = useBottomNavigation();
  // Effect 1: Hide nav on mount, show only when skeleton resolves
  useEffect(() => {
    setBottomNavVisible(false);
    return () => { setBottomNavVisible(true); };
  }, [setBottomNavVisible]);


  // ── Feed hooks ──
  // Editorial cards (PGA This Week, Course of the Week) moved to Home in Phase 2.
  // Clubhouse feed is now purely social posts + algorithmic suggestions.
  const suggestedFeed = useSuggestedFeed(user?.id);
  const friendsFeed = useFriendsFeed({
    userId: user?.id,
    mode: 'latest',
    interleave: true,
    pageSize: 10,
    enabled: activeTab === 'friends',
  });
  const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;

  const posts = activeFeed.posts;

  const isLoading = activeFeed.isLoading;
  const hasNextPage = activeFeed.hasNextPage ?? false;
  
  // Skeleton timing — first-content-ready contract
  const {
    skeletonVisible,
    skeletonMode,
    signalFirstContentReady,
    resetSkeleton,
  } = useClubhouseSkeletonTiming(!isLoading && posts.length > 0);

  // Perf: signal content-painted when skeleton resolves (posts loaded +
  // first video canplaythrough + min-hold). This is the LCP-equivalent for
  // the feed and drives the `content` settle number in nav summaries.
  usePageReady(skeletonMode === 'hidden');


  // Apple 2.1 safety net: never let the skeleton be the terminal state.
  // If the feed has not produced posts within 12s, stop blocking on
  // skeletons so the empty/error surface can render and the reviewer
  // (or any user behind a VPN / restrictive webview) sees a usable screen.
  const [skeletonTimedOut, setSkeletonTimedOut] = useState(false);
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      setSkeletonTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => {
      setSkeletonTimedOut(true);
    }, 12000);
    return () => window.clearTimeout(id);
  }, [isLoading, posts.length, activeTab, user, authLoading]);

  // Effect 2: Once feed is ready, gate on tournament card state.
  // Also restore nav on terminal empty/error states and skeleton timeout so
  // the user is never trapped when the feed produces zero posts.
  const isTerminalEmpty = !isLoading && posts.length === 0;
  useEffect(() => {
    if (!skeletonVisible || isTerminalEmpty || skeletonTimedOut) {
      setBottomNavVisible(!isTournamentCardActive);
    }
  }, [skeletonVisible, isTerminalEmpty, skeletonTimedOut, isTournamentCardActive, setBottomNavVisible]);

  // ── Lifecycle ──
  useClubhouseLifecycle();

  // ── Snapshot integrity ──
  // If the active tab's posts array shrinks materially between renders,
  // the previously captured Virtuoso snapshot may reference indices that
  // no longer exist. Restoring it would iterate an undefined item and
  // crash on `.index`. Evict on shrink so the next mount is fresh.
  useEffect(() => {
    const last = lastPostsLenRef.current[activeTab] ?? 0;
    const curr = posts.length;
    if (curr < last) {
      virtuosoSnapshots.current[activeTab] = undefined;
    }
    lastPostsLenRef.current[activeTab] = curr;
  }, [activeTab, posts.length]);
  
  // ── Active post derivation ──
  const { activePost, golfCourse, activeReview, isActiveReview, isActiveVideo } = useActivePostDerived(posts, activeIndex);
  
  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState, resetLikes } = useClubhouseLikes({ userId: user?.id, activeActor });
  const activeLikeState = getActiveLikeState(activePost);

  // Editorial like-count query removed in C4 — CommentsSheetV2 owns its own
  // counts and the editorial mount no longer needs likesCount plumbing.


  
  // ── Optimistic follow state ──
  const { followOverrides, handleFollow, handleFollowChange, getFollowState, resetFollows } = useClubhouseFollows({ userId: user?.id });
  const isActivePostFollowed = getFollowState(activePost);
  
  // ── Comments state ──
  const { commentsOpen, overlayVisible, openComments, closeComments, getCommentCount, resetComments } = useClubhouseComments(activeActor);

  // Conditionally mount CommentsSheet so its hooks/subtrees don't exist while closed.
  // Keep it mounted through the exit animation (~500ms spring) so close still animates.
  const [commentsMounted, setCommentsMounted] = useState(false);
  useEffect(() => {
    if (commentsOpen) {
      setCommentsMounted(true);
      return;
    }
    const t = setTimeout(() => setCommentsMounted(false), 500);
    return () => clearTimeout(t);
  }, [commentsOpen]);
  const activeCommentCount = getCommentCount(activePost);
  
  // ── Share / Report / Not Interested ──
  const { moreOptionsOpen, setMoreOptionsOpen, handleShare, handleReport, handleNotInterested } = useClubhouseShare(user?.id);
  
  // ── Feed navigation ──
  // Skeleton single owner: onTabSwitch (post-commit). Re-show only when the
  // now-active feed has never loaded (uncached). Cached -> instant, like IG/TikTok.
  const { handleNearEnd, handleRefresh } = useClubhouseFeedNav({
    activeTab,
    activeFeed,
    onTabSwitch: () => {
      resetFollows();
      resetComments();
      if (!(activeFeed as any).hasEverLoaded) {
        resetSkeleton();
      }
    },
  });
  
  // ── Carousel media index ──
  const activeMediaCount = activePost?.mediaItems?.length ?? 0;
  
  // ── Navigation to profile ──
  const handleViewProfile = useCallback(() => {
    if (!activePost) return;
    navigate(getActorRouteByType(activePost.actorType, activePost.actorId));
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
  
  const manageableBusinessIds = useManageableBusinessIds(user?.id);
  const isOwnPost = canManagePost(
    activePost
      ? {
          userId: activePost.userId,
          actorType: activePost.actorType === 'business' ? 'business' : 'personal',
          actorId: activePost.actorId,
        }
      : null,
    user?.id,
    manageableBusinessIds,
  );

  // ── Review tap handler ──
  const handleReviewTap = useCallback((post: FeedPost) => {
    const review = post.review;
    if (!review) return;
    const isActiveTapped = activePost?.id === post.id;
    openReviewSheet({
      user: {
        id: post.userId ?? '',
        name: post.displayName ?? '',
        username: post.username,
        avatar: post.avatarUrl,
      },
      courseId: review.courseId ?? '',
      courseName: review.courseName ?? '',
      rating: review.rating ?? 0,
      reviewId: review.reviewId,
      courseCountry: review.courseCountry,
      courseRegion: review.courseRegion,
      courseSubCountry: review.courseSubCountry,
      reviewText: review.reviewText,
      breakdown: review.breakdown ?? null,
      // Only pass reviewerStats when the tapped post matches the active post
      // (stats are fetched for the active reviewer only).
      reviewerStats: isActiveTapped ? (reviewerStats ?? null) : null,
    });
  }, [activePost, openReviewSheet, reviewerStats]);

  // Only show rehydration skeleton while content is actually loading or present.
  // Without this guard it could re-cover the terminal empty-state.
  const showRehydrationSkeleton = isRehydrating && (isLoading || posts.length > 0);




  // Guard: wait for auth to resolve before evaluating feed state — but
  // bounded by useSupabaseSession's own 8s safety timeout, so this can
  // never hang indefinitely.
  if (authLoading) {
    return (
      <PageRoot>
        <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} surface="card" />
      </PageRoot>
    );
  }


  // ── Terminal early return: feed finished loading with no content ──
  // Covers logged-out, empty, and error cases. We render the visible
  // sign-in/empty/error surface directly so no skeleton layer can cover it.
  // This fixes the Apple 2.1 cold-load symptom where skeletons never
  // resolved because hasPosts (posts.length > 0) was never true.
  if (!isLoading && posts.length === 0) {
    return (
      <ClubhouseEmptyState
        activeTab={activeTab}
        user={user}
        isError={activeFeed.isError}
        onSignIn={() => navigate('/auth')}
        onRetry={() => activeFeed.refetch?.()}
        userId={user?.id}
        onSeeYourFeed={() => activeFeed.refetch?.()}
      />
    );
  }




  return (
    <PageRoot 
      immersiveStatusBar
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      fixedHeight
      hasBottomNav={false}
      style={{ 
        "--bg-page": "#15171F", 
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
        surface="card"
      />

      {/* Chrome island slot + suppression — replaces ClubhouseTopBar (H4b).
       * Slot registered only while this route is active so keep-alive
       * doesn't leak the Clubhouse tabs onto other pages. */}



      {/* Offline indicator — hidden on editorial cards */}
      {!isOnline && !isTournamentCardActive && (
        <div style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
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
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} variant={posts[0]?.isReview ? 'review' : 'regular'} isVideo={posts[0]?.mediaItems?.[0]?.type === 'video'} surface="card" />

      {/* ═══ MAIN FEED AREA ═══ */}
      {(skeletonTimedOut && posts.length === 0) ? (
        <ClubhouseEmptyState
          activeTab={activeTab}
          user={user}
          isError={activeFeed.isError}
          onSignIn={() => navigate('/auth')}
          onRetry={() => activeFeed.refetch?.()}
          userId={user?.id}
          onSeeYourFeed={() => activeFeed.refetch?.()}
        />
      ) : posts.length > 0 ? (
        <>
          <FeedErrorBoundary
            resetKey={`${activeTab}:${feedResetKey}`}
            onRecover={() => {
              // Evict the offending snapshot and force a fresh remount.
              virtuosoSnapshots.current[activeTab] = undefined;
              setFeedResetKey((k) => k + 1);
            }}
          >
            <CardFeed
              ref={cardFeedRef}
              key={`${activeTab}:${feedResetKey}`}
              tab={activeTab}
              initialState={safeInitialState(virtuosoSnapshots.current[activeTab], posts.length)}
              onSnapshot={(s) => { virtuosoSnapshots.current[activeTab] = s; }}
              posts={posts}
              topPadding={'calc(env(safe-area-inset-top, 0px) + 70px)'}
              onNearEnd={handleNearEnd}
              hasNextPage={hasNextPage}
              onLike={(post) => handleLike(post)}
              onComment={(post) => openComments(post)}
              onShare={(post) => handleShare(post)}
              onProfile={(post) => navigate(getActorRouteByType(post.actorType, post.actorId), { state: post.actorType === 'business' ? { source: 'feed' } : undefined })}
              onCourse={(post) => post.courseId && navigate(`/courses/${post.courseId}`)}
              onReviewTap={(post) => handleReviewTap(post)}
              getLikeState={(post) => {
                const s = getActiveLikeState(post);
                if (!s) return null;
                return { liked: s.isLiked, count: s.count ?? post.likeCount ?? 0 };
              }}
              getCommentCount={(post) => getCommentCount(post)}
              onFollow={handleFollow}
              currentUserId={user?.id}
              onRefresh={() => {
                // PTR — the list may be trimmed/rebuilt. Drop the active
                // tab's snapshot so we don't restore stale ranges after
                // the refetch resolves.
                virtuosoSnapshots.current[activeTab] = undefined;
                return handleRefresh();
              }}
              isRefreshing={activeFeed.isRefetching}
              onFirstContentReady={signalFirstContentReady}
            />
          </FeedErrorBoundary>
        </>
      ) : (
        // Guard: only render skeleton while feed is actually loading.
        // The terminal early return above handles !isLoading && posts.length === 0.
        <ClubhouseSkeletonShimmer isVisible={isLoading} isStatic={false} surface="card" />
      )}


      {/* ═══ COMMENTS + MORE OPTIONS ═══ */}
      {activePost && posts.length > 0 && commentsMounted && (
        <>
          {(() => {
            const isEditorial = activePost.postType === 'course_of_week_card';
            const editorialId = isEditorial ? (activePost as any).cardData?.cardId : null;
            return (
              <CommentsSheetV2
                isOpen={commentsOpen}
                onClose={closeComments}
                targetType={isEditorial ? 'editorial' : 'post'}
                targetId={isEditorial ? (editorialId ?? '') : activePost.id}
              />
            );
          })()}

          <MoreOptionsDrawer
            open={moreOptionsOpen}
            onOpenChange={setMoreOptionsOpen}
            post={activePost}
            currentUserId={user?.id}
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
