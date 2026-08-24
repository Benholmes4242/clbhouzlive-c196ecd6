import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSetChromeLeftSlot, useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { analyticsEvents } from '@/utils/analyticsEvents';


import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { motion, AnimatePresence } from 'framer-motion';
// Chrome owned solely by AppRoutes; no local status-bar imports.

import { logRouteClubhouse } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { usePageReady } from '@/perf/usePageReady';
import { ClubhouseTabProvider } from '@/contexts/ClubhouseTabContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';



// ── New feed components ──
import { CardFeed } from '@/components/feed/CardFeed';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { safeInitialState } from '@/components/feed/feedSnapshot';
import type { StateSnapshot } from 'react-virtuoso';

// FullscreenCarouselOverlay is referenced by legacy consumers (see comment below).
import { useClubhouseStore } from '@/store/clubhouseStore';

// ── Data hooks ──
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import type { FeedPost } from '@/components/media-system/types/media';
// buildSuggestedFeed/buildFriendsFeed are called inside the feed hooks — not here

// ── Clubhouse UI overlays ──
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';


import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useReviewerStats } from '@/hooks/useReviewerStats';

import { useActiveActor } from '@/context/ActiveActorContext';
import { getActorRouteByType } from '@/types/actor';
import { useManageableBusinessIds } from '@/hooks/useManageableBusinessIds';
import { canManagePost } from '@/lib/canManagePost';

import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

// ── Decomposed hooks ──
import { useClubhouseLifecycle } from '@/components/clubhouse/hooks/useClubhouseLifecycle';
import { usePostCourseContext, resolvePostCourseId } from '@/hooks/feed/usePostCourseContext';
import { usePostScoreIds, usePostRounds } from '@/hooks/feed/usePostRounds';
import { useRoundChainGate } from '@/hooks/feed/useRoundChainGate';
import {
  readSkeletonShapeHint,
  writeSkeletonShapeHint,
  ratioFromDimensions,
  COLD_START_SHAPE,
  type SkeletonShape,
} from '@/lib/clubhouse/skeletonShapeHint';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useActivePostDerived } from '@/components/clubhouse/hooks/useActivePostDerived';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseFollows } from '@/components/clubhouse/hooks/useClubhouseFollows';
import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { useClubhouseFeedNav } from '@/components/clubhouse/hooks/useClubhouseFeedNav';

import { MoreOptionsDrawer } from '@/components/clubhouse/MoreOptionsDrawer';
import { ClubhouseEmptyState } from '@/components/clubhouse/ClubhouseEmptyState';



// Stage 4 of the feed merge: one feed, no toggle. get_suggested_feed_v3 now
// carries the merged candidate set and ranking. This constant remains the
// per-tab key for store slots and Virtuoso snapshots, which are keyed by
// string and still need a stable owner.
const FEED_TAB = 'foryou';

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
    setStoreActiveTab(FEED_TAB);
  }, [setStoreActiveTab]);

  // H4b — ChromeIsland integration.
  // The page is keep-alive-mounted, so slot + suppress registrations are
  // gated by pathname to avoid leaking Clubhouse chrome onto other routes
  // when the user navigates away.
  const isClubhouseRoute = pathname === '/' || pathname === '/clubhouse';
  // Feed reach instrumentation. One feed, so this fires once per session as a
  // "a session reached the feed" signal.
  const feedViewedRef = useRef(false);
  useEffect(() => {
    if (feedViewedRef.current) return;
    feedViewedRef.current = true;
    analyticsEvents.track('feed_tab_viewed', { tab: 'merged' });
  }, []);

  // Clear any previously registered Clubhouse island slot (the Suggested /
  // Friends toggle was the only occupant).
  useSetChromeLeftSlot(null);
  // PGA "This Week" card takeover — suppress both island capsules while active.
  useSetChromeSuppressed(isClubhouseRoute && isTournamentCardActive);



  // Virtuoso snapshot store — retained for remount-after-error-recovery and
  // pull-to-refresh eviction. Keyed by FEED_TAB now that there is one feed.
  const virtuosoSnapshots = useRef<Record<string, StateSnapshot | undefined>>({});
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
  const activeFeed = useSuggestedFeed(user?.id);

  /**
   * Batch-idiom scope for this surface (src/lib/queryKeys.ts). What the list
   * IS — one merged suggested feed. The loaded id set is NEVER part of a key.
   */
  const FEED_SCOPE = 'clubhouse:suggested';

  const posts = activeFeed.posts;

  // C1 — batched course data for the whole visible page. ONE rpc call for all
  // posts; never one per card. Passed down into CardFeed -> FeedCard.
  const feedCourseIds = useMemo(
    () => posts.map((p) => resolvePostCourseId(p)).filter((id): id is string => !!id),
    [posts],
  );
  const courseContextMap = usePostCourseContext(feedCourseIds, FEED_SCOPE);

  // C3 — batched attached-round data. Two queries per page (score-id
  // resolution + round stats/shape); never one per card.
  const feedPostIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const postScoreIdMap = usePostScoreIds(feedPostIds, FEED_SCOPE);
  const feedScoreIds = useMemo(
    () => Array.from(postScoreIdMap.values()),
    [postScoreIdMap],
  );
  const postRoundMap = usePostRounds(feedScoreIds, FEED_SCOPE);

  // Round drill-in from a feed scorecard tap.
  const [roundSheet, setRoundSheet] = useState<{ scoreId: string; userId: string } | null>(null);

  // The round chain is TWO sequential reads that land after the posts do, so
  // the feed's own loading state clears a round trip too early and a scorecard
  // post paints without its scorecard. Hold the skeleton until both round
  // queries have settled — capped, and never for a page whose rounds will
  // never come (both hooks report a disabled query as settled).
  const roundChainSettled = postScoreIdMap.settled && postRoundMap.settled;
  // Page-level gate uses `settled` only, so a next-page fetch can never put the
  // whole feed back into a skeleton mid-scroll. Cards get the finer signal:
  // a round missing WHILE fetching still shows PostRoundShell.
  const roundChainFetching = postScoreIdMap.fetching || postRoundMap.fetching;
  const roundsReady = useRoundChainGate(roundChainSettled, !activeFeed.isLoading && posts.length > 0);

  /* SKELETON SHAPE — reserve the shape of the card that is actually coming.
     Cold start has nothing to derive from, so it falls back to the SHORTEST
     plausible card (see skeletonShapeHint): content then expands the layout
     downward instead of collapsing upward. On a warm start the localStorage
     hint (written below, synchronous and readable before first paint) supplies
     the previous first card's variant and exact media ratio. The persisted
     react-query cache hydrates too late to size the first frame, but once it
     lands posts[0] re-derives the shape here and rewrites the hint. */
  const hintRef = useRef<SkeletonShape | null>(null);
  if (hintRef.current === null) hintRef.current = readSkeletonShapeHint() ?? COLD_START_SHAPE;

  const derivedShape = useMemo<SkeletonShape | null>(() => {
    const first = posts[0];
    if (!first) return null;
    if (postScoreIdMap.has(first.id)) {
      return { variant: 'round' };
    }
    const m = first.mediaItems?.[0];
    return {
      variant: first.isReview ? 'review' : 'regular',
      mediaRatio: ratioFromDimensions(m?.width, m?.height) ?? COLD_START_SHAPE.mediaRatio,
      isVideo: m?.type === 'video',
    };
  }, [posts, postScoreIdMap]);

  useEffect(() => {
    if (derivedShape) writeSkeletonShapeHint(derivedShape);
  }, [derivedShape]);

  const skeletonShape: SkeletonShape = derivedShape ?? hintRef.current!;

  // SETTLED IS NOT "NOT LOADING": useSuggestedFeed is gated on user?.id, so the
  // terminal-empty branches below must not fire before the query has run.
  const isLoading =
    !activeFeed.isFetched || activeFeed.isLoading || (posts.length > 0 && !roundsReady);
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
  }, [isLoading, posts.length, user, authLoading]);

  // Effect 2: Once feed is ready, gate on tournament card state.
  // Also restore nav on terminal empty/error states and skeleton timeout so
  // the user is never trapped when the feed produces zero posts.
  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived with !activeFeed.isFetched above.
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
    const last = lastPostsLenRef.current[FEED_TAB] ?? 0;
    const curr = posts.length;
    if (curr < last) {
      virtuosoSnapshots.current[FEED_TAB] = undefined;
    }
    lastPostsLenRef.current[FEED_TAB] = curr;
  }, [posts.length]);
  
  // ── Active post derivation ──
  const { activePost } = useActivePostDerived(posts, activeIndex);

  // ── Optimistic like state ──
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId: user?.id, activeActor });

  // Editorial like-count query removed in C4 — CommentsSheetV2 owns its own
  // counts and the editorial mount no longer needs likesCount plumbing.



  // ── Optimistic follow state ──
  const { handleFollow, getFollowState, resetFollows } = useClubhouseFollows({ userId: user?.id });

  // ── Comments state ──
  const { commentsOpen, openComments, closeComments, getCommentCount, resetComments } = useClubhouseComments(activeActor);

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
    activeTab: FEED_TAB,
    activeFeed,
    onTabSwitch: () => {
      resetFollows();
      resetComments();
      if (!(activeFeed as { hasEverLoaded?: boolean }).hasEverLoaded) {
        resetSkeleton();
      }
    },
  });
  



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
        <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} variant={skeletonShape.variant} mediaRatio={skeletonShape.mediaRatio} isVideo={skeletonShape.isVideo} surface="card" />
      </PageRoot>
    );
  }


  // ── Terminal early return: feed finished loading with no content ──
  // Covers logged-out, empty, and error cases. We render the visible
  // sign-in/empty/error surface directly so no skeleton layer can cover it.
  // This fixes the Apple 2.1 cold-load symptom where skeletons never
  // resolved because hasPosts (posts.length > 0) was never true.
  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived with !activeFeed.isFetched above.
  if (!isLoading && posts.length === 0) {
    return (
      <ClubhouseEmptyState
        activeTab={FEED_TAB}
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
        variant={skeletonShape.variant}
        mediaRatio={skeletonShape.mediaRatio}
        isVideo={skeletonShape.isVideo}
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
          fontSize: 14,
          fontWeight: 600,
        }}>
          No internet connection
        </div>
       )}


      {/* Rehydration skeleton */}
      <ClubhouseSkeletonShimmer isVisible={showRehydrationSkeleton} isStatic={false} variant={skeletonShape.variant} mediaRatio={skeletonShape.mediaRatio} isVideo={skeletonShape.isVideo} surface="card" />

      {/* ═══ MAIN FEED AREA ═══ */}
      {(skeletonTimedOut && posts.length === 0) ? (
        <ClubhouseEmptyState
          activeTab={FEED_TAB}
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
            resetKey={`${FEED_TAB}:${feedResetKey}`}
            onRecover={() => {
              // Evict the offending snapshot and force a fresh remount.
              virtuosoSnapshots.current[FEED_TAB] = undefined;
              setFeedResetKey((k) => k + 1);
            }}
          >
            <CardFeed
              key={`${FEED_TAB}:${feedResetKey}`}
              tab={FEED_TAB}
              initialState={safeInitialState(virtuosoSnapshots.current[FEED_TAB], posts.length)}
              onSnapshot={(s) => { virtuosoSnapshots.current[FEED_TAB] = s; }}
              posts={posts}
              courseContextMap={courseContextMap}
              resolveCourseId={resolvePostCourseId}
              postScoreIdMap={postScoreIdMap}
              postRoundMap={postRoundMap}
              postRoundsSettled={roundChainSettled && !roundChainFetching}
              onRoundTap={(post, round) =>
                setRoundSheet({ scoreId: round.whsScoreId, userId: post.userId })
              }
              topPadding={'calc(env(safe-area-inset-top, 0px) + 70px)'}
              onNearEnd={handleNearEnd}
              hasNextPage={hasNextPage}
              fetchNextPage={activeFeed.fetchNextPage}
              isFetchingNextPage={activeFeed.isFetchingNextPage ?? false}
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
                virtuosoSnapshots.current[FEED_TAB] = undefined;
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
        <ClubhouseSkeletonShimmer isVisible={isLoading} isStatic={false} variant={skeletonShape.variant} mediaRatio={skeletonShape.mediaRatio} isVideo={skeletonShape.isVideo} surface="card" />
      )}


      {/* ═══ COMMENTS + MORE OPTIONS ═══ */}
      {activePost && posts.length > 0 && commentsMounted && (
        <>
          {(() => {
            const isEditorial = activePost.postType === 'course_of_week_card';
            const editorialId = isEditorial
              ? (activePost as { cardData?: { cardId?: string } }).cardData?.cardId ?? null
              : null;
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
              navigator.clipboard
                .writeText(`${window.location.origin}/post/${activePost.id}`)
                .then(() => toast.success('Link copied'))
                .catch(() => toast.error('Could not copy link'));
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

      {/* C3 — attached-round drill-in */}
      {roundSheet && (
        <RoundDetailSheet
          open
          onClose={() => setRoundSheet(null)}
          scoreId={roundSheet.scoreId}
          profileUserId={roundSheet.userId}
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
