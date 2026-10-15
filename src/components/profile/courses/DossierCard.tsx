import React, { useState } from 'react';
import { Flag, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDayMonthYearShortGB } from '@/i18n/format';
import { type RatedCourseData } from './my-ratings/myRatingsTiers';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { formatListRank, type ListRank } from '@/lib/courses/listRank';
import { A, SANS, LABEL, NUM, StatRow, TOPAR_RED, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
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
  /** Every Top 100 placement, folded into the first meta line via formatListRank. */
  listRank?: ListRank | null;
  /** Own profile only: opens the existing review editor. Absent = no Edit review. */
  onEditReview?: (courseId: string) => void;
  /** First row in its group draws no top divider. */
  isFirst?: boolean;
}

/** One expanded-row action: no chevron, wraps rather than clips. */
const RowAction: React.FC<{ label: string; tone: string; onClick: () => void }> = ({ label, tone, onClick }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{
      minHeight: 32, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: 0,
      fontFamily: 'inherit', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
      lineHeight: 1.3, whiteSpace: 'normal', color: tone,
    }}
  >
    {label}
  </button>
);

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
  listRank = null,
  onEditReview,
  isFirst = false,
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

  const where = [course.sub_country, course.country].filter(Boolean)[0] ?? null;
  const rankText = formatListRank(listRank);

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
        padding: archive ? '8px 0' : '9px 0',
        borderTop: archive ? (isFirst ? 'none' : `1px solid ${A.SOFT}`) : undefined,
        borderBottom: archive ? undefined : `1px solid ${A.SOFT}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* HEADER (always visible) */}
      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
        {/* Thumb */}
        <div
          style={{
            position: 'relative',
            flex: '0 0 44px',
            flexShrink: 0,
            width: 44,
            height: archive ? 34 : 44,
            borderRadius: 8,
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
              fontSize: archive ? 12.5 : 13,
              lineHeight: 1.15,
              letterSpacing: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {course.name}
          </div>
          {archive ? (
            (line1.length > 0 || rankText) && (
              <div data-testid="meta-line-1" style={{ fontSize: 10.5, fontWeight: 600, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {[line1 || null, rankText].filter(Boolean).join(' \u00B7 ')}
              </div>
            )
          ) : line1.length > 0 && (
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
            <div style={archive ? { fontSize: 10.5, fontWeight: 600, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } : { ...LABEL, letterSpacing: '0.10em', whiteSpace: 'nowrap' }}>{line2}</div>
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
          {!unrated && (
            <CategoryScores
              marginTop={archive ? 14 : 0}
              scores={{ design: course.design_score, condition: course.condition_score, clubhouse: course.clubhouse_score, facilities: course.facilities_score }}
            />
          )}

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

          {/* Actions — equal columns echoing the four-column scores above. */}
          {(() => {
            const actions: { key: string; label: string; tone: string; onClick: () => void }[] = [
              { key: 'view', label: t('row.viewCourse', { defaultValue: 'View course' }), tone: A.INK, onClick: () => onCourseClick(course.id) },
            ];
            if (unrated && onRate) actions.push({ key: 'rate', label: t('row.review', { defaultValue: 'Review' }), tone: A.INK, onClick: () => onRate(course.id) });
            if (!unrated && hasReview) actions.push({ key: 'full', label: t('row.fullReview', { defaultValue: 'Full review' }), tone: A.INK, onClick: () => onFullReview(course.id, course.rating_id) });
            if (!unrated && hasReview && onEditReview) actions.push({ key: 'edit', label: t('row.editReview', { defaultValue: 'Edit review' }), tone: A.AMBER, onClick: () => onEditReview(course.id) });
            return (
              <div data-testid="row-actions" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(actions.length, 2)}, minmax(0, 1fr))`, gap: 12, marginTop: archive ? 14 : 0 }}>
                {actions.map((x) => <RowAction key={x.key} label={x.label} tone={x.tone} onClick={x.onClick} />)}
              </div>
            );
          })()}
        </div>
      )}
    </article>
  );
};

export default DossierCard;
