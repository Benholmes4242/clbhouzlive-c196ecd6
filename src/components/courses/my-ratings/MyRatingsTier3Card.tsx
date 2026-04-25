import React from 'react';
import { Flag } from 'lucide-react';
import {
  FONT_SANS,
  FONT_SERIF,
  HAIRLINE,
  INK,
  INK_QUATERNARY,
  INK_SECONDARY,
  INK_TERTIARY,
  PAPER,
  formatEditorialDate,
  splitRating,
} from './myRatingsTokens';
import { getCategoryTierLabel } from './myRatingsCardTiers';
import type { MyRatingsTierCardProps } from './types';

/**
 * Tier 3 — Excellent and below (<9.0).
 * Compact row: 72px thumbnail + content row with inline qualitative
 * breakdown labels (no numbers, no bars, no rings).
 */
const MyRatingsTier3Card: React.FC<MyRatingsTierCardProps> = ({
  course,
  rank,
  onClick,
}) => {
  const location = course.sub_country || course.country || '';
  const date = formatEditorialDate(course.review_date);
  const { int, dec } = splitRating(course.rating_value);

  const breakdown: { label: string; score: number | null }[] = [
    { label: 'Design', score: course.design_score },
    { label: 'Cond.', score: course.condition_score },
    { label: 'Club.', score: course.clubhouse_score },
    { label: 'Fac.', score: course.facilities_score },
  ];
  const hasAnyBreakdown = breakdown.some((b) => b.score != null);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        background: PAPER,
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 0,
        overflow: 'hidden',
        textAlign: 'left',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT_SANS,
        display: 'flex',
        alignItems: 'stretch',
      }}
      aria-label={`Open ${course.name}`}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: 72,
          height: 72,
          flexShrink: 0,
          background: course.thumbnail_image
            ? `url(${course.thumbnail_image})`
            : INK,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!course.thumbnail_image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PAPER,
              opacity: 0.5,
            }}
          >
            <Flag size={20} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 5,
            left: 6,
            color: PAPER,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textShadow: '0 1px 2px rgba(0,0,0,0.55)',
          }}
        >
          NO. {rank}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 14,
              color: INK,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {course.name}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 9.5,
              fontWeight: 600,
              color: INK_TERTIARY,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {location && <span>{location}</span>}
            {location && date && (
              <span style={{ opacity: 0.5, padding: '0 5px' }}>·</span>
            )}
            {date && <span>{date.toUpperCase()}</span>}
          </div>
          {hasAnyBreakdown && (
            <div
              style={{
                marginTop: 4,
                fontSize: 9,
                color: INK_TERTIARY,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {breakdown.map(({ label, score }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && (
                    <span style={{ color: INK_QUATERNARY, padding: '0 5px' }}>
                      ·
                    </span>
                  )}
                  <span style={{ color: INK_TERTIARY }}>{label} </span>
                  <span style={{ color: INK_SECONDARY, fontWeight: 600 }}>
                    {getCategoryTierLabel(score)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            flexShrink: 0,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            color: INK,
          }}
        >
          <span
            style={{
              fontSize: 22,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {int}
          </span>
          <span
            style={{
              fontSize: 13,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            .{dec}
          </span>
        </div>
      </div>
    </button>
  );
};

export default MyRatingsTier3Card;
