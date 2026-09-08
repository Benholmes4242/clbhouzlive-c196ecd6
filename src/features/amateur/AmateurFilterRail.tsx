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
import { RailChips } from '@/components/ui/RailChips';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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
      {/* §7 — THE SHARED CHIP, not a local look-alike. Every chip states an
          APPLIED value, so none is "selected": value is empty and the whole rail
          opens the panel. Treatment, geometry and both states come from
          RailChips and are not restated here. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <RailChips
          options={chips.map((part, index) => ({ id: `${index}:${part}`, label: part }))}
          value=""
          onChange={onOpen}
          ariaLabel={t('discover.filterBoard.open', 'Filter the board')}
        />
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('discover.filterBoard.open', 'Filter the board')}
        /* The footer see-all treatment: 12/700/0.11em uppercase MUTE. */
        style={{
          flexShrink: 0,
          padding: '4px 0 4px 8px',
          border: 'none',
          background: 'transparent',
          color: A.MUTE,
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {t('discover.filterBoard.edit', 'Edit')}
      </button>
    </div>
  );
}
