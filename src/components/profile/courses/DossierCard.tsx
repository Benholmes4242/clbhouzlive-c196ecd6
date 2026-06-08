import React, { useState } from 'react';
import { Flag, ArrowUpRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';

/**
 * DossierCard — Direction B scannable row.
 * Collapsed: big rank + 48x48 thumb + name + date + compact rating + chevron.
 * Expanded: 4-bar breakdown + "View course" + "Full review".
 * Tap the row to toggle expand. Navigation only via the explicit CTAs.
 */

const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

const INK = '#0F172A';
const INK_TERTIARY = '#94A3B8';
const INK_QUATERNARY = '#CBD5E1';
const AMBER = '#F7931E';
const AMBER_DEEP = '#F7931E';
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
  const [expanded, setExpanded] = useState(false);
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatEditorialDate(dateIso);
  const { int, dec } = splitRating(course.rating_value);
  const reviewText = (course.review ?? '').trim();
  const hasReview = reviewText.length > 0;

  const toggle = () => setExpanded((v) => !v);

  const bars: { label: string; score: number | null }[] = [
    { label: 'DESIGN', score: course.design_score },
    { label: 'CONDITION', score: course.condition_score },
    { label: 'CLUBHOUSE', score: course.clubhouse_score },
    { label: 'FACILITIES', score: course.facilities_score },
  ];

  return (
    <article
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        fontFamily: FONT_SANS,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* HEADER (always visible) */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Rank number */}
        <span
          style={{
            fontFamily: FONT_SANS,
            color: INK,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            width: 30,
            textAlign: 'center',
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {rank}
        </span>

        {/* Thumb 48x48 */}
        <div
          style={{
            position: 'relative',
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 10,
            overflow: 'hidden',
            background: course.thumbnail_image
              ? `url(${course.thumbnail_image})`
              : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
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
                color: '#FFFFFF',
                opacity: 0.4,
              }}
            >
              <Flag size={20} />
            </div>
          )}
        </div>

        {/* Middle */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontFamily: FONT_SANS,
              color: INK,
              fontWeight: 700,
              fontSize: 15.5,
              lineHeight: 1.15,
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
          {dateText && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: INK_TERTIARY,
              }}
            >
              {dateText}
            </div>
          )}
        </div>

        {/* Rating */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {int}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK_TERTIARY, letterSpacing: '-0.02em' }}>
            .{dec}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={18}
          color={INK_TERTIARY}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </div>

      {/* EXPANDED */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 0 }}>
          {/* Breakdown 2×2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 12,
              rowGap: 8,
            }}
          >
            {bars.map(({ label, score }) => {
              const pct = score != null ? (score / 10) * 100 : 0;
              return (
                <div
                  key={label}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCourseClick(course.id, course.rating_id);
              }}
              style={{
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
              View course
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </button>
            {hasReview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFullReview(course.id, course.rating_id);
                }}
                style={{
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
        </div>
      )}
    </article>
  );
};

export default DossierCard;
