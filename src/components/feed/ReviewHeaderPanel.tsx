/**
 * ReviewHeaderPanel - Dedicated review header for the Clubhouse feed.
 *
 * Renders above the BreathingRoomBottomBar when the active post is a review.
 * Composition: course thumbnail + course name + location (left),
 * rating number + tier label (right).
 *
 * Amber border-bottom visually separates the review metadata from the
 * caption + action strip below. Tapping anywhere in the panel opens the
 * full review detail sheet.
 *
 * Fades with the rest of the chrome via `isVisible`.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getRatingTierLabel } from '@/lib/ratingTier';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface ReviewHeaderPanelProps {
  courseName: string;
  courseImageUrl: string | null;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseSubCountry?: string | null;
  rating: number;
  isVisible: boolean;
  onTap: () => void;
}

export const ReviewHeaderPanel: React.FC<ReviewHeaderPanelProps> = ({
  courseName,
  courseImageUrl,
  courseRegion,
  courseCountry,
  courseSubCountry,
  rating,
  isVisible,
  onTap,
}) => {
  const tierLabel = getRatingTierLabel(rating);

  // Build a compact location string — prefer sub_country · country, fall back to region
  const location = [courseSubCountry || courseRegion, courseCountry]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.button
      type="button"
      onClick={onTap}
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
        padding: '12px 16px 12px',
        background:
          'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.45) 100%)',
        borderBottom: '1px solid rgba(247, 147, 30, 0.30)',
        border: 'none',
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: 'rgba(247, 147, 30, 0.30)',
        cursor: 'pointer',
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Geist, system-ui, sans-serif',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Course thumbnail */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            flexShrink: 0,
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {courseImageUrl && (
            <img
              src={courseImageUrl}
              alt={courseName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
            />
          )}
        </div>

        {/* Course info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Eyebrow: amber star + "Course Review" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#F7931E',
              lineHeight: 1,
            }}
          >
            <ClubhouseLogo size="xs" className="!h-[11px] !w-[11px]" />
            Course Review
          </div>

          {/* Course name */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            }}
          >
            {courseName}
          </div>

          {/* Location (only if present) */}
          {location && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.60)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25,
              }}
            >
              {location}
            </div>
          )}
        </div>

        {/* Rating block (right) */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"kern" 1, "liga" 1',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
            }}
          >
            {rating.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            {tierLabel}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default ReviewHeaderPanel;
