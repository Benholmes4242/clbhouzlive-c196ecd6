import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { CourseNameLink } from '@/components/shared/CourseNameLink';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
/**
 * ReviewBottomSheet — DARK floating glass review card.
 *
 * Single overlay used from both entry points:
 *   1. Clubhouse "Read review" card CTA
 *   2. Fullscreen viewer "read review ›" chrome
 * Both open through useReviewSheetStore + ReviewBottomSheetPortal.
 *
 * STACKING (BRIEF_REVIEW_SHEET_PHOTOS_AND_FOOTER). Two directions exist and a
 * single pair of numbers cannot express both:
 *   viewer → sheet:  the viewer's "read review ›" chrome opens THIS sheet while
 *                    the viewer stays open, so the sheet must paint ABOVE it —
 *                    REVIEW_SHEET_Z (240) > FS_OVERLAY_Z (200). Unchanged.
 *   sheet → viewer:  tapping media opens the review's real post via get_review_post
 *                    in the fullscreen viewer (openWithOrigin, FLIP from the tile),
 *                    which must paint ABOVE this sheet. The viewer takes its z
 *                    AT OPEN TIME: this sheet passes VIEWER_ABOVE_SHEETS_Z
 *                    (12200), clearing the sheet and any likers sheet. When the
 *                    viewer was already open beneath (viewer -> sheet -> photo)
 *                    the store's one-level restore returns to it on close. The
 *                    sheet stays mounted underneath and keeps its scroll
 *                    position; FS_OVERLAY_Z (200) remains the default.
 * Both overlays portal to document.body, so this panel's translateZ(0) and the
 * scroller's -webkit-overflow-scrolling cannot clamp either of them.
 *
 * SURFACE HISTORY. This began translucent with rgba(24,28,24,0.62) and a 14px
 * blur. It became opaque on 5 Aug because review prose over a busy page muddied.
 * Glass was reconsidered and rejected on 18 Sep 2026, then overturned by
 * decision later the same day so review and scorecard read as one family. It is
 * now glass with a deliberately denser fill than the scorecard: prose needs more
 * separation from the full-bleed photograph or paused video that may remain
 * mounted beneath it. Blur stays 30px; density, not heavier blur, does the work.
 * 28 Oct 2026: moved to the shared neutral GLASS_CARD with the glances.
 */


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Share } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { activeTop100CourseIds, type Top100MembershipRow } from '@/components/courses/browse/playedRings';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { REACTED } from '@/lib/reactionKind';

import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useReviewMedia, type ReviewMediaItem } from './useReviewMedia';
import { reviewFeedPost } from '@/lib/reviews/reviewFeedPost';
import { shareReview } from '@/lib/reviews/shareReview';
import { useReviewFallback } from '@/hooks/useReviewFallback';
import { MentionText } from '@/components/mentions/MentionText';
import { REVIEW_SHEET_Z, VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';
import { footerTapProbeEnabled, recordFooterTap } from './footerTapProbe';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { getPublicProfilePath } from '@/lib/profileRoutes';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { GLASS_CARD, GLASS_BACKDROP } from '@/lib/tokens/glass';
import { LikedByRow } from '@/components/likes/LikedByRow';
/* REVIEW CARD REDESIGN — this sheet renders ReactionAction then CommentAction
   directly (like, comment, share). RoundEngagementActions keeps its
   comment-then-heart order for round surfaces. A REVIEW TAKES THE THUMB
   (kind="helpful"); the verb stays "like", so LikedByRow keeps no kind. */
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { CommentAction } from '@/components/explore-tab-new/courseled/CommentAction';
import type { FeedCommentPreview as FeedCommentPreviewData } from '@/hooks/feed/useFeedCommentPreview';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';

/* Dark surface tokens (analytical ramp). BODY sits at 72% rather than the 62%
   a caption would take: this sheet's payload is three paragraphs of member
   prose, and body copy needs more separation than a label does. */
/** REVIEW CARD REDESIGN — two rows of three; the sixth carries "+N". */
export const REVIEW_MEDIA_GRID_CAP = 6;

const INK = '#F8FAFC';
const BODY = 'rgba(248,250,252,0.82)';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
/* The photo placeholder needs one step more fill than a hairline border; the
   fill is not brightened to compensate for the dark surface. */
const TRACK = 'rgba(255,255,255,0.14)';


export interface ReviewBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string | null;
  };
  courseId: string;
  courseName: string;
  rating: number;
  reviewId?: string | null;
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
  breakdown?: {
    design?: number | null;
    conditions?: number | null;
    clubhouse?: number | null;
    facilities?: number | null;
  } | null;
  reviewerStats?: {
    coursesRated?: number | null;
    averageRating?: number | null;
    memberSince?: string | null;
  } | null;
  reviewDate?: string | null;
  courseSubtitle?: string | null;
  /** Optional review media, when the calling surface already holds it. */
  media?: ReviewMediaItem[] | null;
  /** Host-resolved values freeze at the readiness gate for this open. */
  resolvedReviewText?: string | null;
  resolvedBreakdown?: ReviewBottomSheetProps['breakdown'];
  resolvedMedia?: ReviewMediaItem[] | null;
  resolvedAggregate?: {
    avg_overall_score?: number | null;
    review_count?: number | null;
    avg_design_score?: number | null;
    avg_condition_score?: number | null;
    avg_clubhouse_score?: number | null;
    avg_facilities_score?: number | null;
  } | null;
  /** G2.5 — false while the prose read is still open; the empty-state line stays silent. */
  proseSettled?: boolean;
  reactionCount?: number;
  /** G4.3 — the review's like (thumb glyph). Same content_reactions row LatestReviews toggles. */
  reactionMine?: boolean;
  onToggleReaction?: () => void;
  reactionHidden?: boolean;
  /** G7.2(c) — comments_v2 target_type 'review', keyed on the review id. */
  commentCount?: number;
  /** Accepted for caller compatibility; the redesigned card shows no comment preview. */
  commentPreview?: FeedCommentPreviewData | null;
}


/** §S.1 / §S.2 — one threshold for every comparison against the course. Below
 *  three ratings the course "average" is substantially this review. */
export const REVIEW_SHEET_COMPARE_MIN = 3;

/** §S.1 — signed deviation, one decimal, TRUE MINUS (U+2212). Never coloured. */
export function formatDeviation(delta: number): string {
  const r = Math.round(delta * 10) / 10;
  if (r === 0) return '0.0';
  return r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

/** §S.3 — the review's age in words. Reads the review date only: a member's
 *  join year is not when they played, so it is never a fallback. */
const REVIEW_TILE_MAX_W = 115;
const tileDpr = () => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

export function playedAgo(iso?: string | null, now: number = Date.now()): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const d = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  // review_date is when the review was written — there is no play date.
  const unit = (n: number, w: string) => `Reviewed ${n} ${w}${n === 1 ? '' : 's'} ago`;
  if (d < 1) return 'Reviewed today';
  if (d < 7) return unit(d, 'day');
  if (d < 30) return unit(Math.floor(d / 7), 'week');
  if (d < 365) return unit(Math.max(1, Math.floor(d / 30)), 'month');
  return unit(Math.floor(d / 365), 'year');
}

/** REVIEW CARD REDESIGN — "{|d|} above" / "{|d|} below" / "Level with", one decimal. */
export function comparisonLead(delta: number): string {
  if (Math.abs(delta) < 0.05) return 'Level with';
  return `${Math.abs(Math.round(delta * 10) / 10).toFixed(1)} ${delta > 0 ? 'above' : 'below'}`;
}

export const ReviewBottomSheet: React.FC<ReviewBottomSheetProps> = ({
  isOpen,
  onClose,
  user,
  courseId,
  courseName,
  rating,
  reviewId,
  courseCountry,
  courseRegion,
  courseSubCountry,
  reviewText,
  breakdown,
  reviewerStats,
  reviewDate,
  media,
  resolvedReviewText,
  resolvedBreakdown,
  resolvedMedia,
  resolvedAggregate,
  proseSettled = true,
  reactionCount = 0,
  reactionMine = false,
  onToggleReaction,
  reactionHidden = false,
  commentCount = 0,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('courses');

  // Live reviewer stats (React Query dedupes with earlier fetches).
  const { data: liveStats } = useReviewerStats(user?.id);
  const effectiveStats = liveStats ?? reviewerStats ?? null;

  // Some feed RPCs (get_explore_feed, get_watch_shorts, get_course_media,
  // get_long_form_videos) don't return review_text / per-category scores.
  // Lazy-fetch straight from course_ratings so the sheet renders identically
  // regardless of which surface opened it.
  const hasText = !!reviewText;
  const hasBreakdown = !!breakdown && (
    breakdown.design != null ||
    breakdown.conditions != null ||
    breakdown.clubhouse != null ||
    breakdown.facilities != null
  );
  const { data: fallback } = useReviewFallback({
    reviewId: reviewId ?? null,
    enabled: isOpen,
    hasText,
    hasBreakdown,
  });
  const effectiveReviewText = resolvedReviewText !== undefined ? resolvedReviewText : (reviewText ?? fallback?.reviewText ?? null);
  const effectiveBreakdown = resolvedBreakdown !== undefined ? resolvedBreakdown : (hasBreakdown ? breakdown : (fallback?.breakdown ?? breakdown ?? null));
  if (isOpen) {
    // eslint-disable-next-line no-console
    console.debug('[review-sheet] state', {
      reviewId,
      propHasText: !!reviewText,
      fallbackHasText: !!fallback?.reviewText,
      effectiveHasText: !!effectiveReviewText,
    });
  }

  const swipeStartRef = useRef<{ y: number; lastY: number; startedAt: number; active: boolean } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [cardAnimating, setCardAnimating] = useState(true);
  const onCardTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    let node = event.target as HTMLElement | null;
    let bodyAtTop = true;
    while (node) {
      if (node.hasAttribute('data-review-scroll')) {
        bodyAtTop = node.scrollTop <= 0;
        break;
      }
      node = node.parentElement;
    }
    swipeStartRef.current = { y: touch.clientY, lastY: touch.clientY, startedAt: Date.now(), active: bodyAtTop };
  }, []);
  const onCardTouchMove = useCallback((event: React.TouchEvent) => {
    const current = swipeStartRef.current;
    if (!current?.active) return;
    const touch = event.touches[0];
    const dy = touch.clientY - current.y;
    current.lastY = touch.clientY;
    if (dy <= 8) return;
    event.preventDefault();
    setDragY(dy);
  }, []);
  const onCardTouchEnd = useCallback(() => {
    const current = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!current?.active) return;
    const dy = current.lastY - current.y;
    const elapsed = Math.max(1, Date.now() - current.startedAt);
    if (dy > 120 || dy / elapsed > 0.6) onClose();
    else setDragY(0);
  }, [onClose]);

  /* FOOTER TAP PROBE (D2) — flag-gated on-device hit-test drift logger.
     Raw pointer coords vs. the button's rect, plus ms-since-open so a cluster
     inside the entry spring (~300ms) can be told apart from scroller drift.
     Reads NOTHING from elementFromPoint: see footerTapProbe.ts for why that
     read cannot detect drift. Zero cost unless the flag is set. */
  const footerRef = useRef<HTMLDivElement | null>(null);
  const openedAtRef = useRef<number>(0);
  useEffect(() => {
    if (isOpen) openedAtRef.current = performance.now();
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    if (!footerTapProbeEnabled()) return;
    const footer = footerRef.current;
    if (!footer) return;
    const onDown = (e: PointerEvent) => {
      try { recordFooterTap(e, footer, openedAtRef.current); } catch {}
    };
    // Capture phase + passive: observes without altering dispatch, so the
    // buttons' own onClick behaviour is untouched while the probe is on.
    footer.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    return () => footer.removeEventListener('pointerdown', onDown, { capture: true } as any);
  }, [isOpen]);

  // Also dismiss the fullscreen viewer (if this sheet was opened from it)
  // so the destination route is actually visible.
  const closeFullscreen = useCallback(() => {
    try {
      const fs = useFullscreenFeedStore.getState();
      if (fs.isOpen) fs.close();
    } catch {}
  }, []);

  const handleGoToProfile = useCallback(() => {
    if (!user.id) return;
    onClose();
    closeFullscreen();
    navigate(getPublicProfilePath({ id: user.id, username: user.username }));
  }, [user.id, user.username, navigate, onClose, closeFullscreen]);

  /* CB69 — the title's course name: close the sheet, then fullscreen, then
     CourseNameLink opens /courses/:courseId. */
  const handleCourseNameBeforeNavigate = useCallback(() => {
    onClose();
    closeFullscreen();
  }, [onClose, closeFullscreen]);

  /* §S.5 — every rating of the course: the reviews tab, no single review. */
  const handleSeeAll = useCallback(() => {
    if (!courseId) return;
    onClose();
    closeFullscreen();
    navigate(`/courses/${courseId}?tab=reviews`);
  }, [courseId, navigate, onClose, closeFullscreen]);

  const handleShare = useCallback(() => {
    if (!reviewId || !courseId) return;
    shareReview({ reviewId, courseId, courseName, authorName: user.name });
  }, [courseId, courseName, reviewId, user.name]);

  const locationStr = [courseSubCountry || courseRegion, courseCountry]
    .filter(Boolean)
    .join(', ');

  const initials = useMemo(
    () =>
      user.name
        .split(/[\s.]/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join(''),
    [user.name],
  );

  // REFERENCE POINT (§3a) — reuses the shared aggregates hook, so on a page
  // that already read them (course detail, discover) React Query dedupes and
  // no extra network call happens. No SQL was needed.
  const { data: agg } = useCourseRatingAggregates(isOpen ? courseId : undefined);
  const effectiveAggregate = resolvedAggregate !== undefined ? resolvedAggregate : agg;
  const communityAvg = effectiveAggregate?.avg_overall_score ?? null;
  const ratingCount = effectiveAggregate?.review_count ?? 0;
  const canCompareCourse = ratingCount >= REVIEW_SHEET_COMPARE_MIN;
  const showReference =
    rating != null && communityAvg != null && canCompareCourse;

  // MEDIA (§3c) — prop when a caller has it, otherwise a lazy read.
  const { data: fetchedMedia } = useReviewMedia(reviewId ?? null, isOpen && !media?.length);
  const allMedia = (resolvedMedia !== undefined ? resolvedMedia : (media?.length ? media : fetchedMedia)) ?? [];
  /* CANONICAL_FULLSCREEN_VIEWER: the viewer post is the one review adapter's,
     carrying engagementTarget review, so the viewer's pills act on the review. */
  const reviewPost = useMemo(() => (reviewId ? reviewFeedPost({
    reviewId, userId: user.id, username: user.username, displayName: user.name, avatarUrl: user.avatar,
    text: effectiveReviewText, createdAt: reviewDate, courseId, courseName, rating,
    courseCountry, courseRegion, courseSubCountry,
    breakdown: effectiveBreakdown ? {
      design: effectiveBreakdown.design ?? null, conditions: effectiveBreakdown.conditions ?? null,
      clubhouse: effectiveBreakdown.clubhouse ?? null, facilities: effectiveBreakdown.facilities ?? null,
    } : null,
    media: allMedia.map((m) => ({ id: m.id, type: m.mediaType, url: m.mediaUrl, posterUrl: m.posterUrl, streamId: m.streamId, width: m.width, height: m.height })),
  }) : null), [reviewId, user.id, user.username, user.name, user.avatar, effectiveReviewText, reviewDate, courseId, courseName, rating, courseCountry, courseRegion, courseSubCountry, effectiveBreakdown, allMedia]);
  const mediaTotal = allMedia.length;
  /* §3 — at most nine tiles (three rows); the ninth carries "+N" when more exist.
     Order is fetchReviewMedia's (cover first, then created_at) — never re-sorted here. */
  const mediaGrid = allMedia.slice(0, REVIEW_MEDIA_GRID_CAP);
  const hiddenCount = Math.max(0, mediaTotal - REVIEW_MEDIA_GRID_CAP);

  const metaSeg = playedAgo(reviewDate);

  /* Comparison sentence — two plain clauses, never coloured. */
  const reviewerAvg = effectiveStats?.averageRating ?? null;
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const ownClause = rating != null && reviewerAvg != null
    ? <><b style={{ fontWeight: 600, color: INK }}>{comparisonLead(rating - reviewerAvg)}</b>{` ${firstName}'s usual ${reviewerAvg.toFixed(1)}`}</>
    : null;
  const courseClause = showReference && communityAvg != null
    ? <><b style={{ fontWeight: 600, color: INK }}>{comparisonLead(rating - communityAvg)}</b>{` the course's ${communityAvg.toFixed(1)} from ${ratingCount} ratings`}</>
    : null;
  const coursesRated = effectiveStats?.coursesRated ?? null;
  const metaLine = [
    metaSeg,
    coursesRated ? `${coursesRated} ${coursesRated === 1 ? 'course' : 'courses'} rated` : null,
  ].filter(Boolean).join(' \u00b7 ');

  /* TOP 100 stamp — one read while open; loading or a failed read = no stamp. */
  const top100Query = useQuery({
    queryKey: ['courses', 'review-sheet-top100', courseId],
    enabled: isOpen && !!courseId,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, top100_lists!inner(slug, is_active)')
        .eq('course_id', courseId)
        .eq('top100_lists.is_active', true);
      if (error) throw error;
      return activeTop100CourseIds((data ?? []) as unknown as Top100MembershipRow[]).has(courseId);
    },
  });
  const onTop100 = top100Query.data === true;

  const paragraphs = useMemo(() => {
    if (!effectiveReviewText) return [];
    return effectiveReviewText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }, [effectiveReviewText]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim stays below REVIEW_SHEET_Z; the fullscreen viewer remains mounted beneath it. */}
          <motion.div
            key="review-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isOpen ? 0.18 : 0.14, ease: isOpen ? 'easeOut' : 'easeIn' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: REVIEW_SHEET_Z,
              ...GLASS_BACKDROP,
            }}
          />

          {/* Panel — the one blur surface. */}
          <motion.div
            key="review-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-sheet-title"
            data-review-glass-card="true"
            onAnimationStart={() => setCardAnimating(true)}
            onAnimationComplete={() => setCardAnimating(false)}
            onTouchStart={onCardTouchStart}
            onTouchMove={onCardTouchMove}
            onTouchEnd={onCardTouchEnd}
            onTouchCancel={() => { swipeStartRef.current = null; setDragY(0); }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ opacity: { duration: isOpen ? 0.18 : 0.14, ease: isOpen ? 'easeOut' : 'easeIn' }, scale: { duration: isOpen ? 0.24 : 0.14, ease: isOpen ? [0.32, 0.72, 0, 1] : 'easeIn' } }}
            style={{
              position: 'fixed',
              top: '50%',
              left: 14,
              right: 14,
              zIndex: REVIEW_SHEET_Z + 1,
              width: 'auto',
              height: 'auto',
              maxHeight: '82dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              ...GLASS_CARD,
              color: INK,
              containerType: 'inline-size',
              translate: `0 calc(-50% + ${dragY}px)`,
              willChange: cardAnimating ? 'transform, opacity' : 'auto',
            }}
          >
            <style>{`@media (prefers-reduced-motion: reduce) { [data-review-glass-card="true"] { transform: none !important; } }`}</style>
            <style>{`[data-liked-stack-short]{display:none}@container (max-width:300px){[data-liked-stack-long]{display:none}[data-liked-stack-short]{display:inline}}`}</style>
            {/* ─── PINNED HEADER ─────────────────────────────── */}
            <div style={{ flex: '0 0 auto', padding: '20px 20px 0', position: 'relative' }}>
              <div data-review-sheet-header="true" style={{ position: 'relative', zIndex: 2, minWidth: 0 }}>
                {(locationStr || onTop100) && (
                  <div data-review-kicker="true" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {locationStr && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        {locationStr}
                      </span>
                    )}
                    {onTop100 && (
                      <span data-review-top100="true" style={{ flex: 'none', height: 18, padding: '0 7px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.28)', display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', color: INK }}>
                        TOP 100
                      </span>
                    )}
                  </div>
                )}
                {/* CB69 — no overflow clip on the h1: it would clip the name's 44px hit area. */}
                <h1 id="review-sheet-title" style={{ margin: 0, marginTop: 7, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: INK, minWidth: 0 }}>
                  <CourseNameLink
                    as="div"
                    courseId={courseId || null}
                    onBeforeNavigate={handleCourseNameBeforeNavigate}
                    textProps={{ 'data-review-sheet-course-name': 'true' }}
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {courseName}
                  </CourseNameLink>
                </h1>

                <button
                  type="button"
                  data-review-player-row="true"
                  aria-label={`View ${user.name}'s profile`}
                  onClick={handleGoToProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, minHeight: 44, width: '100%', padding: 0, margin: '14px 0 0', border: 0, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <SquircleAvatar size={36} src={user.avatar} alt={user.name} userId={user.id} fallback={initials} hairlineRing />
                  <span data-sheet-player-name="true" style={{ flex: 1, minWidth: 0, display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><InlineProMemberName userId={user.id}>{user.name}</InlineProMemberName></span>
                    {metaLine && <span data-review-meta="true" style={{ display: 'block', marginTop: 2, fontSize: 12, lineHeight: 1.35, color: DIM }}>{metaLine}</span>}
                  </span>
                  <ChevronRight size={16} strokeWidth={2.2} color={DIM} aria-hidden style={{ flex: 'none' }} />
                </button>
              </div>

              {/* Shared review score row (signed-off mock), unchanged. */}
              <ReviewScoreRow
                style={{ marginTop: 16 }}
                overall={rating ?? null}
                breakdown={{
                  design: effectiveBreakdown?.design ?? null,
                  condition: effectiveBreakdown?.conditions ?? null,
                  clubhouse: effectiveBreakdown?.clubhouse ?? null,
                  facilities: effectiveBreakdown?.facilities ?? null,
                }}
              />

              {(ownClause || courseClause) && (
                <p data-review-calibration="true" style={{ margin: 0, marginTop: 14, fontSize: 12.5, lineHeight: 1.45, color: MUTE, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {ownClause}
                  {ownClause && courseClause ? ' \u00b7 ' : null}
                  {courseClause}
                </p>
              )}
            </div>

            {/* ─── SCROLL REGION ──────────────────────────────── */}
            <div
              data-review-scroll="true"
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                padding: '18px 20px 8px',
                minHeight: 0,
              }}
            >
              {/* G2.5 — this line CLAIMS the review has no prose, so it may only
                  speak once the prose query has settled. The subject gate makes
                  that always true from the portal; the prop makes a lie
                  impossible rather than merely unlikely. */}
              {paragraphs.length === 0 && proseSettled ? (
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: MUTE,
                  }}
                >
                  No written review. The score speaks for itself.
                </div>
              ) : (
                paragraphs.map((para, i) => (
                  <MentionText
                    key={i}
                    as="p"
                    text={para}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: BODY,
                      margin: 0,
                      marginBottom: i === paragraphs.length - 1 ? 0 : 12,
                    }}
                  />
                ))
              )}

              {/* MEDIA STRIP (§3c) — up to three thumbnails, 78 tall, r12.
                  INTERACTIVE: each tile is a real button that opens the
                  canonical fullscreen viewer (VIEWER_ABOVE_SHEETS_Z) at that
                  index, expanding from the tile, with the sheet left mounted so
                  its scroll position survives the round trip. Video shows poster + glyph and never
                  autoplays here. */}
              {mediaGrid.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {/* Square three-wide grid; the grid owns the rounded corners. */}
                  <div data-review-media-grid="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, borderRadius: 14, overflow: 'hidden' }}>
                    {mediaGrid.map((m, i) => {
                      // §4a — index off allMedia explicitly, not the rendered slice.
                      const index = allMedia.indexOf(m);
                      const isOverflowTile = i === REVIEW_MEDIA_GRID_CAP - 1 && hiddenCount > 0;
                      const kindLabel = m.mediaType === 'video' ? 'Video' : 'Photo';
                      const derivedPoster = m.mediaType === 'video' ? holeMediaPoster({ media_type: 'video', media_url: m.mediaUrl, poster_url: m.posterUrl, stream_id: m.streamId }) : '';
                      // The shared helper may return an unrecognised source unchanged.
                      // A playback URL is never a review tile image or opening poster.
                      const videoPoster = derivedPoster !== m.mediaUrl ? derivedPoster : '';
                      return (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={isOverflowTile ? `Show all ${mediaTotal}` : `${kindLabel} ${index + 1} of ${mediaTotal}`}
                        onClick={(e) => {
                          const post = reviewPost;
                          if (!post || post.mediaItems.length === 0) return;
                          // The adapter keeps media ids, so the tapped tile resolves by id.
                          const matchedIndex = post.mediaItems.findIndex((item) => item.id === m.id);
                          const mediaIndex = matchedIndex >= 0
                            ? matchedIndex
                            : Math.max(0, Math.min(index, post.mediaItems.length - 1));
                          openWithOrigin({
                            openedFrom: 'review-sheet',
                            posts: [post],
                            index: 0,
                            ...(matchedIndex >= 0 ? { mediaId: post.mediaItems[matchedIndex]?.id } : {}),
                            mediaIndex,
                            originEl: e.currentTarget,
                            posterUrl: m.mediaType === 'video' ? videoPoster || null : m.posterUrl ?? m.mediaUrl,
                            zIndex: VIEWER_ABOVE_SHEETS_Z,
                          });
                        }}
                        style={{
                          minWidth: 0,
                          aspectRatio: '1 / 1',
                          padding: 0,
                          border: 'none',
                          borderRadius: 0,
                          overflow: 'hidden',
                          background: TRACK,
                          position: 'relative',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        className="review-photo-tile"
                      >
                        {(m.mediaType === 'image' || videoPoster) && <img
                          // Grid tiles request their drawn size x DPR via Cloudflare
                          // (tiles are ≤115 x 78px). Originals (24MP+) trip iOS
                          // subsampling, which drops EXIF orientation. Fullscreen
                          // still opens the original.
                          src={m.mediaType === 'video'
                            ? videoPoster
                            : buildImageThumbnailUrl(m.mediaUrl, { width: Math.round(REVIEW_TILE_MAX_W * tileDpr()) })}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />}
                        {m.mediaType === 'video' && !isOverflowTile && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                background: 'rgba(14,18,22,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Play size={12} strokeWidth={2.5} color="#FFFFFF" fill="#FFFFFF" />
                            </div>
                          </div>
                        )}
                        {isOverflowTile && (
                          <div
                            aria-hidden
                            data-review-media-overflow="true"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(10,10,12,0.62)',
                              color: '#FFFFFF',
                              fontSize: 15,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            +{hiddenCount}
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* §S.5 — every rating of the course; at one rating there is nothing else to see. */}
              {courseId && ratingCount >= 2 && (
                <button
                  type="button"
                  data-review-see-all="true"
                  onClick={handleSeeAll}
                  style={{ marginTop: 18, minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', gap: 4, border: 'none', padding: 0, background: 'transparent', color: INK, font: 'inherit', fontSize: 13.5, fontWeight: 600, textAlign: 'left', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`See all ${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'} of ${courseName}`}
                  </span>
                  <ChevronRight size={14} strokeWidth={2.4} color={MUTE} aria-hidden style={{ flexShrink: 0 }} />
                </button>
              )}
              {/* §S.4 — the text runs UNDER the boundary rather than stopping
                  dead at it. Sticky, so it holds the bottom edge while scrolling;
                  no clamp, no "read more" — this sheet is the full review. */}
              <div
                aria-hidden
                data-review-scroll-fade="true"
                style={{
                  position: 'sticky',
                  bottom: -8,
                  height: 28,
                  marginTop: -28,
                  marginLeft: -20,
                  marginRight: -20,
                  pointerEvents: 'none',
                  background: `linear-gradient(to bottom, transparent, ${GLASS_CARD.background})`,
                }}
              />
            </div>


            {/* ─── PINNED FOOTER — one 44px row: like, comment, share; likers right. */}
            <div
              ref={footerRef}
              data-review-engagement="true"
              style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, padding: '2px 12px calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
            >
              {reviewId && onToggleReaction && (
                <>
                  <ReactionAction
                    hidden={reactionHidden}
                    count={reactionCount}
                    reacted={reactionMine}
                    onToggle={onToggleReaction}
                    label={t('scorecard.likeReview', 'Like this review')}
                    size={19}
                    kind="helpful"
                    footerBox={{ color: MUTE, reactedColor: REACTED }}
                  />
                  <CommentAction
                    count={commentCount}
                    onOpen={() => setCommentsOpen(true)}
                    label={t('scorecard.commentReview', 'Comment on this review')}
                    size={19}
                    footerBox={{ color: MUTE }}
                  />
                </>
              )}
              {reviewId && courseId && (
                <button
                  type="button"
                  data-review-share="true"
                  aria-label="Share this review"
                  onClick={handleShare}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', width: 44, height: 44, padding: 0, background: 'none', border: 0, color: MUTE, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Share size={18} strokeWidth={1.9} />
                </button>
              )}
              {reviewId && (
                <LikedByRow
                  variant="stack"
                  postId={reviewId}
                  count={reactionCount}
                  source="review"
                  subject={{ authorName: user.name || null, courseId: courseId ?? null, courseName: courseName ?? null, kind: 'review', gross: null, toPar: null, rating: rating ?? null }}
                  surfaceColor={GLASS_CARD.background as string}
                />
              )}
            </div>
          </motion.div>

          {commentsOpen && reviewId && (
            <CommentsSheetV2
              isOpen
              onClose={() => setCommentsOpen(false)}
              targetType="review"
              targetId={reviewId}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
