import React from 'react';
import { format } from 'date-fns';
import { Flag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RatedCourseData } from './MyRatingsHeroCard';

/**
 * Compact row for the stratified My Ratings list (rating <9.0
 * in rating-sorted mode, or any rated course in flat modes).
 * Stays inside the page's 16px horizontal padding (not full-bleed).
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

interface MyRatingsCompactRowProps {
  course: RatedCourseData;
  rank: number;
  onCourseClick: (courseId: string, ratingId: string | null) => void;
}

const splitRating = (rating: number) => {
  const int = Math.floor(rating);
  const dec = Math.round((rating * 10) % 10);
  return { int, dec };
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMMM, yyyy').toUpperCase();
};

const MyRatingsCompactRow: React.FC<MyRatingsCompactRowProps> = ({
  course,
  rank,
  onCourseClick,
}) => {
  const navigate = useNavigate();
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatDate(dateIso);
  const country = course.country ?? '';
  const { int, dec } = splitRating(course.rating_value);

  const hasAnyBreakdown =
    course.design_score != null ||
    course.condition_score != null ||
    course.clubhouse_score != null ||
    course.facilities_score != null;

  const breakdownCells: { key: string; label: string; score: number | null }[] = [
    { key: 'd', label: 'DESIGN', score: course.design_score },
    { key: 'c', label: 'COND.', score: course.condition_score },
    { key: 'k', label: 'CLUB.', score: course.clubhouse_score },
    { key: 'f', label: 'FAC.', score: course.facilities_score },
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
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        marginBottom: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{ display: 'flex', minHeight: 76 }}>
        {/* Thumbnail */}
        <div
          style={{
            position: 'relative',
            width: 76,
            flexShrink: 0,
            background: course.thumbnail_image
              ? `url(${course.thumbnail_image})`
              : 'rgba(15,23,42,0.06)',
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
                color: INK_TERTIARY,
              }}
            >
              <Flag size={20} />
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              top: 5,
              left: 7,
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '0.12em',
              textShadow: '0 1px 2px rgba(15,23,42,0.5)',
            }}
          >
            {rank}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 0,
          }}
        >
          {/* Top row: name/meta + rating numeral */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 14,
                  color: INK,
                  lineHeight: 1.2,
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 4,
                }}
              >
                {course.name}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: INK_TERTIARY,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {country}
                {country && dateText && ' · '}
                {dateText}
              </div>
            </div>

            {/* Rating numeral */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                flexShrink: 0,
                fontFamily: FONT_SERIF,
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: INK,
                  letterSpacing: '-0.02em',
                  lineHeight: 0.85,
                }}
              >
                {int}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: INK_SECONDARY,
                  letterSpacing: '-0.02em',
                  lineHeight: 0.85,
                }}
              >
                .{dec}
              </span>
            </div>
          </div>

          {/* Breakdown 2x2 grid OR amber nudge */}
          {hasAnyBreakdown ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 12px',
              }}
            >
              {breakdownCells.map(({ key, label, score }) => {
                const pct = score != null ? (score / 10) * 100 : 0;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        height: 2,
                        background: HAIRLINE_SOFT,
                        borderRadius: 1,
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
                          borderRadius: 1,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: INK_TERTIARY,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          flexGrow: 1,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONT_SERIF,
                          fontSize: 12,
                          color: INK,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {score != null ? score.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${course.id}/rate`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/courses/${course.id}/rate`);
                }
              }}
              style={{
                background: 'rgba(247, 147, 30, 0.08)',
                border: '1px solid rgba(247, 147, 30, 0.2)',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} color={AMBER_DEEP} strokeWidth={2.5} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: AMBER_DEEP,
                  letterSpacing: '0.2px',
                }}
              >
                Add breakdowns for a more detailed rating
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default MyRatingsCompactRow;
