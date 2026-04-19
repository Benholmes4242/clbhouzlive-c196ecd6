/**
 * InlineReviewCard — Compact review card shown at the bottom of review posts.
 *
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
          top: -18,
          right: -6,
          fontSize: 120,
          fontWeight: 900,
          color: 'rgba(247,147,30,0.06)',
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
        {/* Rating — absolute top-right, overlaps course name padding */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            fontFamily: 'Georgia, serif',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {formattedRating}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.38)',
              fontFamily: 'inherit',
            }}
          >
            /10
          </span>
        </div>

        {/* Row 1: Course name */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            fontFamily: 'Georgia, serif',
            marginBottom: 4,
            paddingRight: 64,
          }}
        >
          {courseName}
        </div>

        {/* Row 2: Location */}
        {locationStr && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
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
            marginBottom: 10,
          }}
        />

        {/* Row 3: Reviewer — avatar + (name + ★ COURSE REVIEW badge) / sub */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: reviewText ? 10 : 0,
            position: 'relative',
          }}
        >
          <SquircleAvatar
            size={32}
            src={reviewer.avatar || undefined}
            alt={reviewer.name}
            fallback={initials}
            hideRing
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.2,
                }}
              >
                {reviewer.name || 'Golfer'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(245,158,11,0.12)',
                  border: '0.5px solid rgba(245,158,11,0.35)',
                  borderRadius: 6,
                  padding: '3px 7px',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#f59e0b',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                ★ Course Review
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.38)',
                lineHeight: 1,
              }}
            >
              reviewed this course
            </span>
          </div>
        </div>

        {/* Row 4: Review excerpt */}
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
