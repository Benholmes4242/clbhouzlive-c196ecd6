/**
 * ReviewBottomSheet — Frost Panel sheet (PR 7 editorial layout).
 *
 * Three-zone layout (PR 6):
 *   - Pinned header: drag handle + title + location + (divider) + score | 2×2 breakdown grid
 *   - Scrollable middle: review body with amber Georgia drop cap on first paragraph
 *   - Pinned footer: author card + Visit Course / Full Review CTAs
 *
 * Driven by the unified store via ReviewBottomSheetPortal.
 */

import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  FROST,
  FROST_BLUR,
  FROST_SCORE_GRADIENT,
  formatFrostRating,
  splitCourseName,
} from '@/lib/frostPanel';
import { useViewportWidth, COMPACT_VIEWPORT_MAX } from '@/hooks/useViewportWidth';
import { useReviewerStats } from '@/hooks/useReviewerStats';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsFollowingUser } from '@/hooks/useIsFollowingUser';
import { useFollowStore } from '@/store/followStore';
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';

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
  courseSubtitle?: string | null;
}

const BREAKDOWN_KEYS = ['design', 'conditions', 'clubhouse', 'facilities'] as const;
const BREAKDOWN_LABELS: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'DESIGN',
  conditions: 'CONDITIONS',
  clubhouse: 'CLUBHOUSE',
  facilities: 'FACILITIES',
};

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

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
  courseSubtitle,
}) => {
  const navigate = useNavigate();
  const viewportWidth = useViewportWidth();
  const isCompact = viewportWidth < COMPACT_VIEWPORT_MAX;

  // Live reviewer stats — falls back to the snapshot from the payload while loading.
  // Same React Query key dedupes with any earlier fetch (e.g. tile mount).
  const { data: liveStats, isLoading: statsLoading } = useReviewerStats(user?.id);
  const effectiveStats = liveStats ?? reviewerStats ?? null;

  const handleVisitCourse = useCallback(() => {
    if (!courseId) return;
    onClose();
    navigate(`/courses/${courseId}`);
  }, [courseId, navigate, onClose]);

  const handleGoToReview = useCallback(() => {
    if (!courseId) return;
    onClose();
    const url = reviewId
      ? `/courses/${courseId}?tab=reviews&review=${reviewId}`
      : `/courses/${courseId}?tab=reviews`;
    navigate(url);
  }, [courseId, reviewId, navigate, onClose]);

  const locationParts = [courseSubCountry || courseRegion, courseCountry].filter(Boolean);
  const locationStr = locationParts.join(', ');

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

  const formattedRating = formatFrostRating(rating);

  const { name: titleName, subtitle: derivedSubtitle } = useMemo(
    () => (courseSubtitle ? { name: courseName, subtitle: courseSubtitle } : splitCourseName(courseName)),
    [courseName, courseSubtitle],
  );

  const breakdownEntries = useMemo(() => {
    if (!breakdown) return [];
    return BREAKDOWN_KEYS.flatMap((k) => {
      const v = breakdown[k];
      return v == null || Number.isNaN(v) ? [] : [{ key: k, label: BREAKDOWN_LABELS[k], value: v }];
    });
  }, [breakdown]);

  // Stats sub-line — render only segments present (uses live → snapshot fallback)
  const statsSubLine = useMemo(() => {
    if (!effectiveStats) return '';
    const segs: string[] = [];
    if (effectiveStats.coursesRated != null) {
      const noun = effectiveStats.coursesRated === 1 ? 'course' : 'courses';
      segs.push(`${effectiveStats.coursesRated} ${noun}`);
    }
    if (
      effectiveStats.averageRating != null &&
      (effectiveStats.coursesRated ?? 0) >= 3
    ) {
      segs.push(`Avg ${effectiveStats.averageRating.toFixed(1)}`);
    }
    if (effectiveStats.memberSince) {
      segs.push(`Reviewing since ${effectiveStats.memberSince}`);
    }
    return segs.join(' · ');
  }, [effectiveStats]);

  // Split review into paragraphs on double-newline
  const paragraphs = useMemo(() => {
    if (!reviewText) return [];
    return reviewText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }, [reviewText]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="review-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="review-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-sheet-title"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.velocity.y > 300 || info.offset.y > 120) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              insetInline: 0,
              bottom: 0,
              zIndex: 101,
              width: '100%',
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '28px 28px 0 0',
              background: FROST.glassStrong,
              backdropFilter: FROST_BLUR.sheet,
              WebkitBackdropFilter: FROST_BLUR.sheet,
              border: `1px solid ${FROST.border}`,
              borderBottom: 'none',
              color: FROST.ink,
              boxShadow: `0 -20px 60px rgba(0,0,0,0.5), ${FROST.innerHighlight}`,
              transform: 'translateZ(0)',
              willChange: 'backdrop-filter',
              fontFamily: 'Geist, system-ui, sans-serif',
            }}
          >
            {/* Visually-hidden accessible title */}
            <span id="review-sheet-title" style={SR_ONLY}>
              Review of {courseName} by {user.name}
            </span>

            {/* Glow orbs — atmospheric */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -60,
                left: '10%',
                width: 300,
                height: 200,
                background: FROST.amberGlow,
                filter: 'blur(12px)',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 120,
                right: '5%',
                width: 250,
                height: 250,
                background: FROST.blueGlow,
                filter: 'blur(10px)',
                pointerEvents: 'none',
              }}
            />

            {/* ─── PINNED HEADER ─────────────────────────────── */}
            <div
              style={{
                flex: '0 0 auto',
                padding: '0 22px 18px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <div
                  style={{
                    width: 44,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.30)',
                  }}
                />
              </div>

              {/* Title — inline name + subtitle */}
              <h1
                style={{
                  fontSize: isCompact ? 24 : 28,
                  fontWeight: 800,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.1,
                  color: FROST.ink,
                  wordBreak: 'break-word',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                {titleName}
                {derivedSubtitle && (
                  <>
                    <span style={{ color: FROST.inkMute, fontWeight: 500 }}> — </span>
                    <span style={{ color: FROST.inkMute, fontWeight: 500 }}>{derivedSubtitle}</span>
                  </>
                )}
              </h1>
              {locationStr ? (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: FROST.inkMuter,
                    letterSpacing: '0.2px',
                    marginTop: 6,
                  }}
                >
                  {locationStr}
                </div>
              ) : null}

              {/* Score + 2×2 breakdown side-by-side */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: `1px solid ${FROST.borderSoft}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isCompact ? 'column' : 'row',
                    alignItems: isCompact ? 'flex-start' : 'flex-start',
                    gap: isCompact ? 14 : 20,
                  }}
                >
                  {/* Score on left */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span
                      style={{
                        ...FROST_SCORE_GRADIENT,
                        fontSize: 68,
                        fontWeight: 800,
                        lineHeight: 0.85,
                      }}
                    >
                      <span style={{ letterSpacing: '-3.2px' }}>
                        {formattedRating.split('.')[0]}
                      </span>
                      {formattedRating.includes('.') && (
                        <span style={{ letterSpacing: '-0.8px' }}>
                          <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Symbol", system-ui, sans-serif' }}>·</span>
                          {formattedRating.split('.')[1]}
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        color: FROST.inkFaint,
                        fontWeight: 500,
                        marginLeft: 4,
                        marginBottom: 6,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      /10
                    </span>
                  </div>

                  {/* 2×2 breakdown on right */}
                  {breakdownEntries.length > 0 && (
                    <div
                      style={{
                        flex: isCompact ? 'none' : 1,
                        width: isCompact ? '100%' : 'auto',
                        minWidth: 0,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        columnGap: 16,
                        rowGap: 8,
                        alignSelf: isCompact ? 'stretch' : 'center',
                      }}
                    >
                      {breakdownEntries.map(({ key, label, value }) => (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: 6,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.8px',
                              textTransform: 'uppercase',
                              color: FROST.inkMuter,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: FROST.ink,
                              fontVariantNumeric: 'tabular-nums',
                              letterSpacing: '-0.2px',
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
              </div>
            </div>

            {/* ─── SCROLLABLE MIDDLE (review body with drop cap) ──────── */}
            <div
              style={{
                flex: '1 1 auto',
                overflow: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                padding: '20px 22px 20px',
                minHeight: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {paragraphs.length === 0 && (
                <div
                  style={{
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: FROST.inkFaint,
                    padding: '12px 0',
                  }}
                >
                  No written review — the score speaks for itself.
                </div>
              )}
              {paragraphs.map((para, i) => {
                const isFirst = i === 0;
                const firstChar = para.charAt(0);
                const eligibleForDropCap = isFirst && /^[A-Za-z]$/.test(firstChar);
                return (
                  <p
                    key={i}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: FROST.inkSoft,
                      letterSpacing: '-0.1px',
                      margin: 0,
                      marginBottom: i === paragraphs.length - 1 ? 0 : 14,
                    }}
                  >
                    {eligibleForDropCap ? (
                      <>
                        <span
                          style={{
                            float: 'left',
                            fontSize: 48,
                            fontWeight: 800,
                            lineHeight: 0.9,
                            paddingTop: 4,
                            paddingRight: 8,
                            color: FROST.amber,
                          }}
                        >
                          {firstChar}
                        </span>
                        {para.slice(1)}
                      </>
                    ) : (
                      para
                    )}
                  </p>
                );
              })}
            </div>

            {/* ─── PINNED FOOTER ─────────────────────────────── */}
            <div
              style={{
                flex: '0 0 auto',
                padding: '14px 22px 20px',
                background: FROST.glassStrong,
                borderTop: `1px solid ${FROST.borderSoft}`,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Author card */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: FROST.glassSoft,
                  border: `1px solid ${FROST.borderSoft}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <SquircleAvatar
                  size={42}
                  src={user.avatar}
                  alt={user.name}
                  fallback={initials}
                  hideRing
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.2px',
                      color: FROST.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  {statsSubLine ? (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: FROST.inkMuter,
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {statsSubLine}
                    </div>
                  ) : statsLoading ? (
                    /* Stats sub-line shimmer placeholder while live query resolves */
                    <div
                      className="clb-shimmer-dark"
                      aria-hidden
                      style={{
                        marginTop: 6,
                        width: 140,
                        height: 10,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    />
                  ) : null}
                </div>
                {/* TODO: wire follow action — out of scope */}
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: FROST.ink,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Follow
                </button>
              </div>

              {/* CTAs */}
              {courseId && (
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={handleVisitCourse}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: FROST.ink,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Visit Course
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToReview}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 14,
                      background: `linear-gradient(180deg, ${FROST.amber}, ${FROST.amberDeep})`,
                      border: 'none',
                      color: FROST.ink,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(247,147,30,0.4)',
                      fontFamily: 'inherit',
                    }}
                  >
                    Full Review →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
};

export default ReviewBottomSheet;
