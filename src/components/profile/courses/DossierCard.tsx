import React, { useState } from 'react';
import { Flag, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDayMonthYearShortGB } from '@/i18n/format';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { SubScoreStack } from '@/features/courses/_shared/scoreBands';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A, SANS, LABEL, NUM, Action, StatRow, TOPAR_RED, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';

/**
 * DossierCard - scannable rated-course row.
 * Collapsed: thumb + name + meta lines (+ Top 100 rank chip) + rating.
 * Expanded: single-row sub-score stacks, scoring stat row (own profile only),
 * then the quiet actions. Tap the row to toggle; navigation via the actions.
 *
 * Scoring comes from a PAGE-LEVEL useUserAnalyticsCourses lookup passed in as
 * `scoring`. The hook resolves auth.uid() server-side, so it is own-profile
 * only - never render another member's row with the viewer's rounds.
 */

export interface DossierCardProps {
  course: RatedCourseData;
  /** Archive mock treatment is opt-in; Top 100 sheets retain their row styling. */
  appearance?: 'default' | 'archive';
  /**
   * IGNORED. The sort-index rank was removed: a row's position in a sorted
   * list is not a rank. Kept optional only so the unchanged meta-lines test
   * (which still passes it) type-checks. Do not read it.
   */
  rank?: number;
  /** Played but not yet rated: no figure, no sub-scores, a Review action. */
  unrated?: boolean;
  /** Own profile only: opens the rating flow for an unrated row. */
  onRate?: (courseId: string) => void;
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
  appearance = 'default',
  unrated = false,
  onRate,
  onCourseClick,
  onFullReview,
  scoring,
  onExpand,
}) => {
  const archive = appearance === 'archive';
  const RowChevron = archive ? ChevronRight : ChevronDown;
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
    { label: t('top100.stats.design'), score: course.design_score },
    { label: t('top100.stats.condition'), score: course.condition_score },
    { label: t('top100.stats.clubhouse'), score: course.clubhouse_score },
    { label: t('top100.stats.facilities'), score: course.facilities_score },
  ];

  const where = [course.sub_country, course.country].filter(Boolean)[0] ?? null;

  // Two fixed lines, never a wrap: line 1 is date · country, line 2 is
  // rounds · average. Line 2 renders only when scoring exists (Ben, Sep 2026).
  const line1 = [dateText || null, where].filter(Boolean).join(' \u00B7 ');
  const line2 = hasScoring
    ? [
        t('yourCourses.roundsCount', { count: rounds as number, defaultValue: '{{count}} rounds' }),
        avgToPar != null
          ? t('yourCourses.avgLabel', { avg: fmtSigned(avgToPar), defaultValue: '{{avg}} avg' })
          : null,
      ]
        .filter(Boolean)
        .join(' \u00B7 ')
    : '';

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
        background: archive ? 'transparent' : A.PANEL,
        cursor: 'pointer',
        fontFamily: archive ? 'inherit' : SANS,
        margin: '0 20px',
        padding: archive ? '12px 0' : '9px 0',
        borderBottom: `1px solid ${A.SOFT}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* HEADER (always visible) */}
      <div style={{ display: 'flex', gap: archive ? 12 : 11, alignItems: 'center' }}>
        {/* Thumb */}
        <div
          style={{
            position: 'relative',
            flex: archive ? '0 0 52px' : '0 0 44px',
            width: archive ? 52 : 44,
            height: archive ? 52 : 44,
            borderRadius: archive ? 10 : 8,
            overflow: 'hidden',
            background: course.thumbnail_image ? `url(${course.thumbnail_image})` : A.TRACK,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!archive && !course.thumbnail_image && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.DIM }}><Flag size={16} /></div>}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: archive ? 2 : 4 }}>
          <div
            style={{
              color: A.INK,
              fontWeight: 700,
              fontSize: archive ? 16 : 13,
              lineHeight: 1.15,
              letterSpacing: 0,
              overflowWrap: archive ? 'anywhere' : undefined,
              whiteSpace: archive ? undefined : 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {course.name}
          </div>
          {line1.length > 0 && (
            <div style={{ ...LABEL, fontSize: archive ? 12 : LABEL.fontSize, fontWeight: archive ? 400 : LABEL.fontWeight, letterSpacing: archive ? 0 : '0.10em', lineHeight: archive ? 1.3 : undefined }}>
              {/* Segments stay unbreakable; the ONLY wrap point is the separator,
                  so a long country drops intact beneath the date (measured: the
                  identity column is ~176px at 390pt; "3 SEPT 2026 · NORTHERN
                  IRELAND" is ~225px). Line 2 never wraps. */}
              <span style={{ whiteSpace: 'nowrap' }}>{dateText}</span>
              {dateText && where ? ' \u00B7 ' : ''}
              <span style={{ whiteSpace: 'nowrap' }}>{where}</span>
            </div>
          )}
          {line2.length > 0 && (
            <div style={archive ? { fontSize: 12, color: A.DIM, lineHeight: 1.3 } : { ...LABEL, letterSpacing: '0.10em', whiteSpace: 'nowrap' }}>{line2}</div>
          )}
          {course.is_top100 && course.global_rank != null && (
            <div>
              <span
                data-testid="rank-chip"
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: archive ? 11 : 9.5,
                  fontWeight: 700,
                  letterSpacing: 0,
                  color: MEDAL_GOLD,
                  border: `1px solid color-mix(in srgb, ${MEDAL_GOLD} 45%, transparent)`,
                  borderRadius: 7,
                  padding: archive ? '1px 6px' : '2px 6px',
                }}
              >
                {`#${course.global_rank} World`}
              </span>
            </div>
          )}
        </div>

        {/* Rating - one figure, published rank beneath */}
        <div style={{ flex: '0 0 46px', textAlign: 'right' }}>
          {unrated ? (
            <div style={{ ...LABEL, color: A.DIM, lineHeight: 1.45 }}>
              {t('row.notRated', { defaultValue: 'Not rated' })}
            </div>
          ) : (
            <div style={{ ...NUM, fontFamily: archive ? 'inherit' : SANS, letterSpacing: archive ? 0 : NUM.letterSpacing, fontSize: archive ? 20 : 17, color: archive ? courseSubScoreTone(course.rating_value) : A.INK, lineHeight: 1 }}>
              {course.rating_value.toFixed(1)}
            </div>
          )}
        </div>

        <RowChevron
          size={archive ? 14 : 18}
          color={A.DIM}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            transform: archive ? (expanded ? 'rotate(90deg)' : 'none') : (expanded ? 'rotate(180deg)' : 'none'),
            transition: 'transform 0.2s',
          }}
        />
      </div>

      {/* EXPANDED */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sub-scores - shared band scale, single row like Courses page */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!unrated && bars.map(({ label, score }) =>
              score != null ? <SubScoreStack key={label} label={label} score={score} /> : null,
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
            {unrated && onRate && (
              <Action
                align="left"
                label={t('row.review', { defaultValue: 'Review' })}
                onClick={() => onRate(course.id)}
              />
            )}
            {!unrated && hasReview && (
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
