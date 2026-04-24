/**
 * ReviewBottomSheet — Frost Panel sheet (PR 2 visual redesign).
 *
 * Driven by the unified store (PR 1) via ReviewBottomSheetPortal.
 * Visual: glass-strong background, two atmospheric glow orbs, big rating card
 * with radial dial, optional breakdown bars, full review body, author card,
 * two CTAs (Visit Course + Full Review).
 */

import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  FROST,
  FROST_BLUR,
  FROST_SCORE_GRADIENT,
  formatFrostRating,
  splitCourseName,
} from '@/lib/frostPanel';

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

  /** Optional breakdown sub-scores. Renders breakdown rows when present. */
  breakdown?: {
    design?: number | null;
    conditions?: number | null;
    clubhouse?: number | null;
    facilities?: number | null;
  } | null;
  /** Optional reviewer stats. Renders sub-line below author name when present. */
  reviewerStats?: {
    coursesRated?: number | null;
    averageRating?: number | null;
    memberSince?: string | null;
  } | null;
  courseSubtitle?: string | null;
}

const BREAKDOWN_KEYS = ['design', 'conditions', 'clubhouse', 'facilities'] as const;
const BREAKDOWN_LABELS: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'Design',
  conditions: 'Conditions',
  clubhouse: 'Clubhouse',
  facilities: 'Facilities',
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

  // Stats sub-line — render only segments present
  const statsSubLine = useMemo(() => {
    if (!reviewerStats) return '';
    const segs: string[] = [];
    if (reviewerStats.coursesRated != null) {
      const noun = reviewerStats.coursesRated === 1 ? 'course' : 'courses';
      segs.push(`${reviewerStats.coursesRated} ${noun}`);
    }
    // Hide the average when fewer than 3 courses — a single low rating would produce
    // a misleading headline average.
    if (
      reviewerStats.averageRating != null &&
      (reviewerStats.coursesRated ?? 0) >= 3
    ) {
      segs.push(`Avg ${reviewerStats.averageRating.toFixed(1)}`);
    }
    if (reviewerStats.memberSince) {
      segs.push(`Reviewing since ${reviewerStats.memberSince}`);
    }
    return segs.join(' · ');
  }, [reviewerStats]);

  // Radial dial — r=34, c = 2π·34 ≈ 213.6 (ring only, no label)
  const DIAL_RADIUS = 34;
  const DIAL_CIRC = 2 * Math.PI * DIAL_RADIUS;
  const dialOffset = DIAL_CIRC * (1 - Math.max(0, Math.min(1, rating / 10)));

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
              overflow: 'auto',
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

            {/* Glow orbs — atmospheric, behind everything */}
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

            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, position: 'relative' }}>
              <div
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.30)',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ padding: '4px 22px 24px', position: 'relative' }}>
              {/* Title block — inline name + subtitle */}
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: '-1.0px',
                  lineHeight: 1.05,
                  color: FROST.ink,
                  wordBreak: 'break-word',
                  marginTop: 14,
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
                    marginTop: 8,
                  }}
                >
                  {locationStr}
                </div>
              ) : null}

              {/* Rating card */}
              <div
                style={{
                  marginTop: 20,
                  borderRadius: 20,
                  padding: 22,
                  background: FROST.glassSoft,
                  border: `1px solid ${FROST.borderNested}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle radial glow */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 85% 30%, rgba(247,147,30,0.2), transparent 50%)',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                  }}
                >
                  {/* Left — big number */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 4,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 84,
                          fontWeight: 800,
                          letterSpacing: '-4px',
                          lineHeight: 0.85,
                          paddingRight: 6,
                          ...FROST_SCORE_GRADIENT,
                        }}
                      >
                        {formattedRating}
                      </span>
                    </div>
                  </div>

                  {/* Right — radial dial (ring only, no label) */}
                  <div style={{ position: 'relative', width: 74, height: 74, flexShrink: 0 }}>
                    <svg width={74} height={74} viewBox="0 0 74 74">
                      <defs>
                        <linearGradient id="frostRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={FROST.amber} />
                          <stop offset="100%" stopColor={FROST.amberSoft} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx={37}
                        cy={37}
                        r={DIAL_RADIUS}
                        fill="none"
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth={5}
                      />
                      <circle
                        cx={37}
                        cy={37}
                        r={DIAL_RADIUS}
                        fill="none"
                        stroke="url(#frostRingGrad)"
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={DIAL_CIRC}
                        strokeDashoffset={dialOffset}
                        transform="rotate(-90 37 37)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Breakdown rows (conditional) */}
                {breakdownEntries.length > 0 && (
                  <div style={{ position: 'relative', marginTop: 18 }}>
                    {breakdownEntries.map(({ key, label, value }) => (
                      <div
                        key={key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr 36px',
                          gap: 12,
                          alignItems: 'center',
                          marginBottom: 9,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: FROST.inkMute,
                          }}
                        >
                          {label}
                        </span>
                        <div
                          style={{
                            height: 4,
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, value * 10))}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${FROST.amber}, ${FROST.amberSoft})`,
                              boxShadow: '0 0 8px rgba(247,147,30,0.5)',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: '-0.3px',
                            color: FROST.ink,
                            fontVariantNumeric: 'tabular-nums',
                            textAlign: 'right',
                          }}
                        >
                          {value.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review body */}
              {reviewText && (
                <div
                  style={{
                    marginTop: 20,
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: 1.55,
                    color: FROST.inkSoft,
                    whiteSpace: 'pre-wrap',
                    marginBottom: 20,
                  }}
                >
                  {reviewText}
                </div>
              )}

              {/* Author card */}
              <div
                style={{
                  marginTop: reviewText ? 0 : 20,
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
                  {statsSubLine && (
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
                  )}
                </div>
                {/* TODO: wire follow action — out of scope for PR 2 */}
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
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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
