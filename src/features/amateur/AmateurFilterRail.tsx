import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BAND_OPTIONS,
  COMPETITION_OPTIONS,
  COURSES_SET_OPTIONS,
  SCOPE_OPTIONS,
  WINDOW_SHORT,
  type BoardFilters,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE ONE FILTER RAIL (BRIEF_AMATEUR_PAGE).
 *
 * APPLIED STATE IS CONTENT, NOT CHROME - the same grammar Scores already uses:
 * individual chips on the canvas, no panel, no border, not sticky. It governs
 * the leaderboard and the courses block and says so by sitting above both.
 */
export function AmateurFilterRail({
  filters,
  onOpen,
}: {
  filters: BoardFilters;
  onOpen: () => void;
}) {
  const { t } = useTranslation('courses');

  const chips = useMemo(() => {
    const out: string[] = [];
    const scope = SCOPE_OPTIONS.find((o) => o.key === filters.scope);
    if (scope) out.push(t(scope.i18n, scope.label));
    out.push(t(WINDOW_SHORT[filters.window].i18n, WINDOW_SHORT[filters.window].label));
    if (filters.courses === 'one') {
      out.push(t('discover.filterBoard.courses.oneCourse', 'One course'));
    } else {
      const courses = COURSES_SET_OPTIONS.find((o) => o.key === filters.courses);
      if (courses) out.push(t(courses.i18n, courses.label));
    }
    if (filters.regionValue) out.push(filters.regionValue);
    if (filters.band !== 'any') {
      const band = BAND_OPTIONS.find((o) => o.key === filters.band);
      if (band) out.push(t(band.i18n, band.label));
    }
    if (filters.competition !== 'any') {
      const comp = COMPETITION_OPTIONS.find((o) => o.key === filters.competition);
      if (comp) out.push(t(comp.i18n, comp.label));
    }
    return out;
  }, [filters, t]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontFamily: SANS }}>
      <div
        className="scrollbar-hide"
        style={{
          display: 'flex',
          gap: 6,
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
        }}
      >
        {chips.map((part, index) => (
          <button
            key={`${part}:${index}`}
            type="button"
            onClick={onOpen}
            style={{
              ...KICKER,
              flexShrink: 0,
              padding: '4px 9px',
              border: 'none',
              borderRadius: 9,
              background: 'rgba(255,255,255,0.06)',
              color: A.MUTE,
              fontFamily: SANS,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {part}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('discover.filterBoard.open', 'Filter the board')}
        style={{
          ...KICKER,
          flexShrink: 0,
          padding: '4px 0 4px 6px',
          border: 'none',
          background: 'transparent',
          color: A.INK,
          fontFamily: SANS,
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        {t('discover.filterBoard.edit', 'Edit')}
      </button>
    </div>
  );
}
