import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { Z } from '@/config/zIndex';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from './tokens';
import { useAvailableWeekScopes } from './hooks/useGolfThisWeek';
import type { BoardFacets } from './hooks/useBoardFacets';
import {
  BAND_OPTIONS,
  BOARD_LABELS,
  COMPETITION_OPTIONS,
  COURSES_SET_OPTIONS,
  DEFAULT_FILTERS,
  FEAT_BOARD_KEYS,
  RANKING_BOARD_KEYS,
  SCOPE_OPTIONS,
  WINDOW_OPTIONS,
  boardCountsRounds,
  filtersAreDefault,
  type BandKey,
  type BoardFilters,
  type BoardKey,
  type CompetitionKey,
  type CoursesKey,
  type WindowKey,
} from './boardFilters';


/**
 * THE FILTER PANEL (BRIEF_DISCOVER_FILTER_SHEET_WHEN_FIRST).
 *
 * A FULL-SCREEN PANEL, NOT A BOTTOM SHEET: it still holds two open lists, and a
 * sheet tall enough for 254 courses is a sheet pretending to be a page.
 *
 * THE ROOT IS CHIPS, AND WHEN LEADS. The window is the only axis whose change
 * moves EVERY other count on the screen, so it is chosen first: each count is
 * then read once, already in the right scale.
 *
 * THE SHOWING HEADER IS THE WHOLE ANSWER TO "SELECTING GIVES NO FEEDBACK"
 * (S1.3). The WHO counts deliberately DO NOT move when WHO changes, because
 * get_board_facets counts each axis with its OWN predicate excluded — a count
 * states what you WOULD get. The acknowledgement is the figure at the top, which
 * is the SAME `resultCount` the footer button carries, so the two cannot
 * disagree. NOTHING here apologises for the faceting and no helper text explains
 * it: the counts do the teaching.
 *
 * TWO KINDS OF ABSENCE, and the whole panel still hangs off the difference:
 *   FIXED LISTS  (window, scope, board, band, competition, the courses set-
 *     options) come from the hardcoded lists imported above. A missing facet row
 *     means ZERO: the chip RENDERS, greyed and unselectable.
 *   OPEN LISTS   (course, region_country, region_sub)
 *     are enumerated FROM the facet result. A missing option does not render at
 *     all. 23,295 courses exist; 254 have ever carried a round.
 *
 * UNRESOLVED IS NOT ABSENT (S3.6). `facets.countFor` returns null until the
 * first answer of the session; a null renders NO COUNT and greys nothing.
 *
 * A CHIP IS PRESENT IF IT APPLIES TO YOU, GREY IF IT HOLDS NOTHING (S2.4).
 * Those are different statements: a member with no index gets NO "Near yours"
 * chip, and a club under HOME_CLUB_MIN_MEMBERS gets NO "Your club" chip.
 *
 * NO AMBER ANYWHERE (S3.7). Amber means "you" — the member's own row on the
 * board and nothing else. A selected chip is A.INK.
 */

type Screen = 'root' | 'where' | 'courses';

/** S3.5 — a search field appears only past this many individual course rows. */
const COURSE_SEARCH_THRESHOLD = 60;

const HEADER_PAD_TOP = 'max(env(safe-area-inset-top, 0px), 47px)';

const rowBase: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${A.BORDER}`,
  textAlign: 'left',
  fontFamily: SANS,
  minHeight: 52,
};

function Count({ n }: { n: number | null }) {
  /* NEVER A ZERO ON AN UNSETTLED ROW: null renders nothing at all. */
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
  valueChanged,
  active,
  disabled,
  chevron,
  onClick,
}: {
  label: string;
  count?: number | null;
  /** The drilldown's current selection, shown at the right. */
  value?: string;
  /** Root drilldown values recede until changed from their default. */
  valueChanged?: boolean;
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
          color: A.INK,
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
            color: valueChanged ? A.INK : A.DIM,
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

/**
 * THE CHIP AND ITS FIVE STATES (S3).
 *
 * S3.2 vs S3.3 is the settled "defaults recede, changed values come forward"
 * rule expressed as a chip: SELECTED-AND-DEFAULT keeps the panel fill and takes
 * an ink OUTLINE; SELECTED-AND-CHANGED takes the ink FILL. Do not collapse them:
 * together they are how the member sees which axes they have actually moved.
 */
function Chip({
  label,
  count,
  selected,
  isDefault,
  onClick,
}: {
  label: string;
  count: number | null;
  selected: boolean;
  /** True when this option IS the axis default. */
  isDefault: boolean;
  onClick: () => void;
}) {
  /* S3.5 — a REAL zero on a fixed list greys and disables. S3.6 — a null is
     UNRESOLVED and greys nothing. */
  const disabled = count === 0 && !selected;
  const filled = selected && !isDefault;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 11px',
        borderRadius: 8,
        border: `1px solid ${selected ? A.INK : A.BORDER}`,
        background: filled ? A.INK : A.PANEL,
        fontFamily: SANS,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: filled ? A.CANVAS : A.INK,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {count == null ? null : (
        <span
          className="tabular-nums"
          style={{ fontSize: 11, fontWeight: 700, color: filled ? A.CANVAS : A.MUTE }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px' }}>{children}</div>
  );
}

export interface BoardFilterPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  board: BoardKey;
  onBoardChange: (next: BoardKey) => void;
  resultCount: number;
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
  resultCount,
  filters,
  onChange,
  facets,
}: BoardFilterPanelProps) {
  const { t } = useTranslation('courses');
  const [screen, setScreen] = useState<Screen>('root');
  const [courseSearch, setCourseSearch] = useState('');

  /* S2.4 — the SAME conditional logic the retired scope pills used, now deciding
     whether a CHIP EXISTS rather than whether a pill exists. */
  const { scopes } = useAvailableWeekScopes(userId);
  const clubApplies = scopes.includes('home_club');
  const nearApplies = scopes.includes('handicap_band');

  useEffect(() => {
    if (open) setScreen('root');
  }, [open]);

  if (!open) return null;

  const set = (patch: Partial<BoardFilters>) => onChange({ ...filters, ...patch });

  const label = (o: { i18n: string; label: string }) => t(o.i18n, o.label);

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

  /* S1.2 — ONE SOURCE FOR THE FIGURE. The header and the footer button read the
     SAME prop, so feedback and commitment can never disagree. */
  const footN = resultCount;
  const footDisabled = footN === 0;
  const countsRounds = boardCountsRounds(board);
  const footLabel = footDisabled
    ? t('discover.filterBoard.noMatch', 'No rounds match')
    : countsRounds
      ? t('discover.filterBoard.showRounds', 'Show {{count}} rounds', { count: footN })
      : t('discover.filterBoard.showMembers', 'Show {{count}} members', { count: footN });
  const unitLabel = countsRounds
    ? t('discover.filterBoard.railRounds', { count: footN, defaultValue_one: 'ROUND', defaultValue_other: 'ROUNDS' })
    : t('discover.filterBoard.railMembers', { count: footN, defaultValue_one: 'MEMBER', defaultValue_other: 'MEMBERS' });

  const atDefaults = filtersAreDefault(filters);

  const courseRows = facets.openList('course');
  const needle = courseSearch.trim().toLowerCase();
  const shownCourses =
    courseRows.length > COURSE_SEARCH_THRESHOLD && needle.length >= 2
      ? courseRows.filter((c) => (c.label ?? '').toLowerCase().includes(needle))
      : courseRows;

  const headerTitle = () => {
    switch (screen) {
      case 'where':
        return t('discover.filterBoard.axis.where', 'Where');
      case 'courses':
        return t('discover.filterBoard.axis.courses', 'Courses');
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
          background: A.CANVAS,
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
          <span style={{ ...KICKER, color: A.INK }}>{headerTitle()}</span>
          <button
            type="button"
            onClick={() => (screen === 'root' ? onClose() : setScreen('root'))}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              fontFamily: SANS,
              ...KICKER,
              /* QUIET ACTIONS TAKE THE SURFACE INK, which on this canvas is
                 white. Amber is not spent on controls (S3.7). */
              color: A.INK,
              cursor: 'pointer',
            }}
          >
            {screen === 'root'
              ? t('discover.filterBoard.done', 'Done')
              : t('discover.filterBoard.back', 'Back')}
          </button>
        </div>
      </div>

      {/* S1 — THE SHOWING HEADER. Outside the scroller, so it never scrolls
          away: every tap on any chip moves this figure where the eye already is. */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px 14px',
          borderBottom: `1px solid ${A.BORDER}`,
          background: A.CANVAS,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}>
            {t('discover.filterBoard.showing', 'Showing')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
            <span
              className="tabular-nums"
              style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1 }}
            >
              {footN}
            </span>
            <span style={{ ...KICKER, color: A.MUTE }}>{unitLabel}</span>
          </div>
        </div>
        {/* S1.4 — RESET lives here now. Disabled and dim at defaults. */}
        <button
          type="button"
          disabled={atDefaults}
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
            fontFamily: SANS,
            ...KICKER,
            color: atDefaults ? A.DIM : A.MUTE,
            cursor: atDefaults ? 'default' : 'pointer',
          }}
        >
          {t('discover.filterBoard.reset', 'Reset all filters')}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          willChange: 'transform',
        }}
      >
        {screen === 'root' && (
          <>
            {/* S2 — WHEN LEADS. It is the only axis whose change moves every
                other count on the screen. */}
            <SectionLabel>{t('discover.filterBoard.axis.when', 'When')}</SectionLabel>
            <ChipWrap>
              {WINDOW_OPTIONS.map((o) => (
                <Chip
                  key={o.key}
                  label={label(o)}
                  count={facets.countFor('window', o.key)}
                  selected={filters.window === o.key}
                  isDefault={o.key === DEFAULT_FILTERS.window}
                  onClick={() => set({ window: o.key as WindowKey })}
                />
              ))}
            </ChipWrap>

            <SectionLabel>{t('discover.filterBoard.who', 'Who')}</SectionLabel>
            <ChipWrap>
              {SCOPE_OPTIONS.filter((o) => (o.key === 'club' ? clubApplies : true)).map((o) => (
                <Chip
                  key={o.key}
                  label={label(o)}
                  count={facets.countFor('scope', o.key)}
                  selected={filters.scope === o.key}
                  isDefault={o.key === DEFAULT_FILTERS.scope}
                  onClick={() => set({ scope: o.key })}
                />
              ))}
            </ChipWrap>

            {/* S2.2 — RANKED BY keeps the Rankings / Feats split. A feat IS a
                board, not an axis laid over one, and the split is how that reads. */}
            <SectionLabel>{t('discover.filterBoard.rankedBy', 'Ranked by')}</SectionLabel>
            <SubLabel>{t('discover.filterBoard.rankings', 'Rankings')}</SubLabel>
            <ChipWrap>
              {RANKING_BOARD_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label)}
                  count={facets.countFor('board', key)}
                  selected={board === key}
                  isDefault={key === 'topar'}
                  onClick={() => onBoardChange(key)}
                />
              ))}
            </ChipWrap>
            <SubLabel>{t('discover.filterBoard.feats', 'Feats')}</SubLabel>
            <ChipWrap>
              {FEAT_BOARD_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label)}
                  count={facets.countFor('board', key)}
                  selected={board === key}
                  isDefault={false}
                  onClick={() => onBoardChange(key)}
                />
              ))}
            </ChipWrap>

            <SectionLabel>{t('discover.filterBoard.axis.handicap', 'Handicap')}</SectionLabel>
            <ChipWrap>
              {BAND_OPTIONS.filter((o) => (o.key === 'near' ? nearApplies : true)).map((o) => (
                <Chip
                  key={o.key}
                  label={label(o)}
                  count={facets.countFor('band', o.key)}
                  selected={filters.band === o.key}
                  isDefault={o.key === DEFAULT_FILTERS.band}
                  onClick={() => set({ band: o.key as BandKey })}
                />
              ))}
            </ChipWrap>

            {/* PLAIN COUNTS. NOT A SPLIT: the three do not sum to the total,
                because a member with a competition round and a social round is
                counted in both. */}
            <SectionLabel>{t('discover.filterBoard.axis.competition', 'Competition')}</SectionLabel>
            <ChipWrap>
              {COMPETITION_OPTIONS.map((o) => (
                <Chip
                  key={o.key}
                  label={label(o)}
                  count={facets.countFor('competition', o.key)}
                  selected={filters.competition === o.key}
                  isDefault={o.key === DEFAULT_FILTERS.competition}
                  onClick={() => set({ competition: o.key as CompetitionKey })}
                />
              ))}
            </ChipWrap>

            {/* S2.1 — THE TWO OPEN LISTS ARE THE ONLY THINGS THAT STILL DRILL IN:
                5 countries with 14 sub-countries, and 254 courses out of a
                23,295 catalogue. Neither can be a chip row. */}
            <div style={{ marginTop: 22, borderTop: `1px solid ${A.BORDER}` }}>
              <PanelRow
                label={t('discover.filterBoard.axis.where', 'Where')}
                value={whereLabel}
                valueChanged={filters.regionKind != null || filters.regionValue != null}
                chevron
                onClick={() => setScreen('where')}
              />
              <PanelRow
                label={t('discover.filterBoard.axis.courses', 'Courses')}
                value={coursesLabel}
                valueChanged={filters.courses !== DEFAULT_FILTERS.courses || filters.courseId != null}
                chevron
                onClick={() => setScreen('courses')}
              />
            </div>
            <div style={{ height: 24 }} />
          </>
        )}

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
                LABEL column and are grouped by it rather than re-derived. */}
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
      </div>


      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${A.BORDER}`,
          background: A.CANVAS,
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
            /* S5.1 — INK FILL, CANVAS LABEL. Never amber. */
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
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        padding: '22px 16px 9px',
        color: A.DIM,
      }}
    >
      {children}
    </div>
  );
}

/** S2.2 — the Rankings / Feats sub-labels inside RANKED BY. */
function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        padding: '4px 16px 8px',
        color: A.DIM,
        opacity: 0.85,
      }}
    >
      {children}
    </div>
  );
}

export default BoardFilterPanel;
