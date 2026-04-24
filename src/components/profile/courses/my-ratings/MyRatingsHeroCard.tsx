import React from 'react';
import { Flag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getTierName } from './myRatingsTiering';

/**
 * Hero card for the stratified My Ratings list (rating ≥9.0).
 * Renders FULL-BLEED — no border, no radius, no horizontal margin.
 * Consecutive heroes butt against each other separated by a 1px hairline.
 */

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const FONT_MONO =
  '"Geist Mono", ui-monospace, SFMono-Regular, monospace';

const INK = '#0F172A';
const INK_SECONDARY = '#475569';
const INK_TERTIARY = '#94A3B8';
const INK_QUATERNARY = '#CBD5E1';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const PAPER = '#FFFFFF';
const HAIRLINE = '#E2E8F0';
const HAIRLINE_SOFT = '#EEF2F6';

export interface RatedCourseData {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_image: string | null;
  is_top100: boolean;
  global_rank: number | null;
  last_played_at: string | null;
  rating_value: number;
  rating_id: string | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  review_date: string | null;
}

interface MyRatingsHeroCardProps {
  course: RatedCourseData;
  rank: number;
  onCourseClick: (courseId: string, ratingId: string | null) => void;
}

const splitRating = (rating: number) => {
  const int = Math.floor(rating);
  const dec = Math.round((rating * 10) % 10);
  return { int, dec };
};

const formatEditorialDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMMM, yyyy').toUpperCase();
};

const MyRatingsHeroCard: React.FC<MyRatingsHeroCardProps> = ({
  course,
  rank,
  onCourseClick,
}) => {
  const navigate = useNavigate();
  const reviewText = (course.review ?? '').trim();
  const hasReview = reviewText.length > 0;
  const heroHeight = hasReview ? 220 : 250;
  const hasAnyBreakdown =
    course.design_score != null ||
    course.condition_score != null ||
    course.clubhouse_score != null ||
    course.facilities_score != null;
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatEditorialDate(dateIso);
  const tierName = getTierName(course.rating_value);
  const country = course.country ?? '';
  const { int, dec } = splitRating(course.rating_value);

  const bars: { label: string; score: number | null }[] = [
    { label: 'DESIGN', score: course.design_score },
    { label: 'COND.', score: course.condition_score },
    { label: 'CLUB.', score: course.clubhouse_score },
    { label: 'FAC.', score: course.facilities_score },
  ];

  return (
    <article
      onClick={() => onCourseClick(course.id, course.rating_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCourseClick(course.id, course.rating_id);
        }
      }}
      style={{
        background: PAPER,
        borderBottom: `1px solid ${HAIRLINE}`,
        cursor: 'pointer',
        fontFamily: FONT_SANS,
        marginBottom: 0,
      }}
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
              'linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0) 35%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.62) 100%)',
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
            <Flag size={42} />
          </div>
        )}

        {/* Rank eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 20,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textShadow: '0 1px 2px rgba(15,23,42,0.4)',
          }}
        >
          NO. {rank}
        </div>

        {/* Course name */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 120,
            bottom: 16,
            color: PAPER,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.08,
            letterSpacing: '-0.015em',
            textShadow: '0 1px 3px rgba(15,23,42,0.5)',
          }}
        >
          {course.name}
        </div>

        {/* Rating numeral */}
        <div
          style={{
            position: 'absolute',
            right: 22,
            bottom: 16,
            display: 'flex',
            alignItems: 'baseline',
            color: PAPER,
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            textShadow: '0 2px 8px rgba(15,23,42,0.3)',
          }}
        >
          <span
            style={{
              fontSize: 72,
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
            }}
          >
            {int}
          </span>
          <span
            style={{
              fontSize: 36,
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
            }}
          >
            .{dec}
          </span>
        </div>
      </div>

      {/* EDITORIAL BLOCK */}
      <div style={{ padding: '16px 22px 20px' }}>
        {/* Byline */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: INK_TERTIARY,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: hasReview ? 12 : 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {country && <span>{country}</span>}
          {country && (
            <span style={{ color: INK_QUATERNARY }}>·</span>
          )}
          <span style={{ color: AMBER_DEEP }}>{tierName}</span>
          {dateText && (
            <span style={{ color: INK_QUATERNARY }}>·</span>
          )}
          {dateText && <span>{dateText}</span>}
        </div>

        {/* Pull-quote */}
        {hasReview && (
          <div
            style={{
              borderLeft: `2px solid ${AMBER}`,
              paddingLeft: 12,
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 15,
              lineHeight: 1.5,
              letterSpacing: '-0.005em',
              color: INK,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            “{reviewText}”
          </div>
        )}

        {/* Scored breakdown bars */}
        <div
          style={{
            marginTop: hasReview ? 16 : 0,
            paddingTop: hasReview ? 14 : 0,
            borderTop: hasReview ? `1px solid ${HAIRLINE_SOFT}` : 'none',
            display: 'flex',
            gap: 10,
          }}
        >
          {bars.map(({ label, score }) => {
            const pct = score != null ? (score / 10) * 100 : 0;
            return (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    height: 3,
                    background: HAIRLINE_SOFT,
                    borderRadius: 1.5,
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
                      borderRadius: 1.5,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: INK_SECONDARY,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9,
                      fontWeight: 600,
                      color: INK,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {score != null ? score.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};

export default MyRatingsHeroCard;
