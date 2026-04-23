import React from 'react';
import { Flag } from 'lucide-react';
import {
  AMBER,
  AMBER_DEEP,
  FONT_SANS,
  FONT_SERIF,
  HAIRLINE,
  HAIRLINE_SOFT,
  INK,
  INK_SECONDARY,
  INK_TERTIARY,
  PAPER,
  formatEditorialDate,
  splitRating,
} from './myRatingsTokens';
import type { MyRatingsTierCardProps } from './types';

/**
 * Tier 1 — Exceptional (≥9.5).
 * Hero editorial treatment: full-width image, oversized italic serif rating,
 * course name as serif overlay, optional review pull-quote, ambient
 * breakdown bars (no visible numbers).
 */
const MyRatingsTier1Card: React.FC<MyRatingsTierCardProps> = ({
  course,
  rank,
  onClick,
}) => {
  const hasReview = !!course.review_text && course.review_text.trim().length > 0;
  const heroHeight = hasReview ? 320 : 360;
  const isTop100 = course.global_rank != null && course.global_rank <= 100;
  const location =
    course.sub_country || course.country || '';
  const date = formatEditorialDate(course.review_date);
  const { int, dec } = splitRating(course.rating_value);

  // Ambient breakdown: 0–10 score → percentage. Falls back to 0 when null
  // (renders an empty track, preserving the four-bar rhythm).
  const bars: { label: string; pct: number }[] = [
    { label: 'DESIGN', pct: ((course.design_score ?? 0) / 10) * 100 },
    { label: 'CONDITION', pct: ((course.condition_score ?? 0) / 10) * 100 },
    { label: 'CLUBHOUSE', pct: ((course.clubhouse_score ?? 0) / 10) * 100 },
    { label: 'FACILITIES', pct: ((course.facilities_score ?? 0) / 10) * 100 },
  ];

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
        display: 'block',
      }}
      aria-label={`Open ${course.name}`}
    >
      {/* HERO IMAGE */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: heroHeight,
          background: course.thumbnail_image
            ? `url(${course.thumbnail_image})`
            : INK,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Bottom gradient for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0) 32%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {!course.thumbnail_image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PAPER,
              opacity: 0.4,
            }}
          >
            <Flag size={48} />
          </div>
        )}

        {/* Rank eyebrow (top-left) */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            color: PAPER,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          NO. {rank}
        </div>

        {/* Top 100 badge (top-right) */}
        {isTop100 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 8px',
              border: `0.5px solid ${AMBER}`,
              background: 'rgba(15,23,42,0.32)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: AMBER,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
            }}
          >
            TOP 100 · NO. {course.global_rank}
          </div>
        )}

        {/* Course name — Georgia italic, bottom-left */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 18,
            right: 130,
            color: PAPER,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: '-0.005em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 1px 6px rgba(0,0,0,0.35)',
          }}
        >
          {course.name}
        </div>

        {/* Rating — italic Georgia, bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: 14,
            display: 'flex',
            alignItems: 'baseline',
            color: PAPER,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}
        >
          <span
            style={{
              fontSize: 88,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {int}
          </span>
          <span
            style={{
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            .{dec}
          </span>
        </div>
      </div>

      {/* EDITORIAL BLOCK */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Byline */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: INK_TERTIARY,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {location && <span>{location}</span>}
          {location && <span style={{ opacity: 0.5 }}>·</span>}
          <span style={{ color: AMBER_DEEP }}>EXCEPTIONAL</span>
          {date && <span style={{ opacity: 0.5 }}>·</span>}
          {date && <span>{date.toUpperCase()}</span>}
        </div>

        {/* Pull-quote */}
        {hasReview && (
          <div
            style={{
              marginTop: 14,
              borderLeft: `2px solid ${AMBER}`,
              paddingLeft: 14,
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.45,
              color: INK_SECONDARY,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            “{course.review_text}”
          </div>
        )}

        {/* Separator before bars only if review present */}
        {hasReview && (
          <div
            style={{
              height: '0.5px',
              background: HAIRLINE,
              margin: '16px 0 12px',
            }}
          />
        )}

        {/* Ambient breakdown bars */}
        <div
          style={{
            marginTop: hasReview ? 0 : 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          {bars.map(({ label, pct }) => (
            <div key={label}>
              <div
                style={{
                  height: 2,
                  background: HAIRLINE_SOFT,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${pct}%`,
                    background: AMBER,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: INK_TERTIARY,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
};

export default MyRatingsTier1Card;
