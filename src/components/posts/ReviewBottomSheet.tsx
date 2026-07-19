/**
 * ReviewBottomSheet — Glass bottom sheet (rebuild).
 *
 * Single overlay used from both entry points:
 *   1. Clubhouse "Read review" card CTA
 *   2. Fullscreen viewer "read review ›" chrome
 * Both open through useReviewSheetStore + ReviewBottomSheetPortal.
 *
 * Stacking is centralized in @/lib/zLayers so this sheet always renders
 * above FullscreenFeedOverlay (see REVIEW_SHEET_Z > FS_OVERLAY_Z).
 *
 * One blur surface only (the panel). Scrim is a plain rgba dim.
 */

import React, { useCallback, useMemo } from 'react';
import { formatMonthYearShort } from '@/i18n/format';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

import { useReviewerStats } from '@/hooks/useReviewerStats';
import { MentionText } from '@/components/mentions/MentionText';
import { REVIEW_SHEET_Z } from '@/lib/zLayers';
import { ReviewGhostNumeral, ReviewVerdictLabel } from '@/components/shared/ReviewGhostScore';
import { getPublicProfilePath } from '@/lib/profileRoutes';


const AMBER = '#F7931E';
const FONT_GEIST =
  "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

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
}) => {
  const navigate = useNavigate();

  // Live reviewer stats (React Query dedupes with earlier fetches).
  const { data: liveStats } = useReviewerStats(user?.id);
  const effectiveStats = liveStats ?? reviewerStats ?? null;

  // Scope drag to header only so the middle scrolls without dismissing.
  const dragControls = useDragControls();

  // V1 fullscreen dismiss removed — fsv2 owns fullscreen and handles its
  // own close on navigation.
  const closeFullscreen = useCallback(() => {}, []);

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

  const breakdownEntries = useMemo(() => {
    if (!breakdown) return [];
    return BREAKDOWN_KEYS.flatMap((k) => {
      const v = breakdown[k];
      return v == null || Number.isNaN(v)
        ? []
        : [{ key: k, label: BREAKDOWN_LABELS[k], value: v }];
    });
  }, [breakdown]);

  const relMonths = relativeMonths(reviewDate ?? effectiveStats?.memberSince ?? null);
  const handicapSeg =
    (effectiveStats as any)?.handicap != null
      ? `handicap ${(effectiveStats as any).handicap}`
      : effectiveStats?.averageRating != null && (effectiveStats?.coursesRated ?? 0) >= 3
      ? `avg ${effectiveStats.averageRating.toFixed(1)}`
      : null;
  const metaSeg = [relMonths, handicapSeg].filter(Boolean).join(' · ');

  const paragraphs = useMemo(() => {
    if (!reviewText) return [];
    return reviewText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }, [reviewText]);

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
              maxHeight: '75dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '18px 18px 0 0',
              background: 'rgba(24,28,24,0.62)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderTop: '1px solid rgba(255,255,255,0.18)',
              color: '#F8FAFC',
              fontFamily: FONT_GEIST,
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
                <ReviewGhostNumeral rating={rating} fontSize={110} right={-10} top={40} />
              )}

              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 10, position: 'relative', zIndex: 2 }}>
                <div
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.35)',
                  }}
                />
              </div>

              {/* Top row: eyebrow + course info (left) | verdict label (right) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Amber eyebrow */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: AMBER,
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
                      color: '#F8FAFC',
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
                        color: '#F8FAFC',
                        opacity: 0.7,
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
                  <ReviewVerdictLabel rating={rating} />
                )}
              </div>

              {/* 2×2 breakdown grid */}
              {breakdownEntries.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}
                >
                  {breakdownEntries.map(({ key, label, value }) => (
                    <div
                      key={key}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        minHeight: 52,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          color: '#F8FAFC',
                          opacity: 0.6,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: 19,
                          fontWeight: 300,
                          color: '#F8FAFC',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {value.toFixed(1)}
                      </span>
                    </div>
                  ))}
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
                    color: '#F8FAFC',
                    opacity: 0.6,
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
                      color: '#F8FAFC',
                      opacity: 0.9,
                      margin: 0,
                      marginBottom: i === paragraphs.length - 1 ? 0 : 14,
                    }}
                  />
                ))
              )}
            </div>

            {/* ─── PINNED FOOTER ─────────────────────────────── */}
            <div
              style={{
                flex: '0 0 auto',
                padding: '10px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
                borderTop: '1px solid rgba(255,255,255,0.12)',
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
                      color: '#F8FAFC',
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
                        color: '#F8FAFC',
                        opacity: 0.6,
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
                    background: AMBER,
                    border: 'none',
                    color: 'rgba(255,255,255,0.95)',
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
                    background: 'rgba(255,255,255,0.12)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                    color: '#F8FAFC',
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
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
