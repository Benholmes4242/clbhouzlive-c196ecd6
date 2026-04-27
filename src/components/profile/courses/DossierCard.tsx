import React from 'react';
import { Flag, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { getTierName, type RatedCourseData } from './my-ratings/myRatingsTiers';

/**
 * DossierCard — single primitive for displaying a rated course in the
 * profile Courses tab. Shows portrait thumbnail with overlaid score,
 * course name, tier/date eyebrow, 2×2 breakdown grid, and Full Review CTA.
 *
 * Used uniformly across all rating tiers (no hero/compact split).
 */

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

const INK = '#0F172A';
const INK_TERTIARY = '#94A3B8';
const INK_QUATERNARY = '#CBD5E1';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const HAIRLINE_SOFT = '#EEF2F6';

export interface DossierCardProps {
  course: RatedCourseData;
  rank: number;
  onCourseClick: (courseId: string, ratingId: string | null) => void;
  onFullReview: (courseId: string, ratingId: string | null) => void;
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

const DossierCard: React.FC<DossierCardProps> = ({
  course,
  rank,
  onCourseClick,
  onFullReview,
}) => {
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatEditorialDate(dateIso);
  const tierName = getTierName(course.rating_value);
  const { int, dec } = splitRating(course.rating_value);
  const reviewText = (course.review ?? '').trim();
  const hasReview = reviewText.length > 0;

  const bars: { label: string; score: number | null }[] = [
    { label: 'DESIGN', score: course.design_score },
    { label: 'CONDITION', score: course.condition_score },
    { label: 'CLUBHOUSE', score: course.clubhouse_score },
    { label: 'FACILITIES', score: course.facilities_score },
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
        background: '#FFFFFF',
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        fontFamily: FONT_SANS,
        padding: 16,
        display: 'flex',
        gap: 14,
        alignItems: 'stretch',
      }}
    >
      {/* IMAGE */}
      <div
        style={{
          position: 'relative',
          width: 130,
          height: 170,
          flexShrink: 0,
          borderRadius: 8,
          overflow: 'hidden',
          background: course.thumbnail_image
            ? `url(${course.thumbnail_image})`
            : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)',
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
              color: '#FFFFFF',
              opacity: 0.4,
            }}
          >
            <Flag size={28} />
          </div>
        )}
        {/* rank top-left */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            color: 'rgba(255,255,255,0.95)',
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.2em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          NO. {rank}
        </div>
        {/* score bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: 10,
            bottom: 8,
            display: 'flex',
            alignItems: 'baseline',
            color: '#FFFFFF',
            fontFamily: FONT_SERIF,
            fontWeight: 900,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
        >
          <span
            style={{
              fontSize: 30,
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
            }}
          >
            {int}
          </span>
          <span
            style={{
              fontSize: 16,
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
            }}
          >
            .{dec}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingTop: 2,
        }}
      >
        {/* Course name */}
        <div
          style={{
            fontFamily: FONT_SERIF,
            color: INK,
            fontWeight: 900,
            fontSize: 17,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.name}
        </div>

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.15em',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: AMBER_DEEP }}>{tierName}</span>
          {dateText && <span style={{ color: INK_QUATERNARY }}>·</span>}
          {dateText && <span style={{ color: INK_TERTIARY }}>{dateText}</span>}
        </div>

        {/* Breakdown 2×2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: 12,
            rowGap: 8,
            marginTop: 2,
          }}
        >
          {bars.map(({ label, score }) => {
            const pct = score != null ? (score / 10) * 100 : 0;
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: '#64748B',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: HAIRLINE_SOFT,
                      borderRadius: 999,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${pct}%`,
                        background: AMBER,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: score != null ? INK : INK_QUATERNARY,
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                      minWidth: 18,
                      textAlign: 'right',
                    }}
                  >
                    {score != null ? score.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full review CTA */}
        {hasReview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFullReview(course.id, course.rating_id);
            }}
            style={{
              marginTop: 'auto',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: AMBER_DEEP,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Full review
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </article>
  );
};

export default DossierCard;
