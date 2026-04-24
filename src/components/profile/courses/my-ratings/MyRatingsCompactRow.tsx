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
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatDate(dateIso);
  const country = course.country ?? '';
  const { int, dec } = splitRating(course.rating_value);

  const tierBits: { key: string; label: string; tier: string }[] = [
    { key: 'd', label: 'Design', tier: getCategoryTierLabel(course.design_score) },
    { key: 'c', label: 'Cond.', tier: getCategoryTierLabel(course.condition_score) },
    { key: 'k', label: 'Club.', tier: getCategoryTierLabel(course.clubhouse_score) },
    { key: 'f', label: 'Fac.', tier: getCategoryTierLabel(course.facilities_score) },
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
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
          }}
        >
          {/* Left column */}
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
                marginBottom: 5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {country}
              {country && dateText && ' · '}
              {dateText}
            </div>
            <div
              style={{
                fontSize: 9,
                color: INK_TERTIARY,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tierBits.map((b, i) => (
                <React.Fragment key={b.key}>
                  {i > 0 && (
                    <span
                      style={{
                        color: INK_QUATERNARY,
                        margin: '0 5px',
                      }}
                    >
                      ·
                    </span>
                  )}
                  <span style={{ color: INK_TERTIARY, fontWeight: 500 }}>
                    {b.label}{' '}
                  </span>
                  <span style={{ color: INK_SECONDARY, fontWeight: 600 }}>
                    {b.tier}
                  </span>
                </React.Fragment>
              ))}
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
      </div>
    </article>
  );
};

export default MyRatingsCompactRow;
