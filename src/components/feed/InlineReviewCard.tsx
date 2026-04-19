/**
 * InlineReviewCard — Single inline review card rendered above the action strip.
 *
 * Replaces the legacy ReviewHeaderPanel (small course pill).
 * Composition: amber accent bar, COURSE REVIEW badge + score, serif course name,
 * MapPin location, divider, reviewer (avatar + name + "reviewed this course"),
 * 2-line italic excerpt of the review text. Tap anywhere → opens ReviewBottomSheet.
 *
 * Visual language matches ReviewBottomSheet for continuity.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const AMBER = '#f59e0b';

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
}

export const InlineReviewCard: React.FC<InlineReviewCardProps> = ({
  courseName,
  rating,
  courseRegion,
  courseCountry,
  courseSubCountry,
  reviewText,
  reviewer,
  isVisible,
  onTap,
}) => {
  const locationParts = [courseSubCountry || courseRegion, courseCountry].filter(Boolean);
  const locationStr = locationParts.join(', ');

  const initials = (reviewer.name || 'G')
    .split(/[\s.]/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const formattedRating = rating === 10 ? '10' : rating.toFixed(1);

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 8,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'rgba(20, 13, 4, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 158, 11, 0.22)',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Watermark score — bleeds into background */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          right: -6,
          fontSize: 120,
          fontWeight: 900,
          color: 'rgba(245,158,11,0.055)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          userSelect: 'none',
          pointerEvents: 'none',
          fontFamily: 'Georgia, serif',
        }}
      >
        {formattedRating}
      </div>

      {/* Amber accent bar */}
      <div
        style={{
          height: 2.5,
          background: `linear-gradient(90deg, ${AMBER}CC, transparent)`,
        }}
      />

      <div style={{ padding: '12px 14px 14px', position: 'relative' }}>
        {/* Row 1: COURSE REVIEW badge + score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(245,158,11,0.12)',
              border: '0.5px solid rgba(245,158,11,0.35)',
              borderRadius: 6,
              padding: '4px 9px',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: AMBER,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              ★ Course Review
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                fontFamily: 'Georgia, serif',
              }}
            >
              {formattedRating}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              /10
            </span>
          </div>
        </div>

        {/* Row 2: Course name */}
        <div
          style={{
            fontSize: 19,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            fontFamily: 'Georgia, serif',
            marginBottom: 4,
          }}
        >
          {courseName}
        </div>

        {/* Row 3: Location */}
        {locationStr && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 11,
            }}
          >
            <MapPin size={12} color="rgba(255,255,255,0.35)" />
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              {locationStr}
            </span>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            height: 0.5,
            background: `linear-gradient(90deg, rgba(245,158,11,0.3) 0%, transparent 75%)`,
            marginBottom: 11,
          }}
        />

        {/* Row 4: Reviewer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: reviewText ? 10 : 0,
          }}
        >
          <SquircleAvatar
            size={32}
            src={reviewer.avatar || undefined}
            alt={reviewer.name}
            fallback={initials}
            hideRing
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {reviewer.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              reviewed this course
            </div>
          </div>
        </div>

        {/* Row 5: Review excerpt */}
        {reviewText && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
              fontStyle: 'italic',
            }}
          >
            "{reviewText}"
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default InlineReviewCard;
