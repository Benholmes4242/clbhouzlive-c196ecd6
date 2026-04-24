/**
 * InlineReviewCard — Frost Panel review tile (PR 7 editorial layout).
 *
 * Composition (top → bottom):
 *   1. Title row — course name + subtitle inline / score on right
 *   2. Location line
 *   3. Breakdown 2×2 grid (DESIGN / CONDITIONS / CLUBHOUSE / FACILITIES) — conditional
 *   4. Italic 2-line excerpt in curly quotes — conditional
 *   5. Author row (avatar + name + N rated + date, all inline)
 *   6. "READ FULL REVIEW →" amber affordance band (edge-to-edge)
 *
 * Tap → opens unified ReviewBottomSheet via store.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  FROST,
  FROST_BLUR,
  FROST_SCORE_GRADIENT,
  formatFrostRating,
  splitCourseName,
} from '@/lib/frostPanel';
import { useViewportWidth, COMPACT_VIEWPORT_MAX } from '@/hooks/useViewportWidth';

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

  breakdown?: {
    design?: number | null;
    conditions?: number | null;
    clubhouse?: number | null;
    facilities?: number | null;
  } | null;
  reviewerStats?: {
    coursesRated?: number | null;
  } | null;
  courseSubtitle?: string | null;
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
  courseRegion,
  courseCountry,
  courseSubCountry,
  reviewer,
  isVisible,
  onTap,
  breakdown,
  reviewerStats,
  courseSubtitle,
  reviewDate,
  reviewText,
}) => {
  const viewportWidth = useViewportWidth();
  const isCompact = viewportWidth < COMPACT_VIEWPORT_MAX;
  const titleSize = isCompact ? 18 : 20;
  const scoreSize = isCompact ? 38 : 44;

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

  const dateLabel = reviewDate ? formatDateShort(reviewDate) : '';
  const coursesRated = reviewerStats?.coursesRated ?? null;

  const locationParts = [courseSubCountry || courseRegion, courseCountry].filter(Boolean);
  const locationStr = locationParts.join(', ');

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
      aria-label={`Open full review of ${titleName}${derivedSubtitle ? ` — ${derivedSubtitle}` : ''} by ${reviewer.name || 'Golfer'}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '18px 18px 14px',
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

      {/* Row 1 — Title + score */}
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
              fontSize: titleSize,
              fontWeight: 800,
              letterSpacing: '-0.4px',
              lineHeight: 1.1,
              color: FROST.ink,
              wordBreak: 'break-word',
            }}
          >
            {titleName}
            {derivedSubtitle && (
              <>
                <span style={{ color: FROST.inkMute, fontWeight: 500 }}> — </span>
                <span style={{ color: FROST.inkMute, fontWeight: 500 }}>{derivedSubtitle}</span>
              </>
            )}
          </div>
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
              fontSize: scoreSize,
              fontWeight: 800,
              lineHeight: 0.85,
              ...FROST_SCORE_GRADIENT,
            }}
          >
            <span style={{ letterSpacing: '-2.2px' }}>
              {formattedRating.split('.')[0]}
            </span>
            {formattedRating.includes('.') && (
              <span style={{ letterSpacing: '-0.5px' }}>
                .{formattedRating.split('.')[1]}
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 13,
              color: FROST.inkFaint,
              fontWeight: 500,
              marginLeft: 2,
              letterSpacing: '-0.2px',
            }}
          >
            /10
          </span>
        </div>
      </div>

      {/* Location line */}
      {locationStr && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: FROST.inkMuter,
            letterSpacing: '0.2px',
            position: 'relative',
          }}
        >
          {locationStr}
        </div>
      )}

      {/* Row 2 — Breakdown 2×2 grid (conditional) */}
      {breakdownEntries.length > 0 && (
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: 18,
            rowGap: 10,
            paddingTop: 12,
            paddingBottom: 14,
            borderTop: `1px solid ${FROST.borderSoft}`,
            borderBottom: `1px solid ${FROST.borderSoft}`,
            marginBottom: 12,
            position: 'relative',
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
                  letterSpacing: '-0.2px',
                  color: FROST.ink,
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

      {/* Row 4 — Author row (consolidated inline) */}
      <div
        style={{
          marginTop: breakdownEntries.length > 0 ? 0 : 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
          position: 'relative',
        }}
      >
        <SquircleAvatar
          size={22}
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
            marginLeft: 2,
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
        {dateLabel && (
          <>
            <span style={{ color: FROST.inkFaint, fontSize: 12 }}>·</span>
            <span
              style={{
                fontSize: 11,
                color: FROST.inkFaint,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {dateLabel}
            </span>
          </>
        )}
      </div>

      {/* Row 5 — "READ FULL REVIEW →" affordance band (edge-to-edge) */}
      <div
        style={{
          marginLeft: -18,
          marginRight: -18,
          marginBottom: -14,
          marginTop: 12,
          padding: '10px 18px',
          background: 'rgba(247, 147, 30, 0.08)',
          borderTop: `1px solid ${FROST.amberBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: FROST.amberSoft,
          }}
        >
          Read full review
        </span>
        <ChevronRight size={14} color={FROST.amberSoft} />
      </div>
    </motion.button>
  );
};

export default InlineReviewCard;
