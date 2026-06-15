/**
 * InlineReviewCard — caption-style overlay for the immersive feed.
 *
 * Direction A: no opaque panel. Sits as a light caption over the feed's
 * bottom scrim with a small glass verdict pill. Heavy detail (sub-scores,
 * watermark, serif slab) lives on the review detail page.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatFrostRating, splitCourseName } from '@/lib/frostPanel';

const FONTS = {
  geist: "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

export interface InlineReviewCardProps {
  courseName: string;
  rating: number;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseSubCountry?: string | null;
  courseRating?: number | null;
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
  /** When true, the "Read review" label + chevron render in white (fullscreen). */
  whiteReadReview?: boolean;
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
  reviewerStats,
  courseSubtitle,
  whiteReadReview = false,
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
        margin: 0,
        padding: 0,
        background: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: FONTS.geist,
        WebkitTapHighlightColor: 'transparent',
        paddingRight: 70,
        textShadow: '0 1px 8px rgba(0,0,0,0.5)',
      }}
    >
      {/* Verdict pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 11px',
          borderRadius: 999,
          background: 'rgba(10,14,20,0.52)',
          backdropFilter: 'blur(14px) saturate(150%)',
          WebkitBackdropFilter: 'blur(14px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.16)',
          marginBottom: 11,
          fontFamily: FONTS.geist,
        }}
      >
        <img
          src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
          alt=""
          style={{ width: 14, height: 14, objectFit: 'contain' }}
          aria-hidden="true"
        />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#fff' }}>REVIEW</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {formattedRating}
          <span style={{ fontSize: 10, opacity: 0.6 }}>/10</span>
        </span>
      </div>

      {/* Author row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          marginBottom: 8,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <SquircleAvatar
            size={28}
            src={reviewer.avatar || undefined}
            alt={reviewer.name}
            fallback={initials}
            hideRing
          />
          {followBadge && !followBadge.isOwnPost && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!followBadge.isFollowing) followBadge.onFollow();
              }}
              aria-label={followBadge.isFollowing ? 'Following' : 'Follow'}
              aria-pressed={followBadge.isFollowing}
              style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#F7931E',
                border: '1.5px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: followBadge.isFollowing ? 'default' : 'pointer',
              }}
            >
              {followBadge.isFollowing ? (
                <Check size={10} strokeWidth={3} color="#fff" />
              ) : (
                <Plus size={10} strokeWidth={3} color="#fff" />
              )}
            </button>
          )}
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {reviewer.name || 'Golfer'}
        </span>
        {coursesRated != null && (
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.70)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            · {coursesRated} rated
          </span>
        )}
      </div>

      {/* Course name caption */}
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}
      >
        {titleName}
        {derivedSubtitle && (
          <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}> — {derivedSubtitle}</span>
        )}
      </div>

      {locationStr && (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.78)',
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            {locationStr}
            <span style={{ opacity: 0.5 }}>·</span>
            <span
              style={{
                color: whiteReadReview ? '#fff' : '#F7931E',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              Read review{' '}
              <ChevronRight
                size={13}
                color={whiteReadReview ? '#fff' : '#F7931E'}
              />
            </span>
          </span>
          {courseRating != null && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                padding: '3px 8px',
                borderRadius: 999,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              <img
                src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                alt=""
                aria-hidden="true"
                style={{ width: 12, height: 12, objectFit: 'contain' }}
              />
              {courseRating.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
};

export default InlineReviewCard;
