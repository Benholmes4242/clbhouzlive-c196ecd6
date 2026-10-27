import { CourseNameLink } from '@/components/shared/CourseNameLink';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
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
 */


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Play, Share, User } from 'lucide-react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';

import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useReviewMedia, type ReviewMediaItem } from './useReviewMedia';
import { useReviewPost } from './useReviewPost';
import { extractStreamId } from '@/components/media-system/utils/feedMapper';
import { useReviewFallback } from '@/hooks/useReviewFallback';
import { MentionText } from '@/components/mentions/MentionText';
import { REVIEW_SHEET_Z, VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';
import { footerTapProbeEnabled, recordFooterTap } from './footerTapProbe';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { getPublicProfilePath } from '@/lib/profileRoutes';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { SHEET_SURFACE } from '@/lib/tokens/surfaces';
import { SheetDoorButton } from '@/features/courses/_shared/scorecard/SheetDoorButton';
import { LikedByRow } from '@/components/likes/LikedByRow';
/* ReactionAction is now reached through RoundEngagementActions, which owns the
   canonical comment+reaction pair; the direct import is gone, the module is not.
   A REVIEW TAKES THE THUMB (kind="helpful"), not the heart: it is an opinion
   with a score, and agreement is the useful signal on it. The verb stays
   "like" — thumb and word agree — so LikedByRow below keeps no kind. */
import { RoundEngagementActions } from '@/components/explore-tab-new/courseled/RoundEngagementActions';
import { FeedCommentPreview } from '@/components/feed/FeedCommentPreview';
import type { FeedCommentPreview as FeedCommentPreviewData } from '@/hooks/feed/useFeedCommentPreview';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from '@/lib/toast';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

/* Dark surface tokens (analytical ramp). BODY sits at 72% rather than the 62%
   a caption would take: this sheet's payload is three paragraphs of member
   prose, and body copy needs more separation than a label does. */
/** BRIEF_REVIEW_SHEET_MEDIA_GRID §3 — first value chosen to bound sheet height. */
export const REVIEW_MEDIA_GRID_CAP = 9;

/**
 * §1 — name only what is there. Photos and videos counted separately, each
 * part singular/plural on its own, a zero never printed. (AboutMediaStrip
 * always prints both parts — deliberately not copied.)
 */
export function reviewMediaHeading(items: { mediaType: 'image' | 'video' }[]): string {
  const videos = items.filter((m) => m.mediaType === 'video').length;
  const photos = items.length - videos;
  const parts: string[] = [];
  if (photos > 0) parts.push(`${photos} ${photos === 1 ? 'PHOTO' : 'PHOTOS'}`);
  if (videos > 0) parts.push(`${videos} ${videos === 1 ? 'VIDEO' : 'VIDEOS'}`);
  return parts.join(' · ');
}

const CANVAS = SHEET_SURFACE;
const BORDER = 'rgba(255,255,255,0.10)';
const INK = '#F8FAFC';
const BODY = 'rgba(248,250,252,0.72)';
const MUTE = 'rgba(248,250,252,0.62)';
/* The photo placeholder needs one step more fill than a hairline border; the
   fill is not brightened to compensate for the dark surface. */
const TRACK = 'rgba(255,255,255,0.14)';
const FONT_SF =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


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
  commentPreview?: FeedCommentPreviewData | null;
}

const BREAKDOWN_KEYS = ['design', 'conditions', 'clubhouse', 'facilities'] as const;
const BREAKDOWN_LABELS: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'DESIGN',
  conditions: 'CONDITIONS',
  clubhouse: 'CLUBHOUSE',
  facilities: 'FACILITIES',
};

/** BRIEF_REVIEW_SHEET §S.4 — the panel's own fill, shared by the scroll fade so
 *  the text runs UNDER the boundary into exactly the surface it sits on. */
const PANEL_FILL = 'rgba(24,27,35,0.88)';

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

const CATEGORY_AVG_FIELD = {
  design: 'avg_design_score',
  conditions: 'avg_condition_score',
  clubhouse: 'avg_clubhouse_score',
  facilities: 'avg_facilities_score',
} as const;

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
  commentPreview = null,
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

  const handleGoToReview = useCallback(() => {
    if (!courseId) return;
    onClose();
    closeFullscreen();
    const url = reviewId
      ? `/courses/${courseId}?tab=reviews&highlight=${reviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  }, [courseId, reviewId, navigate, onClose, closeFullscreen]);

  /* CB69 — the title's course name: close the sheet, then fullscreen, then
     CourseNameLink opens /courses/:courseId (handleGoToReview's order). */
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
    const shareUrl = `${window.location.origin}/courses/${courseId}?tab=reviews&review=${reviewId}`;
    analyticsEvents.track('review_share_opened', { review_id: reviewId, course_id: courseId });
    if (navigator.share) {
      navigator.share({
        title: courseName,
        text: `${user.name}'s review of ${courseName}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    }
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
  const ratingColor = courseSubScoreTone(rating);

  // MEDIA (§3c) — prop when a caller has it, otherwise a lazy read.
  const { data: fetchedMedia } = useReviewMedia(reviewId ?? null, isOpen && !media?.length);
  const { data: reviewPost } = useReviewPost(reviewId ?? null, isOpen);
  const allMedia = (resolvedMedia !== undefined ? resolvedMedia : (media?.length ? media : fetchedMedia)) ?? [];
  const mediaTotal = allMedia.length;
  /* §3 — at most nine tiles (three rows); the ninth carries "+N" when more exist.
     Order is fetchReviewMedia's (cover first, then created_at) — never re-sorted here. */
  const mediaGrid = allMedia.slice(0, REVIEW_MEDIA_GRID_CAP);
  const hiddenCount = Math.max(0, mediaTotal - REVIEW_MEDIA_GRID_CAP);

  /* §S.2 — all four columns whenever any category was scored; a skipped one
     keeps an em dash and draws no track. The tick is the course's average for
     THAT category, gated on the same threshold as the strip. */
  const breakdownEntries = useMemo(() => {
    if (!effectiveBreakdown) return [];
    const any = BREAKDOWN_KEYS.some((k) => effectiveBreakdown[k] != null && !Number.isNaN(effectiveBreakdown[k] as number));
    if (!any) return [];
    return BREAKDOWN_KEYS.map((k) => {
      const raw = effectiveBreakdown[k];
      const value = raw == null || Number.isNaN(raw) ? null : raw;
      const avgRaw = effectiveAggregate?.[CATEGORY_AVG_FIELD[k]];
      const courseAvg = value != null && canCompareCourse && avgRaw != null && Number.isFinite(Number(avgRaw))
        ? Number(avgRaw)
        : null;
      return { key: k, label: BREAKDOWN_LABELS[k], value, courseAvg };
    });
  }, [effectiveBreakdown, effectiveAggregate, canCompareCourse]);
  const anyTick = breakdownEntries.some((e) => e.courseAvg != null);

  const metaSeg = playedAgo(reviewDate);

  /* §S.1 — THE CALIBRATION STRIP. Two figures, never coloured. */
  const reviewerAvg = effectiveStats?.averageRating ?? null;
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const ownFigure = rating != null && reviewerAvg != null ? formatDeviation(rating - reviewerAvg) : null;
  const courseFigure = showReference && communityAvg != null ? formatDeviation(rating - communityAvg) : null;
  const ownSub = reviewerAvg != null
    ? `${firstName} rates ${reviewerAvg.toFixed(1)}`
    : 'Too few reviews to average';
  const courseSub = courseFigure != null
    ? `${ratingCount} ratings, ${communityAvg!.toFixed(1)} average`
    : ratingCount <= 1
      ? 'First rating here'
      : `${ratingCount} ratings so far`;
  const showStrip = ownFigure != null || courseFigure != null;

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
              background: 'rgba(6,8,11,0.5)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
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
              borderRadius: 24,
              background: 'rgba(24,27,35,0.88)',
              backdropFilter: 'blur(30px) saturate(160%)',
              WebkitBackdropFilter: 'blur(30px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
              color: INK,
              fontFamily: FONT_SF,
              translate: `0 calc(-50% + ${dragY}px)`,
              willChange: cardAnimating ? 'transform, opacity' : 'auto',
            }}
          >
            <style>{`@media (prefers-reduced-motion: reduce) { [data-review-glass-card="true"] { transform: none !important; } }`}</style>
            {/* ─── PINNED HEADER ─────────────────────────────── */}
            <div
              style={{
                flex: '0 0 auto',
                padding: '14px 18px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Scorecard-shaped head: identity left, primary figure right. */}
              <div data-review-sheet-header="true" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1
                    id="review-sheet-title"
                    style={{
                      margin: 0,
                      fontSize: 19,
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.08,
                      color: INK,
                      // CB69 — no overflow clip here: it would clip the name's
                      // 44px hit area; the ellipsis lives on the name itself.
                      minWidth: 0,
                    }}
                  >
                    <CourseNameLink
                      as="div"
                      courseId={courseId || null}
                      onBeforeNavigate={handleCourseNameBeforeNavigate}
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {courseName}
                    </CourseNameLink>
                  </h1>

                  {locationStr && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        lineHeight: 1.2,
                        color: MUTE,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {locationStr}
                    </div>
                  )}
                </div>

              </div>

              <div data-review-player-row="true" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <SquircleAvatar size={28} src={user.avatar} alt={user.name} userId={user.id} fallback={initials} hairlineRing ringColor={DARK_HAIRLINE} />
                <div data-sheet-player-name="true" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  {metaSeg && <div style={{ marginTop: 2, fontSize: 12, color: BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metaSeg}</div>}
                </div>
                {(courseId || user.id) && <div data-sheet-doors="true" style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  {courseId && <SheetDoorButton door="course" label={t('courses:scorecard.viewCourse')} icon={MapPin} onClick={handleGoToReview} />}
                  {user.id && <SheetDoorButton door="profile" label={t('courses:scorecard.viewProfile')} icon={User} onClick={handleGoToProfile} />}
                </div>}
              </div>

              {/* §S.1 — THE CALIBRATION STRIP. Both cells always, or none: two
                  em dashes side by side say nothing. NEITHER FIGURE IS COLOURED —
                  a deviation is not a verdict, and green here means 9.0+. */}
              {showStrip && (
                <div data-review-calibration="true" style={{ display: 'flex', gap: 9, marginTop: 13 }}>
                  {[
                    { key: 'own', label: 'Against their own', figure: ownFigure, sub: ownSub },
                    { key: 'course', label: 'Against this course', figure: courseFigure, sub: courseSub },
                  ].map((c) => (
                    <div
                      key={c.key}
                      data-review-calibration-cell={c.key}
                      style={{ flex: 1, minWidth: 0, background: A.SOFT, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '9px 10px' }}
                    >
                      <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</div>
                      <div data-review-calibration-figure style={{ marginTop: 3, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: INK }}>{c.figure ?? '\u2014'}</div>
                      <div style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* §S.2 — the shared review score row (signed-off mock), below the
                  comparison cards; the first-rating note sits directly under it. */}
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
              {breakdownEntries.length > 0 && !anyTick && ratingCount === 1 && (
                <div data-review-subscore-first style={{ marginTop: 10, fontSize: 10.5, color: A.DIM }}>
                  No course average yet &mdash; this is the first rating here.
                </div>
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
                padding: '4px 18px 16px',
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
                    lineHeight: 1.6,
                    color: MUTE,
                    padding: '6px 0',
                  }}
                >
                  No written review — the score speaks for itself.
                </div>
              ) : (
                paragraphs.map((para, i) => (
                  <MentionText
                    key={i}
                    as="p"
                    text={para}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: BODY,
                      margin: 0,
                      marginBottom: i === paragraphs.length - 1 ? 0 : 14,
                    }}
                  />
                ))
              )}

              {/* §S.5 — the next question after one opinion is everyone else's.
                  At one rating there is nothing else to see. */}
              {courseId && ratingCount >= 2 && (
                <button
                  type="button"
                  data-review-see-all="true"
                  onClick={handleSeeAll}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 11,
                    padding: '11px 13px',
                    background: 'transparent',
                    color: INK,
                    fontFamily: FONT_SF,
                    fontSize: 12.5,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`See all ${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'} of ${courseName}`}
                  </span>
                  <ChevronRight size={15} strokeWidth={2} color={MUTE} aria-hidden style={{ flexShrink: 0 }} />
                </button>
              )}


              {/* MEDIA STRIP (§3c) — up to three thumbnails, 78 tall, r12.
                  INTERACTIVE: each tile is a real button that opens the
                  canonical fullscreen viewer (VIEWER_ABOVE_SHEETS_Z) at that
                  index, expanding from the tile, with the sheet left mounted so
                  its scroll position survives the round trip. Video shows poster + glyph and never
                  autoplays here. */}
              {mediaGrid.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      color: MUTE,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    {reviewMediaHeading(allMedia)}
                  </div>
                  {/* GRID (BRIEF_REVIEW_SHEET_MEDIA_GRID §2). Last row stays ragged:
                      tiles keep their column width, never stretch. */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {mediaGrid.map((m, i) => {
                      // §4a — index off allMedia explicitly, not the rendered slice.
                      const index = allMedia.indexOf(m);
                      const isOverflowTile = i === REVIEW_MEDIA_GRID_CAP - 1 && hiddenCount > 0;
                      const kindLabel = m.mediaType === 'video' ? 'Video' : 'Photo';
                      return (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={isOverflowTile ? `Show all ${mediaTotal}` : `${kindLabel} ${index + 1} of ${mediaTotal}`}
                        onClick={(e) => {
                          const post = reviewPost;
                          if (!post || post.mediaItems.length === 0) return;
                          const streamId = m.mediaType === 'video' ? extractStreamId(m.mediaUrl) : null;
                          const matchedIndex = post.mediaItems.findIndex((item) =>
                            m.mediaType === 'image'
                              ? item.type === 'image' && item.imageUrl === m.mediaUrl
                              : item.type === 'video' && streamId !== null && item.streamId === streamId,
                          );
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
                            posterUrl: m.posterUrl ?? m.mediaUrl,
                            zIndex: VIEWER_ABOVE_SHEETS_Z,
                          });
                        }}
                        style={{
                          minWidth: 0,
                          height: 78,
                          padding: 0,
                          border: 'none',
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: TRACK,
                          position: 'relative',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        className="review-photo-tile"
                      >
                        <img
                          // Grid tiles request their drawn size x DPR via Cloudflare
                          // (tiles are ≤115 x 78px). Originals (24MP+) trip iOS
                          // subsampling, which drops EXIF orientation. Fullscreen
                          // still opens the original.
                          src={m.mediaType === 'video'
                            ? (m.posterUrl ?? m.mediaUrl)
                            : buildImageThumbnailUrl(m.mediaUrl, { width: Math.round(REVIEW_TILE_MAX_W * tileDpr()) })}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
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
                                width: 26,
                                height: 26,
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
                              background: 'rgba(10,10,12,0.66)',
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
              {/* §S.4 — the text runs UNDER the boundary rather than stopping
                  dead at it. Sticky, so it holds the bottom edge while scrolling;
                  no clamp, no "read more" — this sheet is the full review. */}
              <div
                aria-hidden
                data-review-scroll-fade="true"
                style={{
                  position: 'sticky',
                  bottom: -16,
                  height: 46,
                  marginTop: -30,
                  marginLeft: -18,
                  marginRight: -18,
                  pointerEvents: 'none',
                  background: `linear-gradient(to bottom, transparent, ${PANEL_FILL})`,
                }}
              />
            </div>


            {/* ─── PINNED FOOTER ─────────────────────────────── */}
            <div
              ref={footerRef}
              style={{
                flex: '0 0 auto',
                padding: '10px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
                borderTop: `1px solid ${BORDER}`,
              }}

            >
              {/* G7.2(c) — THE SAME PAIR THE ROUND CARRIES, through the same
                  component, so the two feet read as one object. Both glyphs are
                  bare at zero, so a review with nothing on it can still take its
                  first like and its first comment. */}
              {/* §S.6 — share sits in the engagement row, as everywhere else. */}
              {reviewId && (onToggleReaction || courseId) && (
                <div data-review-engagement="true" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {onToggleReaction && (
                    <RoundEngagementActions
                      comment={{
                        count: commentCount,
                        label: t('scorecard.commentReview', 'Comment on this review'),
                        onOpen: () => setCommentsOpen(true),
                      }}
                      like={{
                        count: reactionCount,
                        reacted: reactionMine,
                        onToggle: onToggleReaction,
                        label: t('scorecard.likeReview', 'Like this review'),
                        hidden: reactionHidden,
                      }}
                      kind="helpful"
                    />
                  )}
                  {courseId && (
                    <button
                      type="button"
                      data-review-share="true"
                      aria-label="Share this review"
                      onClick={handleShare}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 32, minHeight: 32, padding: 0, background: 'none', border: 0, color: MUTE, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Share size={15} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              )}
              {/* CB56 — content-sized bottom sheet: a growing line would lift its top edge. */}
              {reviewId && (
                <LikedByRow reserve postId={reviewId} count={reactionCount} source="review" subject={{ authorName: user.name || null, courseId: courseId ?? null, courseName: courseName ?? null, kind: 'review', gross: null, toPar: null, rating: rating ?? null }} surfaceColor={CANVAS} style={{ marginBottom: 8 }} />
              )}
              {reviewId && commentCount > 0 && commentPreview && (
                <div style={{ marginBottom: 8 }}>
                  <FeedCommentPreview
                    preview={commentPreview}
                    commentCount={commentCount}
                    onOpenComments={() => setCommentsOpen(true)}
                    topRule={false}
                    padding="0"
                  />
                </div>
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
