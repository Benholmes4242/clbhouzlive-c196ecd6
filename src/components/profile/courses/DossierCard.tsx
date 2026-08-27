import React, { useState } from 'react';
import { Flag, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDayMonthYearShortGB } from '@/i18n/format';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { SubScoreStack } from '@/features/courses/_shared/scoreBands';
import { A, SANS, LABEL, NUM, Action, StatRow, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';

/**
 * DossierCard - scannable rated-course row.
 * Collapsed: rank + thumb + name + meta line + rating (+ Top 100 rank).
 * Expanded: 2x2 banded sub-score grid, scoring stat row (own profile only),
 * then the quiet actions. Tap the row to toggle; navigation via the actions.
 *
 * Scoring comes from a PAGE-LEVEL useUserAnalyticsCourses lookup passed in as
 * `scoring`. The hook resolves auth.uid() server-side, so it is own-profile
 * only - never render another member's row with the viewer's rounds.
 */

export interface DossierCardProps {
  course: RatedCourseData;
  rank: number;
  onCourseClick: (courseId: string) => void;
  onFullReview: (courseId: string, ratingId: string | null) => void;
  /** Own-profile scoring for this course. Absent = render no scoring at all. */
  scoring?: UserAnalyticsCourse | null;
  onExpand?: (course: RatedCourseData, hasScoring: boolean) => void;
}

const formatRowDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDayMonthYearShortGB(d);
};

/** Round FIRST, then branch, so -0.04 never renders "-0.0". */
const fmtSigned = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  if (r > 0) return `+${r.toFixed(1)}`;
  if (r < 0) return `-${Math.abs(r).toFixed(1)}`;
  return '0.0';
};

const DossierCard: React.FC<DossierCardProps> = ({
  course,
  rank,
  onCourseClick,
  onFullReview,
  scoring,
  onExpand,
}) => {
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = useState(false);
  const dateIso = course.review_date ?? course.last_played_at ?? null;
  const dateText = formatRowDate(dateIso);
  const reviewText = (course.review ?? '').trim();
  const hasReview = reviewText.length > 0;

  const rounds = scoring?.rounds_count ?? null;
  const avgToPar = scoring?.avg_to_par ?? null;
  const hasScoring = !!rounds && rounds > 0;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) onExpand?.(course, hasScoring);
  };

  const bars: { label: string; score: number | null }[] = [
    { label: 'DESIGN', score: course.design_score },
    { label: 'CONDITION', score: course.condition_score },
    { label: 'CLUBHOUSE', score: course.clubhouse_score },
    { label: 'FACILITIES', score: course.facilities_score },
  ];

  const where = [course.sub_country, course.country].filter(Boolean)[0] ?? null;

  const metaSegments = [
    dateText || null,
    where,
    hasScoring
      ? t('row.rounds', { count: rounds as number, defaultValue: '{{count}} rounds' })
      : null,
    hasScoring && avgToPar != null
      ? t('row.avg', { avg: fmtSigned(avgToPar), defaultValue: '{{avg}} avg' })
      : null,
  ].filter(Boolean) as string[];

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
        background: A.PANEL,
        cursor: 'pointer',
        fontFamily: SANS,
        padding: '13px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* HEADER (always visible) */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Rank */}
        <span
          style={{
            ...NUM,
            flex: '0 0 22px',
            color: A.INK,
            fontSize: 20,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {rank}
        </span>

        {/* Thumb */}
        <div
          style={{
            position: 'relative',
            flex: '0 0 42px',
            width: 42,
            height: 42,
            borderRadius: 10,
            overflow: 'hidden',
            background: course.thumbnail_image ? `url(${course.thumbnail_image})` : A.TRACK,
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
                color: A.DIM,
              }}
            >
              <Flag size={16} />
            </div>
          )}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              color: A.INK,
              fontWeight: 700,
              fontSize: 14.5,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.name}
          </div>
          {metaSegments.length > 0 && (
            <div style={{ ...LABEL, letterSpacing: '0.10em' }}>
              {metaSegments.join(' \u00B7 ')}
            </div>
          )}
        </div>

        {/* Rating - one figure, published rank beneath */}
        <div style={{ flex: '0 0 46px', textAlign: 'right' }}>
          <div style={{ ...NUM, fontSize: 17, color: A.INK, lineHeight: 1 }}>
            {course.rating_value.toFixed(1)}
          </div>
          {course.is_top100 && course.global_rank != null && (
            <div style={{ ...LABEL, marginTop: 3 }}>{`#${course.global_rank}`}</div>
          )}
        </div>

        <ChevronDown
          size={18}
          color={A.DIM}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sub-scores - shared band scale */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 16,
              rowGap: 10,
            }}
          >
            {bars.map(({ label, score }) =>
              score != null ? <SubScoreBar key={label} label={label} score={score} /> : null,
            )}
          </div>

          {/* Scoring - own profile with rounds only */}
          {hasScoring && (
            <StatRow
              size={18}
              items={[
                {
                  label: t('row.yourRounds', { defaultValue: 'YOUR ROUNDS' }),
                  value: String(rounds),
                },
                ...(avgToPar != null
                  ? [
                      {
                        label: t('row.avgToPar', { defaultValue: 'AVG TO PAR' }),
                        value: fmtSigned(avgToPar),
                        tone:
                          Math.round(avgToPar * 10) / 10 > 0
                            ? A.INK
                            : Math.round(avgToPar * 10) / 10 < 0
                              ? TOPAR_RED
                              : A.MUTE,
                      },
                    ]
                  : []),
              ]}
            />
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Action
              align="left"
              label={t('row.viewCourse', { defaultValue: 'View course' })}
              onClick={() => onCourseClick(course.id)}
            />
            {hasReview && (
              <Action
                align="left"
                label={t('row.fullReview', { defaultValue: 'Full review' })}
                onClick={() => onFullReview(course.id, course.rating_id)}
              />
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default DossierCard;
