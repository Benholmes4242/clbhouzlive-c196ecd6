/**
 * InlineReviewCard — Frost Panel review tile shown at the bottom of review posts.
 *
 * PR 2 (Frost Panel redesign): glass morphism + amber accents + tier pill.
 * Composition (top → bottom):
 *   1. Tier pill (replaces ★ COURSE REVIEW chip)
 *   2. Title row — course name + subtitle / score
 *   3. Breakdown bars (conditional, when `breakdown` prop populated by PR 3)
 *   4. Author row — avatar + name + "N rated" (conditional) / date
 *
 * Tap → opens unified ReviewBottomSheet via store (PR 1).
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  FROST,
  FROST_BLUR,
  FROST_SCORE_GRADIENT,
  formatFrostRating,
  splitCourseName,
} from '@/lib/frostPanel';

export interface InlineReviewCardProps {
  courseName: string;
  rating: number;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
  reviewer: {
    name: string;
    avatar?: string | null;
  };
  isVisible: boolean;
  onTap: () => void;

  /** Optional breakdown sub-scores. Renders the 4-column micro-bar row when present. */
  breakdown?: {
    design?: number | null;
    conditions?: number | null;
    clubhouse?: number | null;
    facilities?: number | null;
  } | null;
  /** Optional reviewer stats. Renders "N rated" next to author name when present. */
  reviewerStats?: {
    coursesRated?: number | null;
  } | null;
  /** Optional course subtitle (e.g. "The King's Course"). Falls back to splitting courseName. */
  courseSubtitle?: string | null;
  /** Optional review date — renders right-aligned in author row. */
  reviewDate?: string | Date | null;
}

const BREAKDOWN_KEYS = ['design', 'conditions', 'clubhouse', 'facilities'] as const;
const BREAKDOWN_LABELS: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'DESIGN',
  conditions: 'CONDITIONS',
  clubhouse: 'CLUBHOUSE',
  facilities: 'FACILITIES',
};

function formatDateShort(input: string | Date): string {
  try {
    const d = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export const InlineReviewCard: React.FC<InlineReviewCardProps> = ({
  courseName,
  rating,
  reviewer,
  isVisible,
  onTap,
  breakdown,
  reviewerStats,
  courseSubtitle,
  reviewDate,
  reviewText,
}) => {
  const initials = useMemo(
    () =>
      (reviewer.name || 'G')
        .split(/[\s.]/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join(''),
    [reviewer.name],
  );

  const formattedRating = formatFrostRating(rating);

  // Resolve course title + subtitle
  const { name: titleName, subtitle: derivedSubtitle } = useMemo(
    () => (courseSubtitle ? { name: courseName, subtitle: courseSubtitle } : splitCourseName(courseName)),
    [courseName, courseSubtitle],
  );

  // Breakdown values that exist
  const breakdownEntries = useMemo(() => {
    if (!breakdown) return [];
    return BREAKDOWN_KEYS.flatMap((k) => {
      const v = breakdown[k];
      return v == null || Number.isNaN(v) ? [] : [{ key: k, label: BREAKDOWN_LABELS[k], value: v }];
    });
  }, [breakdown]);

  const dateLabel = reviewDate ? formatDateShort(reviewDate) : '';
  const coursesRated = reviewerStats?.coursesRated ?? null;

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      aria-label={`Open review of ${titleName} by ${reviewer.name || 'Golfer'}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '18px 18px 16px',
        margin: 0,
        borderRadius: 24,
        background: FROST.glass,
        backdropFilter: FROST_BLUR.panel,
        WebkitBackdropFilter: FROST_BLUR.panel,
        border: `1px solid ${FROST.border}`,
        boxShadow: `${FROST.dropShadow}, ${FROST.innerHighlight}`,
        overflow: 'hidden',
        color: FROST.ink,
        cursor: 'pointer',
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
        WebkitTapHighlightColor: 'transparent',
        // Force GPU layer for blur perf
        transform: 'translateZ(0)',
        willChange: 'backdrop-filter',
      }}
    >
      {/* Decorative amber glow orb */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: FROST.amberGlow,
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }}
      />

      {/* Row 1 — Tier pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px 4px 8px',
          background: FROST.amberTint,
          border: `1px solid ${FROST.amberBorder}`,
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: FROST.amberSoft,
          marginBottom: 10,
          position: 'relative',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: FROST.amber,
            boxShadow: '0 0 8px rgba(247,147,30,0.8)',
          }}
        />
        {tierLabel}
      </div>

      {/* Row 2 — Title + score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          position: 'relative',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              lineHeight: 1.05,
              color: FROST.ink,
              wordBreak: 'break-word',
            }}
          >
            {titleName}
          </div>
          {derivedSubtitle && (
            <div
              style={{
                marginTop: 2,
                fontSize: 13,
                fontWeight: 500,
                color: FROST.inkMute,
                lineHeight: 1.2,
              }}
            >
              {derivedSubtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: '-2.2px',
              lineHeight: 0.85,
              paddingRight: 4,
              ...FROST_SCORE_GRADIENT,
            }}
          >
          {formattedRating}
          </span>
        </div>
      </div>

      {/* Row 3 — Breakdown bars (conditional) */}
      {breakdownEntries.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.10)',
            display: 'grid',
            gridTemplateColumns: `repeat(${breakdownEntries.length}, 1fr)`,
            gap: 8,
            marginBottom: 12,
          }}
        >
          {breakdownEntries.map(({ key, label, value }) => (
            <div key={key}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color: FROST.inkMuter,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '-0.2px',
                    color: FROST.ink,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {value.toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, value * 10))}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${FROST.amber}, ${FROST.amberSoft})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Row 4 — Author + date */}
      <div
        style={{
          marginTop: breakdownEntries.length > 0 ? 0 : 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <SquircleAvatar
            size={20}
            src={reviewer.avatar || undefined}
            alt={reviewer.name}
            fallback={initials}
            hideRing
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: FROST.ink,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {reviewer.name || 'Golfer'}
          </span>
          {coursesRated != null && (
            <>
              <span style={{ color: FROST.inkFaint, fontSize: 12 }}>·</span>
              <span
                style={{
                  fontSize: 12,
                  color: FROST.inkMuter,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {coursesRated} rated
              </span>
            </>
          )}
        </div>
        {dateLabel && (
          <span
            style={{
              fontSize: 11,
              color: FROST.inkFaint,
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateLabel}
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default InlineReviewCard;
