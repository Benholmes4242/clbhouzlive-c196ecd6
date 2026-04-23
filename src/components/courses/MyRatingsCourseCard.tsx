import React, { useState } from 'react';
import { Flag, GripVertical } from 'lucide-react';
import MyRatingsRing from './MyRatingsRing';
import {
  getBreakdownSum,
  getTier,
  hasAnyBreakdown,
  hasFullBreakdown,
  type TiedAbove,
} from '@/lib/breakdown';

export interface MyRatingsCourseCardData {
  id: string;
  rating: number;
  review_date: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  golf_courses: {
    id: string;
    name: string;
    country: string | null;
    sub_country?: string | null;
    region?: string | null;
    global_rank: number | null;
    thumbnail_image: string | null;
  };
  tiedAbove?: TiedAbove;
}

interface Props {
  course: MyRatingsCourseCardData;
  rank: number;
  onCourseClick: (courseId: string) => void;
  onAddBreakdown: (courseId: string) => void;
  /** When provided, renders a drag-handle in the top-right corner. */
  dragHandle?: {
    listeners?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    setActivatorNodeRef?: (el: HTMLElement | null) => void;
    isDragging?: boolean;
  };
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildTiedCopy = (
  tiedAbove: TiedAbove,
  selfRating: number
): { collapsed: string; expanded: string } => {
  const ratingStr = selfRating.toFixed(1);
  const { courseName, thisTotal, otherTotal } = tiedAbove;

  // Both have breakdown
  if (thisTotal != null && otherTotal != null) {
    return {
      collapsed: `Why above ${courseName}?`,
      expanded: `Tied at ${ratingStr} with ${courseName} · breakdown ${thisTotal.toFixed(
        1
      )} vs ${otherTotal.toFixed(1)}`,
    };
  }

  // Only this has breakdown
  if (thisTotal != null && otherTotal == null) {
    return {
      collapsed: `Why above ${courseName}?`,
      expanded: `Tied at ${ratingStr} with ${courseName} · ranked higher by breakdown total (${thisTotal.toFixed(
        1
      )} — ${courseName} has no breakdown)`,
    };
  }

  // Only other has breakdown — shouldn't usually occur in "above" position,
  // but handle gracefully.
  if (thisTotal == null && otherTotal != null) {
    return {
      collapsed: `Why above ${courseName}?`,
      expanded: `Tied at ${ratingStr} with ${courseName} · ranked higher by review date`,
    };
  }

  // Neither has breakdown — fell back to review_date
  return {
    collapsed: `Why above ${courseName}?`,
    expanded: `Tied at ${ratingStr} with ${courseName} · ranked higher by review date (rated more recently)`,
  };
};

const MyRatingsCourseCard: React.FC<Props> = ({
  course,
  rank,
  onCourseClick,
  onAddBreakdown,
  dragHandle,
}) => {
  const [expanded, setExpanded] = useState(false);

  const c = course.golf_courses;
  const tier = getTier(course.rating);
  const breakdownSum = getBreakdownSum(course);
  const fullBreakdown = hasFullBreakdown(course);
  const anyBreakdown = hasAnyBreakdown(course);
  const isTop100 = c.global_rank != null && c.global_rank <= 100;

  const location = c.sub_country || c.country || c.region || '';
  const formattedDate = formatDate(course.review_date);

  const intPart = Math.floor(course.rating);
  const decPart = Math.round((course.rating * 10) % 10);

  return (
    <div
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: '0.5px solid #E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: '"Geist", sans-serif',
        boxShadow: dragHandle?.isDragging ? '0 8px 24px rgba(15,23,42,0.18)' : 'none',
      }}
    >
      {dragHandle && (
        <button
          type="button"
          ref={(el) => dragHandle.setActivatorNodeRef?.(el)}
          {...(dragHandle.attributes ?? {})}
          {...(dragHandle.listeners ?? {})}
          aria-label="Drag to reorder"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 5,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.92)',
            border: '0.5px solid #E2E8F0',
            borderRadius: 6,
            color: '#475569',
            cursor: 'grab',
            touchAction: 'none',
            padding: 0,
          }}
        >
          <GripVertical size={14} />
        </button>
      )}
      {/* TOP SECTION ~76px */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Image */}
        <button
          type="button"
          onClick={() => onCourseClick(c.id)}
          style={{
            position: 'relative',
            width: 76,
            height: 76,
            flexShrink: 0,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: c.thumbnail_image
              ? `url(${c.thumbnail_image})`
              : '#0F172A',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-label={`Open ${c.name}`}
        >
          {/* Vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Fallback flag icon */}
          {!c.thumbnail_image && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                opacity: 0.5,
              }}
            >
              <Flag size={22} />
            </div>
          )}

          {/* Rank badge top-left */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              display: 'flex',
              alignItems: 'baseline',
              gap: 2,
              color: '#FFFFFF',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              No.
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {rank}
            </span>
          </div>

          {/* Top 100 marker bottom-left */}
          {isTop100 && (
            <div
              style={{
                position: 'absolute',
                bottom: 5,
                left: 6,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#F7931E',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              TOP 100 · {c.global_rank}
            </div>
          )}
        </button>

        {/* Right side */}
        <div
          style={{
            flex: 1,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          {/* Name + meta */}
          <button
            type="button"
            onClick={() => onCourseClick(c.id)}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 3,
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#64748B',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {location}
              </span>
              <span style={{ flexShrink: 0, color: '#CBD5E1' }}>·</span>
              <span style={{ flexShrink: 0 }}>{formattedDate}</span>
            </div>
          </button>

          {/* Rating cluster */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
              gap: 2,
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#F7931E',
                textTransform: 'uppercase',
              }}
            >
              {tier}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {intPart}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#475569',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                .{decPart}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hairline */}
      <div style={{ height: '0.5px', background: '#E2E8F0' }} />

      {/* BOTTOM SECTION — breakdown row OR add-breakdown CTA */}
      {anyBreakdown ? (
        <div
          style={{
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#FAFBFC',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
            }}
          >
            <MyRatingsRing
              score={course.design_score ?? 0}
              label="Design"
              isGhost={course.design_score == null}
            />
            <MyRatingsRing
              score={course.condition_score ?? 0}
              label="Condition"
              isGhost={course.condition_score == null}
            />
            <MyRatingsRing
              score={course.clubhouse_score ?? 0}
              label="Clubhouse"
              isGhost={course.clubhouse_score == null}
            />
            <MyRatingsRing
              score={course.facilities_score ?? 0}
              label="Facilities"
              isGhost={course.facilities_score == null}
            />
          </div>

          {/* Vertical divider + total */}
          <div style={{ width: '0.5px', height: 38, background: '#E2E8F0' }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flexShrink: 0,
              minWidth: 44,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: fullBreakdown ? '#0F172A' : '#475569',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {breakdownSum != null ? breakdownSum.toFixed(1) : '—'}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#94A3B8',
                marginTop: 2,
                letterSpacing: '0.04em',
              }}
            >
              / 40
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAddBreakdown(c.id)}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: '#FFF8EC',
            border: 'none',
            borderTop: '0.5px solid #F4D9A8',
            color: '#B5650F',
            fontFamily: '"Geist", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            letterSpacing: '0.01em',
          }}
        >
          <span>Add breakdown to refine ranking</span>
          <span style={{ fontSize: 14, lineHeight: 1 }}>›</span>
        </button>
      )}

      {/* TIE REVEAL */}
      {course.tiedAbove && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'transparent',
            border: 'none',
            borderTop: '0.5px solid #E2E8F0',
            color: '#475569',
            fontFamily: '"Geist", sans-serif',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '0.5px solid #94A3B8',
              fontSize: 8,
              fontWeight: 700,
              color: '#475569',
              flexShrink: 0,
            }}
          >
            i
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {expanded
              ? buildTiedCopy(course.tiedAbove, course.rating).expanded
              : buildTiedCopy(course.tiedAbove, course.rating).collapsed}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94A3B8',
              flexShrink: 0,
            }}
          >
            {expanded ? '−' : '+'}
          </span>
        </button>
      )}
    </div>
  );
};

export default MyRatingsCourseCard;
