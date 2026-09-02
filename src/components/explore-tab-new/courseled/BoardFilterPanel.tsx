import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { Z } from '@/config/zIndex';
import { A, SANS } from './tokens';
import { useAvailableWeekScopes } from './hooks/useGolfThisWeek';
import type { BoardFacets } from './hooks/useBoardFacets';
import {
  BAND_OPTIONS,
  BOARD_KEYS,
  BOARD_LABELS,
  COURSES_SET_OPTIONS,
  DEFAULT_FILTERS,
  FEAT_OPTIONS,
  SCOPE_OPTIONS,
  WINDOW_OPTIONS,
  boardCountsRounds,
  type BandKey,
  type BoardFilters,
  type BoardKey,
  type CoursesKey,
  type FeatKey,
  type WindowKey,
} from './boardFilters';

/**
 * THE FILTER PANEL (BRIEF_DISCOVER_FILTER_LED_BOARD S3).
 *
 * A FULL-SCREEN PANEL, NOT A BOTTOM SHEET: it holds five drilldowns and a
 * course list that can run to hundreds of rows, and a sheet that tall is a
 * sheet pretending to be a page.
 *
 * S3.1 — THE FOOTER BUTTON IS A.INK FILL WITH A.CANVAS LABEL, the app's
 * primary-action treatment. IT IS NOT AMBER. On this surface AMBER MEANS "YOU"
 * and it is spent on the member's own row and the active filter label only.
 *
 * S2.4 — TWO KINDS OF ABSENCE, and the whole panel hangs off the difference:
 *   FIXED LISTS  (scope, window, band, feat, the three courses set-options)
 *     come from the hardcoded lists imported above. A missing facet row means
 *     ZERO: the row RENDERS, greyed and unselectable.
 *   OPEN LISTS   (course, region_country, region_sub)
 *     are enumerated FROM the facet result. A missing option does not render at
 *     all. 23,295 courses exist; 254 have ever carried a round.
 *
 * S2.6 — UNRESOLVED IS NOT ABSENT. `facets.countFor` returns null until the
 * first answer of the session; a null renders NO COUNT and greys nothing. A row
 * greys because the answer is zero, never because we have not asked yet.
 *
 * S3.4 — A ROW IS PRESENT IF IT APPLIES TO YOU, GREY IF IT HOLDS NOTHING. Those
 * are different statements: a member with no index gets NO "Near yours" row, and
 * a club under HOME_CLUB_MIN_MEMBERS gets NO "Your club" row.
 */

type Screen = 'root' | 'board' | 'window' | 'where' | 'courses' | 'band' | 'feat';

/** S3.5 — a search field appears only past this many individual course rows. */
const COURSE_SEARCH_THRESHOLD = 60;

const HEADER_PAD_TOP = 'max(env(safe-area-inset-top, 0px), 47px)';

const rowBase: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${A.BORDER}`,
  textAlign: 'left',
  fontFamily: SANS,
  minHeight: 52,
};

function Count({ n }: { n: number | null }) {
  /* NEVER A ZERO ON AN UNSETTLED ROW (S2.6): null renders nothing at all. */
  if (n == null) return null;
  return (
    <span
      className="tabular-nums"
      style={{ fontSize: 12, fontWeight: 700, color: A.MUTE, flexShrink: 0 }}
    >
      {n}
    </span>
  );
}

function PanelRow({
  label,
  count,
  value,
  active,
  disabled,
  chevron,
  onClick,
}: {
  label: string;
  count?: number | null;
  /** The drilldown's current selection, shown at the right (S3.3). */
  value?: string;
  active?: boolean;
  disabled?: boolean;
  chevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...rowBase,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: active ? 700 : 600,
          /* THE ACTIVE FILTER LABEL IS THE OTHER AMBER ON THIS SURFACE. */
          color: active ? A.AMBER : A.INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {value ? (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: A.MUTE,
            flexShrink: 0,
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      ) : null}
      <Count n={count ?? null} />
      {chevron ? <ChevronRight size={15} strokeWidth={2.4} color={A.DIM} aria-hidden /> : null}
    </button>
  );
}

export interface BoardFilterPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  board: BoardKey;
  onBoardChange: (next: BoardKey) => void;
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
  facets: BoardFacets;
}

export function BoardFilterPanel({
  open,
  onClose,
  userId,
  board,
  onBoardChange,
  filters,
  onChange,
  facets,
}: BoardFilterPanelProps) {
  const { t } = useTranslation('courses');
  const [screen, setScreen] = useState<Screen>('root');
  const [courseSearch, setCourseSearch] = useState('');

  /* S3.4 — the SAME conditional logic the retired scope pills used, now deciding
     whether a ROW EXISTS rather than whether a pill exists. */
  const { scopes } = useAvailableWeekScopes(userId);
  const clubApplies = scopes.includes('home_club');
  const nearApplies = scopes.includes('handicap_band');

  useEffect(() => {
    if (open) setScreen('root');
  }, [open]);

  if (!open) return null;

  const set = (patch: Partial<BoardFilters>) => onChange({ ...filters, ...patch });

  const label = <K extends string>(o: { i18n: string; label: string }) => t(o.i18n, o.label);

  const windowLabel = label(
    WINDOW_OPTIONS.find((o) => o.key === filters.window) ?? WINDOW_OPTIONS[0],
  );
  const whereLabel = filters.regionValue
    ? filters.regionValue
    : t('discover.filterBoard.where.everywhere', 'Everywhere');
  const coursesLabel = (() => {
    if (filters.courses === 'one') {
      const one = facets.openList('course').find((c) => c.key === filters.courseId);
      return one?.label ?? t('discover.filterBoard.courses.oneCourse', 'One course');
    }
    const o = COURSES_SET_OPTIONS.find((x) => x.key === filters.courses);
    return o ? label(o) : label(COURSES_SET_OPTIONS[0]);
  })();
  const bandLabel = label(BAND_OPTIONS.find((o) => o.key === filters.band) ?? BAND_OPTIONS[0]);
  const featLabel = label(FEAT_OPTIONS.find((o) => o.key === filters.feat) ?? FEAT_OPTIONS[0]);

  /* THE FOOTER'S FIGURE IS THE ACTIVE BOARD'S OWN COUNT under these filters,
     which is the number the board will render (S3.2). */
  const footN = facets.countFor('board', board);
  const footDisabled = footN === 0;
  const footLabel = footDisabled
    ? t('discover.filterBoard.noMatch', 'No rounds match')
    : boardCountsRounds(board)
      ? t('discover.filterBoard.showRounds', 'Show {{count}} rounds', { count: footN ?? 0 })
      : t('discover.filterBoard.showMembers', 'Show {{count}} members', { count: footN ?? 0 });

  /* S3.6 — SELECTING A FEAT WIDENS When TO ALL TIME when the current window
     holds none of it, and the applied line says so. Production holds 5 aces and
     1 albatross all time and none this year: without this rule, tapping "Hole in
     one" on the default fortnight lands on an empty board. */
  const pickFeat = (key: FeatKey) => {
    const n = facets.countFor('feat', key);
    if (key !== 'any' && n === 0 && filters.window !== 'all') {
      set({ feat: key, window: 'all' });
    } else {
      set({ feat: key });
    }
    setScreen('root');
  };

  const courseRows = facets.openList('course');
  const needle = courseSearch.trim().toLowerCase();
  const shownCourses =
    courseRows.length > COURSE_SEARCH_THRESHOLD && needle.length >= 2
      ? courseRows.filter((c) => (c.label ?? '').toLowerCase().includes(needle))
      : courseRows;

  const headerTitle = () => {
    switch (screen) {
      case 'board':
        return t('discover.filterBoard.pickBoard', 'Which board');
      case 'window':
        return t('discover.filterBoard.axis.when', 'When');
      case 'where':
        return t('discover.filterBoard.axis.where', 'Where');
      case 'courses':
        return t('discover.filterBoard.axis.courses', 'Courses');
      case 'band':
        return t('discover.filterBoard.axis.handicap', 'Handicap');
      case 'feat':
        return t('discover.filterBoard.axis.feats', 'Feats');
      default:
        return t('discover.filterBoard.title', 'Filters');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sheet,
        background: A.CANVAS,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          paddingTop: HEADER_PAD_TOP,
          borderBottom: `1px solid ${A.BORDER}`,
          background: A.PANEL,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px 12px',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: A.INK,
            }}
          >
            {headerTitle()}
          </span>
          <button
            type="button"
            onClick={() => (screen === 'root' ? onClose() : setScreen('root'))}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 700,
              color: A.AMBER,
              cursor: 'pointer',
            }}
          >
            {screen === 'root'
              ? t('discover.filterBoard.done', 'Done')
              : t('discover.filterBoard.back', 'Back')}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {screen === 'root' && (
          <>
            <SectionLabel>{t('discover.filterBoard.eyebrow', 'The board')}</SectionLabel>
            <PanelRow
              label={t('discover.filterBoard.rankedBy', 'Ranked by')}
              value={t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label)}
              chevron
              onClick={() => setScreen('board')}
            />

            <SectionLabel>{t('discover.filterBoard.who', 'Who')}</SectionLabel>
            {SCOPE_OPTIONS.filter((o) => (o.key === 'club' ? clubApplies : true)).map((o) => (
              <PanelRow
                key={o.key}
                label={label(o)}
                count={facets.countFor('scope', o.key)}
                active={filters.scope === o.key}
                disabled={facets.countFor('scope', o.key) === 0}
                onClick={() => set({ scope: o.key })}
              />
            ))}

            <SectionLabel>{t('discover.filterBoard.narrow', 'Narrow it')}</SectionLabel>
            <PanelRow
              label={t('discover.filterBoard.axis.when', 'When')}
              value={windowLabel}
              chevron
              onClick={() => setScreen('window')}
            />
            <PanelRow
              label={t('discover.filterBoard.axis.where', 'Where')}
              value={whereLabel}
              chevron
              onClick={() => setScreen('where')}
            />
            <PanelRow
              label={t('discover.filterBoard.axis.courses', 'Courses')}
              value={coursesLabel}
              chevron
              onClick={() => setScreen('courses')}
            />
            <PanelRow
              label={t('discover.filterBoard.axis.handicap', 'Handicap')}
              value={bandLabel}
              chevron
              onClick={() => setScreen('band')}
            />
            <PanelRow
              label={t('discover.filterBoard.axis.feats', 'Feats')}
              value={featLabel}
              chevron
              onClick={() => setScreen('feat')}
            />

            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_FILTERS })}
              style={{
                ...rowBase,
                borderBottom: 'none',
                justifyContent: 'center',
                fontSize: 12.5,
                fontWeight: 700,
                color: A.MUTE,
                cursor: 'pointer',
              }}
            >
              {t('discover.filterBoard.reset', 'Reset all filters')}
            </button>
          </>
        )}

        {screen === 'board' &&
          BOARD_KEYS.map((key) => {
            const count = facets.countFor('board', key);
            return (
              <PanelRow
                key={key}
                label={t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label)}
                count={count}
                active={board === key}
                disabled={count === 0}
                onClick={() => {
                  onBoardChange(key);
                  setScreen('root');
                }}
              />
            );
          })}

        {screen === 'window' &&
          WINDOW_OPTIONS.map((o) => (
            <PanelRow
              key={o.key}
              label={label(o)}
              count={facets.countFor('window', o.key)}
              active={filters.window === o.key}
              disabled={facets.countFor('window', o.key) === 0}
              onClick={() => {
                set({ window: o.key as WindowKey });
                setScreen('root');
              }}
            />
          ))}

        {screen === 'where' && (
          <>
            <PanelRow
              label={t('discover.filterBoard.where.everywhere', 'Everywhere')}
              active={filters.regionKind == null}
              onClick={() => {
                set({ regionKind: null, regionValue: null });
                setScreen('root');
              }}
            />
            {/* OPEN LISTS. Nations carry their parent country in the facet
                LABEL column (S2.5) and are grouped by it rather than re-derived. */}
            {facets.openList('region_country').map((c) => (
              <div key={c.key}>
                <PanelRow
                  label={c.key}
                  count={c.n}
                  active={filters.regionKind === 'country' && filters.regionValue === c.key}
                  onClick={() => {
                    set({ regionKind: 'country', regionValue: c.key });
                    setScreen('root');
                  }}
                />
                {facets
                  .openList('region_sub')
                  .filter((s) => s.label === c.key)
                  .map((s) => (
                    <div key={s.key} style={{ paddingLeft: 18 }}>
                      <PanelRow
                        label={s.key}
                        count={s.n}
                        active={
                          filters.regionKind === 'sub_country' && filters.regionValue === s.key
                        }
                        onClick={() => {
                          set({ regionKind: 'sub_country', regionValue: s.key });
                          setScreen('root');
                        }}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}

        {screen === 'courses' && (
          <>
            {COURSES_SET_OPTIONS.map((o) => (
              <PanelRow
                key={o.key}
                label={label(o)}
                count={facets.countFor('courses', o.key)}
                active={filters.courses === o.key}
                disabled={facets.countFor('courses', o.key) === 0}
                onClick={() => {
                  set({ courses: o.key as CoursesKey, courseId: null });
                  setScreen('root');
                }}
              />
            ))}
            {courseRows.length > COURSE_SEARCH_THRESHOLD && (
              <div style={{ padding: '12px 16px' }}>
                <input
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder={t('discover.filterBoard.courseSearch', 'Search courses')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: A.PANEL,
                    border: `1px solid ${A.BORDER}`,
                    borderRadius: 8,
                    color: A.INK,
                    fontFamily: SANS,
                    fontSize: 13.5,
                  }}
                />
              </div>
            )}
            {shownCourses.map((c) => (
              <PanelRow
                key={c.key}
                label={c.label ?? c.key}
                count={c.n}
                active={filters.courses === 'one' && filters.courseId === c.key}
                onClick={() => {
                  set({ courses: 'one', courseId: c.key });
                  setScreen('root');
                }}
              />
            ))}
          </>
        )}

        {screen === 'band' &&
          BAND_OPTIONS.filter((o) => (o.key === 'near' ? nearApplies : true)).map((o) => (
            <PanelRow
              key={o.key}
              label={label(o)}
              count={facets.countFor('band', o.key)}
              active={filters.band === o.key}
              disabled={facets.countFor('band', o.key) === 0}
              onClick={() => {
                set({ band: o.key as BandKey });
                setScreen('root');
              }}
            />
          ))}

        {screen === 'feat' &&
          FEAT_OPTIONS.map((o) => (
            <PanelRow
              key={o.key}
              label={label(o)}
              count={facets.countFor('feat', o.key)}
              active={filters.feat === o.key}
              /* NOT DISABLED AT ZERO: a feat with none in this window is still
                 selectable, because picking it WIDENS the window (S3.6). Only a
                 feat with none AT ALL TIME can be greyed, which the RPC's
                 all-time facet answers on the next call. */
              onClick={() => pickFeat(o.key as FeatKey)}
            />
          ))}
      </div>

      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${A.BORDER}`,
          background: A.PANEL,
          padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        <button
          type="button"
          disabled={footDisabled}
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: 48,
            borderRadius: 8,
            border: 'none',
            /* S3.1 — INK FILL, CANVAS LABEL. Never amber. */
            background: footDisabled ? A.TRACK : A.INK,
            color: footDisabled ? A.DIM : A.CANVAS,
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            cursor: footDisabled ? 'default' : 'pointer',
          }}
        >
          {footLabel}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '18px 16px 8px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      {children}
    </div>
  );
}

export default BoardFilterPanel;
