/**
 * InlineReviewCard — Editorial Frost Panel review tile (PR 7 v2).
 *
 * Composition (top → bottom):
 *   1. Atmospheric "X.X" watermark (Playfair, 4% opacity, behind content)
 *   2. Prestige rule eyebrow — "REVIEW ────"
 *   3. Title row — Playfair headline + gradient-masked Geist score
 *   4. Location line
 *   5. Compressed breakdown row (single line, abbreviated labels)
 *   6. Italic Georgia excerpt in curly quotes (2-line clamp)
 *   7. Author row — avatar + name + "N rated" + inline `Read review →`
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

const FONTS = {
  geist: "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  serifDisplay: "'Playfair Display', Georgia, 'Times New Roman', serif",
  serifSystem: "Georgia, 'Times New Roman', serif",
};

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
const TILE_LABELS_SHORT: Record<typeof BREAKDOWN_KEYS[number], string> = {
  design: 'Des',
  conditions: 'Cond',
  clubhouse: 'Club',
  facilities: 'Fac',
};

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

  const { name: titleName, subtitle: derivedSubtitle } = useMemo(
    () => (courseSubtitle ? { name: courseName, subtitle: courseSubtitle } : splitCourseName(courseName)),
    [courseName, courseSubtitle],
  );

  const breakdownEntries = useMemo(() => {
    if (!breakdown) return [];
    return BREAKDOWN_KEYS.flatMap((k) => {
      const v = breakdown[k];
      return v == null || Number.isNaN(v) ? [] : [{ key: k, value: v }];
    });
  }, [breakdown]);

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
        padding: '16px 18px 14px',
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
        fontFamily: FONTS.geist,
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

      {/* Atmospheric watermark — Playfair score behind content */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -12,
          bottom: -56,
          fontFamily: FONTS.serifDisplay,
          fontSize: 200,
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
          letterSpacing: '-6px',
          userSelect: 'none',
        }}
      >
        {formattedRating}
      </div>

      {/* === Content (above watermark) === */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Prestige rule eyebrow — "REVIEW ────" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: FONTS.serifDisplay,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: FROST.amberSoft,
              flexShrink: 0,
            }}
          >
            Review
          </span>
          <div
            aria-hidden
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, ${FROST.amberBorder}, transparent)`,
            }}
          />
        </div>

        {/* Row 1 — Title + score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONTS.serifDisplay,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.4px',
                lineHeight: 1.05,
                color: FROST.ink,
                wordBreak: 'break-word',
              }}
            >
              {titleName}
              {derivedSubtitle && (
                <>
                  <span
                    style={{
                      color: FROST.inkMute,
                      fontWeight: 500,
                      fontStyle: 'italic',
                    }}
                  >
                    {' — '}{derivedSubtitle}
                  </span>
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
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 0.85,
                ...FROST_SCORE_GRADIENT,
              }}
            >
              <span style={{ letterSpacing: '-1.4px' }}>
                {formattedRating.split('.')[0]}
              </span>
              {formattedRating.includes('.') && (
                <span style={{ letterSpacing: '-0.4px' }}>
                  <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Symbol", system-ui, sans-serif' }}>·</span>
                  {formattedRating.split('.')[1]}
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: 11,
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
              marginTop: 4,
              fontSize: 11,
              color: FROST.inkMuter,
              letterSpacing: '0.2px',
            }}
          >
            {locationStr}
          </div>
        )}

        {/* Compressed breakdown row — abbreviated labels */}
        {breakdownEntries.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              paddingBottom: 10,
              borderTop: `1px solid ${FROST.borderSoft}`,
              borderBottom: `1px solid ${FROST.borderSoft}`,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 0,
              fontSize: 11,
              color: FROST.inkMute,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.3px',
            }}
          >
            {breakdownEntries.map(({ key, value }, i) => (
              <React.Fragment key={key}>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: FROST.inkMuter,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      fontSize: 10,
                    }}
                  >
                    {TILE_LABELS_SHORT[key]}
                  </span>
                  <span style={{ fontWeight: 700, color: FROST.ink, fontSize: 12 }}>
                    {value.toFixed(1)}
                  </span>
                </span>
                {i < breakdownEntries.length - 1 && (
                  <span
                    aria-hidden
                    style={{
                      color: FROST.inkFaint,
                      padding: '0 8px',
                      fontSize: 11,
                    }}
                  >
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Italic Georgia excerpt in curly quotes */}
        {reviewText && (
          <div
            style={{
              marginTop: breakdownEntries.length > 0 ? 0 : 12,
              marginBottom: 12,
              fontFamily: FONTS.serifSystem,
              fontStyle: 'italic',
              fontSize: 13.5,
              lineHeight: 1.45,
              color: FROST.inkMute,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {`\u201C${reviewText}\u201D`}
          </div>
        )}

        {/* Author row with inline Read review link */}
        <div
          style={{
            marginTop: reviewText || breakdownEntries.length > 0 ? 0 : 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
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
          {/* Inline Read review serif link — replaces date AND old amber band */}
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontFamily: FONTS.serifDisplay,
              fontStyle: 'italic',
              fontSize: 13,
              fontWeight: 500,
              color: FROST.amberSoft,
              flexShrink: 0,
            }}
          >
            Read review
            <ChevronRight size={13} color={FROST.amberSoft} strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default InlineReviewCard;
