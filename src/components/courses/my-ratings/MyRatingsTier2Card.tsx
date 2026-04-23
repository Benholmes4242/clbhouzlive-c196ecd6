import React from 'react';
import { Flag } from 'lucide-react';
import {
  AMBER,
  AMBER_DEEP,
  FONT_MONO,
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
 * Tier 2 — Outstanding (9.0–9.4).
 * Medium card: 140px image header, two-column meta + rating row,
 * optional review one-liner, horizontal breakdown bars with scores.
 */
const MyRatingsTier2Card: React.FC<MyRatingsTierCardProps> = ({
  course,
  rank,
  onClick,
}) => {
  const isTop100 = course.global_rank != null && course.global_rank <= 100;
  const hasReview = !!course.review_text && course.review_text.trim().length > 0;
  const location = course.sub_country || course.country || '';
  const date = formatEditorialDate(course.review_date);
  const { int, dec } = splitRating(course.rating_value);

  const rows: { label: string; score: number | null }[] = [
    { label: 'Design', score: course.design_score },
    { label: 'Cond.', score: course.condition_score },
    { label: 'Club.', score: course.clubhouse_score },
    { label: 'Fac.', score: course.facilities_score },
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
      {/* IMAGE */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 140,
          background: course.thumbnail_image
            ? `url(${course.thumbnail_image})`
            : INK,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0) 50%, rgba(15,23,42,0.4) 100%)',
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
            <Flag size={28} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            color: PAPER,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          NO. {rank}
        </div>
        {isTop100 && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '3px 6px',
              border: `0.5px solid ${AMBER}`,
              background: 'rgba(15,23,42,0.32)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: AMBER,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.16em',
            }}
          >
            TOP 100 · NO. {course.global_rank}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          {/* Left: name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                lineHeight: 1.2,
                color: INK,
                letterSpacing: '-0.005em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {course.name}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                fontWeight: 600,
                color: INK_TERTIARY,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {location && <span>{location}</span>}
              {location && date && <span style={{ opacity: 0.5 }}>·</span>}
              {date && <span>{date.toUpperCase()}</span>}
            </div>
          </div>

          {/* Right: tier label + rating */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 7.5,
                fontWeight: 700,
                color: AMBER_DEEP,
                letterSpacing: '0.18em',
                marginBottom: 2,
              }}
            >
              OUTSTANDING
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                fontFamily: FONT_SERIF,
                fontStyle: 'italic',
                color: INK,
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {int}
              </span>
              <span
                style={{
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                .{dec}
              </span>
            </div>
          </div>
        </div>

        {/* Optional review one-liner */}
        {hasReview && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `0.5px solid ${HAIRLINE}`,
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.4,
              color: INK_SECONDARY,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            “{course.review_text}”
          </div>
        )}

        {/* Breakdown */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `0.5px solid ${HAIRLINE}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {rows.map(({ label, score }) => {
            const pct = score == null ? 0 : (score / 10) * 100;
            return (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr 26px',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: INK_TERTIARY,
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    height: 3,
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
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: score == null ? INK_TERTIARY : INK_SECONDARY,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {score == null ? '—' : score.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};

export default MyRatingsTier2Card;
