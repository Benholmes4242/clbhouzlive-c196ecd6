import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import { r } from '@/lib/radius';

import { DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from './tokens';
import { CourseAnalyticsCard } from './CoursesPlayedSection';
import { CourseCardPanel } from '@/features/courses/components/holes/analytical/CourseCardPanel';
import { ListTerminalRow } from './ListTerminalRow';
import { CourseImageFallback } from './CourseImageFallback';
import { useSearchedCourse } from './hooks/useSearchedCourse';
import type { BoardCourseRow } from './hooks/useBoardCourses';
import type { BoardFilters } from './boardFilters';

/**
 * HOW THEY PLAYED, WITH A CATALOGUE SEARCH (BRIEF_SCORES_REFINEMENTS S2/S3).
 *
 * DEFAULT IS UNCHANGED (S2.1): the section shows the course at the top of the
 * selected course board, and the analytics card itself is untouched in every
 * respect — the monotone curve, the par datum, the signed By par scale and both
 * gates all still live inside CourseHolePanel.
 *
 * THE SEARCH IS THE EXISTING ONE (S2.6). useCourseSearch is the full-catalogue
 * ILIKE read the directory and the Legends drilldown already use; nothing new is
 * built here and no second search exists.
 *
 * THE EMPTY STATE IS THE COMMON CASE (S3). Most of the catalogue has never been
 * played by anyone in the circuit, so a searched course has THREE distinct
 * outcomes and they are never collapsed into one message:
 *
 *   NO ROUNDS AT ALL          — stated here, with the photograph and the name.
 *   BELOW THE HOLE-DETAIL GATE — the existing gate wording, from CourseHolePanel,
 *                                unchanged, with the photograph, the round count
 *                                and the low round when there is one.
 *   ONLY THE VIEWER'S ROUNDS  — the field-of-one guard inside the panel fires as
 *                                specified; nothing here interferes.
 *
 * The searched course is COMPONENT STATE and resets on entry (S2.5).
 */

const FIELD_H = 44;

export interface HowTheyPlayedSectionProps {
  /** The top row of the selected course board — the default subject (S2.1). */
  boardRow: BoardCourseRow | null;
  userId: string | undefined;
  filters: BoardFilters;
  onCoursePress?: (courseId: string) => void;
}

export function HowTheyPlayedSection({
  boardRow,
  userId,
  filters,
  onCoursePress,
}: HowTheyPlayedSectionProps) {
  const { t } = useTranslation('courses');

  const [query, setQuery] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const results = useCourseSearch(query);
  const picked = useSearchedCourse(userId, pickedId, filters);

  const searching = query.trim().length >= 2 && pickedId == null;

  /* The subject: the searched course when there is one, else the board's top. */
  const searchedRow = picked.data?.row ?? null;
  const filteredSearchedRow = picked.data?.filteredRow ?? null;
  const subjectRow = pickedId
    ? searchedRow && { ...searchedRow, low_gross: filteredSearchedRow?.low_gross ?? null, low_to_par: filteredSearchedRow?.low_to_par ?? null, low_by: filteredSearchedRow?.low_by ?? null }
    : boardRow;
  const subjectName = pickedId ? picked.data?.name ?? null : boardRow?.name ?? null;
  const subjectThumb = pickedId
    ? picked.data?.thumbnail ?? null
    : boardRow?.thumbnail_image ?? null;
  const subjectId = pickedId ?? boardRow?.course_id ?? null;

  const clear = () => {
    setPickedId(null);
    setQuery('');
  };

  if (!subjectId) return null;

  return (
    <div style={{ marginTop: 14, fontFamily: SANS, ...FIGS }}>
      {/* S2.2 — the field, full width, above the card. */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: FIELD_H,
            padding: '0 12px',
            boxSizing: 'border-box',
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: r.sm,
          }}
        >
          <Search size={15} color={A.MUTE} strokeWidth={2.2} aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (pickedId) setPickedId(null);
            }}
            placeholder={t('discover.scores.searchAnyCourse', 'Search any course')}
            aria-label={t('discover.scores.searchAnyCourse', 'Search any course')}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: A.INK,
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
            }}
          />
          {(pickedId || query.length > 0) && (
            /* S2.5 — the clear action returns to the board's top course. */
            <button
              type="button"
              onClick={clear}
              aria-label={t('discover.scores.clearCourse', 'Back to the board')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <X size={15} color={A.MUTE} strokeWidth={2.2} aria-hidden />
            </button>
          )}
        </div>

        {searching && (
          <div
            style={{
              marginTop: 6,
              background: A.PANEL,
              border: `1px solid ${A.BORDER}`,
              borderRadius: r.sm,
              overflow: 'hidden',
            }}
          >
            {results.isFetching && (results.data ?? []).length === 0 ? (
              <div style={{ ...KICKER, padding: '12px 12px', color: A.MUTE }}>
                {t('discover.scores.searching', 'Searching')}
              </div>
            ) : (results.data ?? []).length === 0 ? (
              <div style={{ ...KICKER, padding: '12px 12px', color: A.MUTE }}>
                {t('discover.scores.noCourseMatch', 'No course by that name.')}
              </div>
            ) : (
              (results.data ?? []).slice(0, 12).map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setPickedId(c.id);
                    setQuery(c.name);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderTop: i === 0 ? 'none' : `1px solid ${A.BORDER}`,
                    background: 'transparent',
                    color: A.INK,
                    fontFamily: SANS,
                    fontSize: 13.5,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                  {(c.region ?? c.country) && (
                    <span style={{ ...KICKER, display: 'block', marginTop: 2, color: A.MUTE }}>
                      {c.region ?? c.country}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {pickedId && picked.isPending ? (
        <div aria-hidden style={{ minHeight: 300 }} />
      ) : subjectRow ? (
        /* ROUNDS EXIST. The card is unchanged; the gate and the field-of-one
           guard inside it decide what the member sees. The photograph rides with
           it so a searched course always confirms itself (S3.3). */
        <CourseAnalyticsCard
          row={subjectRow}
          userId={userId}
          filters={filters}
          onCoursePress={onCoursePress}
          courseName={subjectName}
          media={
            pickedId ? (
              <CoursePhoto
                courseId={subjectId}
                name={subjectName}
                thumbnail={subjectThumb}
                area={picked.data?.area ?? null}
              />
            ) : undefined
          }
        />
      ) : (
        /* NO ROUNDS AT ALL. Said plainly, in the present tense (S3.4). */
        <div data-course-analytics-card style={{ background: A.PANEL, borderRadius: r.md, overflow: 'hidden' }}>
          <CoursePhoto
            courseId={subjectId}
            name={subjectName}
            thumbnail={subjectThumb}
            area={picked.data?.area ?? null}
          />
          <div style={{ padding: '12px 12px 14px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: A.INK }}>
              {subjectName ?? '\u2014'}
            </h3>
            <CourseCardPanel courseId={subjectId} courseName={subjectName ?? undefined} embedded />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: A.INK }}>
              {t('discover.scores.noOnePlayed', 'No one has played {{course}} yet.', {
                course: subjectName ?? '\u2014',
              })}
            </p>
            <p style={{ ...KICKER, margin: '6px 0 0', color: A.MUTE }}>
              {t('discover.scores.beTheFirst', 'Play it and you will be the first.')}
            </p>
            <ListTerminalRow
              label={t('discover.coursesPlayed.seeFullAnalytics', 'See full course analytics')}
              onPress={() => onCoursePress?.(subjectId)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** S3.3 — the photograph and the name, in every state. */
function CoursePhoto({
  courseId,
  name,
  thumbnail,
  area,
}: {
  courseId: string;
  name: string | null;
  thumbnail: string | null;
  area: string | null;
}) {
  return (
    <CourseImageFallback
      courseId={courseId}
      courseName={name}
      imageUrl={thumbnail}
      initialsSize={28}
      style={{ display: 'block', width: '100%', height: 132, borderRadius: 0 }}
    >
      <span aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
      <span
        style={{
          position: 'absolute',
          inset: 'auto 11px 9px',
          zIndex: 1,
          minWidth: 0,
          color: DISCOVER_FACT,
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.2,
            textShadow: '0 1px 2px rgba(0,0,0,0.72)',
          }}
        >
          {name ?? '\u2014'}
        </span>
        {area && (
          <span
            style={{
              ...KICKER,
              display: 'block',
              marginTop: 3,
              color: DISCOVER_QUIET,
              textShadow: '0 1px 2px rgba(0,0,0,0.72)',
            }}
          >
            {area}
          </span>
        )}
      </span>
    </CourseImageFallback>
  );
}

export default HowTheyPlayedSection;
