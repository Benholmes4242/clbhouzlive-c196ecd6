/**
 * ReviewBottomSheet — LIGHT bottom sheet (solid canvas).
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
 *   sheet → viewer:  tapping a photo in the strip below opens the media viewer,
 *                    which must paint ABOVE this sheet. That is NOT the feed
 *                    overlay: it is MediaPreviewViewer, body-portaled at
 *                    MEDIA_PREVIEW_Z (9999), i.e. above every sheet in the
 *                    registry. The sheet stays mounted underneath and keeps its
 *                    scroll position; nothing in @/lib/zLayers is inverted.
 * Both overlays portal to document.body, so this panel's translateZ(0) and the
 * scroller's -webkit-overflow-scrolling cannot clamp either of them.
 *
 * No blur anywhere: the panel is opaque #F8FAFC so the dark page beneath
 * cannot muddy it. The scrim stays a plain rgba dim.
 */


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatMonthYearShort } from '@/i18n/format';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Play } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useReviewMedia, type ReviewMediaItem } from './useReviewMedia';
import { useReviewFallback } from '@/hooks/useReviewFallback';
import { MentionText } from '@/components/mentions/MentionText';
import { REVIEW_SHEET_Z } from '@/lib/zLayers';
import { footerTapProbeEnabled, recordFooterTap } from './footerTapProbe';
import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';
import type { OrderedMediaItem } from '@/components/shared/media/types';
import { ReviewGhostNumeral, ReviewVerdictLabel, reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { getPublicProfilePath } from '@/lib/profileRoutes';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

/* Light-mode surface tokens (Dispatch canvas set). */
const CANVAS = '#F8FAFC';
const PANEL = '#FFFFFF';
const BORDER = '#EDF0F3';
const INK = '#0E1216';
const BODY = '#3A424C';
const MUTE = '#68707B';
const GRABBER = '#D6DBE1';
const FONT_SF =
  "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";


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
}

const BREAKDOWN_KEYS = ['design', 'conditions', 'clubhouse', 'facilities'] as const;
const BREAKDOWN_LABELS: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'DESIGN',
  conditions: 'CONDITIONS',
  clubhouse: 'CLUBHOUSE',
  facilities: 'FACILITIES',
};

function relativeMonths(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diff = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  const d = Math.floor(diff / day);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

function formatMonthLabel(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatMonthYearShort(d).toUpperCase();
}


/** One cell of the reference block: figure over a small caps label. */
const RefCell: React.FC<{
  figure: string;
  figureSize: number;
  color: string;
  label: string;
}> = ({ figure, figureSize, color, label }) => (
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontSize: figureSize,
        fontWeight: 300,
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {figure}
    </div>
    <div
      style={{
        marginTop: 5,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: MUTE,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </div>
  </div>
);

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
}) => {
  const navigate = useNavigate();

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
  const effectiveReviewText = reviewText ?? fallback?.reviewText ?? null;
  const effectiveBreakdown = hasBreakdown ? breakdown : (fallback?.breakdown ?? breakdown ?? null);
  if (isOpen) {
    // eslint-disable-next-line no-console
    console.debug('[review-sheet] state', {
      reviewId,
      propHasText: !!reviewText,
      fallbackHasText: !!fallback?.reviewText,
      effectiveHasText: !!effectiveReviewText,
    });
  }

  // Scope drag to header only so the middle scrolls without dismissing.
  const dragControls = useDragControls();

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
      ? `/courses/${courseId}?tab=reviews&review=${reviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  }, [courseId, reviewId, navigate, onClose, closeFullscreen]);

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

  const monthLabel = formatMonthLabel(reviewDate ?? null);

  // REFERENCE POINT (§3a) — reuses the shared aggregates hook, so on a page
  // that already read them (course detail, discover) React Query dedupes and
  // no extra network call happens. No SQL was needed.
  const { data: agg } = useCourseRatingAggregates(isOpen ? courseId : undefined);
  const communityAvg = agg?.avg_overall_score ?? null;
  const ratingCount = agg?.review_count ?? 0;
  const showReference =
    rating != null && communityAvg != null && ratingCount >= 3;

  // MEDIA (§3c) — prop when a caller has it, otherwise a lazy read.
  const { data: fetchedMedia } = useReviewMedia(reviewId ?? null, isOpen && !media?.length);
  const allMedia = (media?.length ? media : fetchedMedia) ?? [];
  const mediaTotal = allMedia.length;
  const mediaStrip = allMedia.slice(0, 3);

  /* PHOTO TAP (§Part 1). The strip shows the first three; the viewer receives
     ALL items so a 4-photo review stays fully reachable from the third tile. */
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const viewerItems: OrderedMediaItem[] = useMemo(
    () =>
      allMedia.map((m, i) => ({
        id: m.id,
        type: m.mediaType,
        previewUrl: m.mediaUrl,
        thumbnailUrl: m.posterUrl ?? undefined,
        order: i,
      })),
    [allMedia],
  );


  const breakdownEntries = useMemo(() => {
    if (!effectiveBreakdown) return [];
    return BREAKDOWN_KEYS.flatMap((k) => {
      const v = effectiveBreakdown[k];
      return v == null || Number.isNaN(v)
        ? []
        : [{ key: k, label: BREAKDOWN_LABELS[k], value: v }];
    });
  }, [effectiveBreakdown]);

  const relMonths = relativeMonths(reviewDate ?? effectiveStats?.memberSince ?? null);
  const handicapSeg =
    (effectiveStats as any)?.handicap != null
      ? `handicap ${(effectiveStats as any).handicap}`
      : effectiveStats?.averageRating != null && (effectiveStats?.coursesRated ?? 0) >= 3
      ? `avg ${effectiveStats.averageRating.toFixed(1)}`
      : null;
  const metaSeg = [relMonths, handicapSeg].filter(Boolean).join(' · ');

  const paragraphs = useMemo(() => {
    if (!effectiveReviewText) return [];
    return effectiveReviewText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }, [effectiveReviewText]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim — plain dim, no blur (single blur surface = panel only). */}
          <motion.div
            key="review-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: REVIEW_SHEET_Z,
              background: 'rgba(0,0,0,0.35)',
            }}
          />

          {/* Panel — the one blur surface. */}
          <motion.div
            key="review-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-sheet-title"
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.velocity.y > 300 || info.offset.y > 120) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 0,
              zIndex: REVIEW_SHEET_Z + 1,
              width: '100%',
              maxHeight: '90dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '18px 18px 0 0',
              background: CANVAS,
              borderTop: `1px solid ${BORDER}`,
              color: INK,

              fontFamily: FONT_SF,
              transform: 'translateZ(0)',
            }}
          >
            {/* ─── PINNED HEADER ─────────────────────────────── */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                flex: '0 0 auto',
                padding: '0 18px 14px',
                position: 'relative',
                touchAction: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Ghost numeral — huge watermark, top-right, clipped by header edge */}
              {rating != null && (
                <ReviewGhostNumeral rating={rating} fontSize={110} right={-10} top={40} surface="light" />
              )}

              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 10, position: 'relative', zIndex: 2 }}>
                <div
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    background: GRABBER,
                  }}
                />
              </div>

              {/* Top row: eyebrow + course info (left) | verdict label (right) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Ink eyebrow */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: INK,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>REVIEW</span>
                    {monthLabel ? (
                      <>
                        <span style={{ opacity: 0.5 }}>·</span>
                        <span>{monthLabel}</span>
                      </>
                    ) : (
                      <span aria-hidden style={{ opacity: 0.5, letterSpacing: '-0.02em' }}>
                        ────
                      </span>
                    )}
                  </div>

                  {/* Course name */}
                  <h1
                    id="review-sheet-title"
                    style={{
                      margin: '6px 0 0',
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: INK,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {courseName}
                  </h1>

                  {/* Location */}
                  {locationStr && (
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 12.5,
                        color: MUTE,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >

                      <MapPin size={12} strokeWidth={2} />
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {locationStr}
                      </span>
                    </div>
                  )}
                </div>

                {/* Verdict label — tier word over the ghost numeral, top-right */}
                {rating != null && (
                  <ReviewVerdictLabel rating={rating} surface="light" />
                )}

              </div>

              {/* REFERENCE BLOCK — their score against the community (§3a).
                  Omitted below three ratings: an average of one is not a
                  reference point. */}
              {showReference && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    alignItems: 'end',
                  }}
                >
                  <RefCell
                    figure={rating.toFixed(1)}
                    figureSize={40}
                    color={reviewLabelColor(rating, 'light')}
                    label="THEIR SCORE"
                  />
                  <RefCell
                    figure={communityAvg!.toFixed(1)}
                    figureSize={19}
                    color={INK}
                    label={`${ratingCount} RATINGS`}
                  />
                  <RefCell
                    figure={Math.abs(rating - communityAvg!).toFixed(1)}
                    figureSize={19}
                    color={INK}
                    label={rating >= communityAvg! ? 'ABOVE' : 'BELOW'}
                  />
                </div>
              )}

              {/* THE SPREAD — one row of four: figure, bar out of ten, label.
                  A null category omits its column and the row rebalances. */}
              {breakdownEntries.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${breakdownEntries.length}, 1fr)`,
                    gap: 10,
                  }}
                >
                  {breakdownEntries.map(({ key, label, value }) => {
                    const c = reviewLabelColor(value, 'light');
                    return (
                      <div key={key} style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 300,
                            color: c,
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1.1,
                          }}
                        >
                          {value.toFixed(1)}
                        </div>
                        <div
                          style={{
                            marginTop: 5,
                            height: 3,
                            borderRadius: 2,
                            background: BORDER,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, (value / 10) * 100))}%`,
                              height: '100%',
                              background: c,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 9.5,
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            color: MUTE,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* ─── SCROLL REGION ──────────────────────────────── */}
            <div
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
              {paragraphs.length === 0 ? (
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

              {/* MEDIA STRIP (§3c) — up to three thumbnails, 78 tall, r12.
                  INTERACTIVE: each tile is a real button that opens
                  MediaPreviewViewer (body-portaled, z 9999) at that index over
                  this sheet, with the sheet left mounted so its scroll position
                  survives the round trip. Video shows poster + glyph and never
                  autoplays here. */}
              {mediaStrip.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      color: MUTE,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    {mediaTotal === 1 ? '1 PHOTO' : `${mediaTotal} PHOTOS`}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {mediaStrip.map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={`Photo ${i + 1} of ${mediaTotal}`}
                        onClick={() => setViewerIndex(i)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: 78,
                          padding: 0,
                          border: 'none',
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: BORDER,
                          position: 'relative',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        className="review-photo-tile"
                      >
                        <img
                          src={m.mediaType === 'video' ? (m.posterUrl ?? m.mediaUrl) : m.mediaUrl}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {m.mediaType === 'video' && (
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
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              {/* Reviewer row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <SquircleAvatar
                  size={28}
                  src={user.avatar}
                  alt={user.name}
                  fallback={initials}
                  hairlineRing
                  ringColor={LIGHT_HAIRLINE}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: INK,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  {metaSeg && (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11.5,
                        color: BODY,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {metaSeg}
                    </div>
                  )}
                </div>
              </div>

              {/* Two buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleGoToReview}
                  disabled={!courseId}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    padding: '14px 12px',
                    borderRadius: 10,
                    background: INK,
                    border: 'none',
                    color: PANEL,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: courseId ? 'pointer' : 'default',
                    opacity: courseId ? 1 : 0.5,
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                  }}
                >
                  Go to review
                </button>
                <button
                  type="button"
                  onClick={handleGoToProfile}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    padding: '14px 12px',
                    borderRadius: 10,
                    background: PANEL,
                    border: `1px solid ${BORDER}`,
                    color: INK,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                  }}
                >
                  Go to profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* Photo viewer — portals to <body> at z 9999, so it sits above this
              sheet (REVIEW_SHEET_Z 240) on device, not just in preview. The
              sheet is deliberately NOT closed: closing costs the scroll
              position and was rejected on the Moments path. */}
          {viewerIndex != null && viewerItems.length > 0 && (
            <MediaPreviewViewer
              items={viewerItems}
              initialIndex={viewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
