import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseImageFallback } from './CourseImageFallback';
import { A, KICKER, SANS, FIGS, DISCOVER_FACT } from './tokens';
import { WINDOW_SHORT, type BoardFilters } from './boardFilters';
import { useBoardCourses, type BoardCourseRow } from './hooks/useBoardCourses';
import { useBoardCoursePlayers } from './hooks/useBoardCoursePlayers';
import { CoursesPlayedSeeAllSheet } from './CoursesPlayedSeeAllSheet';
import { ListTerminalRow } from './ListTerminalRow';
import { windowDays } from './GolfThisWeek';

/**
 * COURSES PLAYED (BRIEF_DISCOVER_COURSES_SECTION).
 *
 * THE BOARD IS WHO, THIS IS WHERE. It sits directly beneath the leaderboard and
 * above Amateur News (C1.1) because the two are a pair.
 *
 * IT READS THE PAGE'S ONE FILTER BAR AND NEVER WRITES TO IT (C2.4): there is no
 * sort toggle, no window chip and no filter row of its own here. It is also NOT
 * scoped by the active board (C2.2) — switching Ranked by leaves it untouched.
 *
 * A ROW EXPANDS IN PLACE (C5.1). It is a display, not navigation; the chevron
 * therefore points DOWN when shut and UP when open, never right.
 */

const TOPAR_UNDER = '#E5484D';
const ROW_H = 54;
const PLAYS_TO_W = 62;
const CHEVRON_W = 22;

/**
 * P1 — THE EXPANDED PANEL IS CAPPED. One player row is PLAYER_H tall and the
 * list shows at most PANEL_VISIBLE_ROWS of them; the ceiling is DERIVED from the
 * row height (P1.2) so changing the row cannot leave a stale pixel constant
 * behind. P3 — the fetch is raised to 50 so a scrollable list is not silently
 * truncated at the default twelve.
 */
const PLAYER_H = 40;
const PANEL_VISIBLE_ROWS = 10;
const PANEL_MAX_H = PLAYER_H * PANEL_VISIBLE_ROWS;
const PLAYERS_FETCH_LIMIT = 50;

export interface CoursesPlayedSectionProps {
  userId: string | undefined;
  /** The page's CURRENT filter state. The board key is deliberately absent. */
  filters: BoardFilters;
  onCoursePress?: (courseId: string) => void;
  onMemberPress?: (userId: string) => void;
}

export function CoursesPlayedSection({
  userId,
  filters,
  onCoursePress,
  onMemberPress,
}: CoursesPlayedSectionProps) {
  const { t } = useTranslation('courses');
  /* C5.5 — one row open at a time. */
  const [openId, setOpenId] = useState<string | null>(null);
  const [seeAll, setSeeAll] = useState(false);

  const win = WINDOW_SHORT[filters.window];
  const windowLabel = t(win.i18n, win.label);
  const days = windowDays(filters.window);

  const courses = useBoardCourses(userId, filters, { limit: 6 });
  const rows = courses.data?.rows ?? [];
  const total = courses.data?.total ?? 0;

  const toggle = useCallback((id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  /* C2.3 — the member has already said which course they care about. */
  if (filters.courses === 'one') return null;

  /* C6.2 — a skeleton at the height the section will occupy; it expands
     outwards only, and never renders short and grows. */
  if (courses.isPending) {
    return (
      <section aria-hidden style={{ fontFamily: SANS }}>
        <div style={{ height: 14, width: 130, background: A.PANEL, borderRadius: 3 }} />
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div style={{ height: 15, width: 72, background: A.PANEL, borderRadius: 3 }} />
          <div style={{ height: 15, width: 58, background: A.PANEL, borderRadius: 3 }} />
        </div>
        <div style={{ height: 20, marginTop: 12, borderBottom: `1px solid ${A.BORDER}` }} />
        <div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{ height: ROW_H, borderTop: i === 0 ? 'none' : `1px solid ${A.BORDER}` }}
            />
          ))}
        </div>
      </section>
    );
  }

  /* C6.1 — nothing to show hides the section, header included. The board above
     has already told the member their filters are narrow. */
  if (rows.length === 0) return null;

  return (
    <section style={{ fontFamily: SANS, ...FIGS }}>
      <div>
        <span style={{ ...KICKER, display: 'block', color: A.INK }}>
          {t('discover.coursesPlayed.title', 'Courses played')}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
          <CourseStat value={String(total)} label={t('discover.filterBoard.col.courses', 'COURSES')} />
          <CourseStat value={days} label={t('discover.filterBoard.col.days', 'DAYS')} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <CourseHeaderRow />
        {rows.map((row, index) => (
          <CourseRow
            key={row.course_id}
            row={row}
            first={index === 0}
            open={openId === row.course_id}
            onToggle={() => toggle(row.course_id)}
            userId={userId}
            filters={filters}
            onCoursePress={onCoursePress}
            onMemberPress={onMemberPress}
          />
        ))}
        {total > 6 && (
          <ListTerminalRow
            label={t('discover.coursesPlayed.seeAll', 'See all {{count}} courses', { count: total })}
            onPress={() => setSeeAll(true)}
          />
        )}
      </div>

      {/* G5 — THE SEE ALL DOES SOMETHING. Same RPC, same filter state, p_limit
          raised; the sheet's rows are the SAME row component as here (G5.3). */}
      <CoursesPlayedSeeAllSheet
        open={seeAll}
        onClose={() => setSeeAll(false)}
        userId={userId}
        filters={filters}
        windowLabel={windowLabel}
        onCoursePress={onCoursePress}
        onMemberPress={onMemberPress}
      />
    </section>
  );
}

function CourseStat({ value, label }: { value: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, color: A.INK }}>
        {value}
      </span>
      <span style={{ ...KICKER, fontSize: 10, color: A.MUTE }}>{label}</span>
    </span>
  );
}

export function CourseHeaderRow() {
  const { t } = useTranslation('courses');
  const cap = {
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.13em',
    textTransform: 'uppercase' as const,
    color: A.DIM,
  };
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `minmax(0, 1fr) ${PLAYS_TO_W}px ${CHEVRON_W}px`,
        alignItems: 'center',
        columnGap: 10,
        padding: '0 0 6px',
        borderBottom: `1px solid ${A.BORDER}`,
      }}
    >
      <span style={cap}>{t('discover.coursesPlayed.course', 'Course')}</span>
      <span style={{ ...cap, textAlign: 'right' }}>{t('discover.coursesPlayed.playsTo', 'Plays to')}</span>
      <span aria-hidden />
    </div>
  );
}

export function CourseRow({
  row,
  first,
  open,
  onToggle,
  userId,
  filters,
  onCoursePress,
  onMemberPress,
}: {
  row: BoardCourseRow;
  first: boolean;
  open: boolean;
  onToggle: () => void;
  userId: string | undefined;
  filters: BoardFilters;
  onCoursePress?: (courseId: string) => void;
  onMemberPress?: (userId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div style={{ borderTop: first ? 'none' : `1px solid ${A.BORDER}` }}>
      {/* D2.1 — THE WHOLE COLLAPSED ROW EXPANDS, thumbnail included. One row,
          one behaviour; the course page is reached from the expanded panel. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `minmax(0, 1fr) ${PLAYS_TO_W}px ${CHEVRON_W}px`,
          alignItems: 'center',
          columnGap: 10,
          minHeight: ROW_H,
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontFamily: SANS,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
          {/* D1 — the shared course fallback: the hashed gradient with course
              initials, exactly as every other course surface renders it. */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <CourseImageFallback
              courseId={row.course_id}
              courseName={row.name}
              imageUrl={row.thumbnail_image}
              initialsSize={13}
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 8,
                border: `1px solid ${A.BORDER}`,
              }}
            />

            <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13.5,
                fontWeight: 700,
                color: DISCOVER_FACT,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.name ?? '\u2014'}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 3,
                ...KICKER,
                fontSize: 9.5,
                color: A.MUTE,
              }}
            >
              {/* C3.3 — no leading interpunct and no gap when area is absent. */}
              {row.area ? (
                <>
                  <span
                    style={{
                      maxWidth: 130,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.area}
                  </span>
                  <span aria-hidden>{'\u00b7'}</span>
                </>
              ) : null}
              <span>
                {row.rounds === 1
                  ? t('discover.coursesPlayed.oneRound', '1 round')
                  : t('discover.coursesPlayed.nRounds', '{{count}} rounds', { count: row.rounds })}
              </span>
              <Badges row={row} />
            </span>
            </span>
          </span>

          <PlaysTo value={row.plays_to} />

          <span style={{ width: CHEVRON_W, display: 'flex', justifyContent: 'flex-end' }}>
            <Chevron size={16} color={A.DIM} aria-hidden />
          </span>
      </button>

      {open && (
        <CoursePlayers
          courseId={row.course_id}
          courseName={row.name}
          expectedRows={Math.max(1, Math.min(row.members, PANEL_VISIBLE_ROWS))}
          userId={userId}
          filters={filters}
          onMemberPress={onMemberPress}
          onCoursePress={onCoursePress}
        />
      )}
    </div>
  );
}

/**
 * C4 — NEW WINS, AND A ROW NEVER CARRIES BOTH (C4.4).
 *
 * C4.3 — ZERO IS NOT NULL. prev_rounds = 0 is a genuine rise from nothing and
 * renders; prev_rounds IS NULL (All time, where there is no previous period)
 * renders NOTHING. A zero change is never drawn, and there is no flat arrow.
 */
function Badges({ row }: { row: BoardCourseRow }) {
  const { t } = useTranslation('courses');

  /* C4.1 — NOT AMBER. Amber means "you" on this surface and appears nowhere here. */
  if (row.is_new) {
    return (
      <span
        style={{
          ...KICKER,
          fontSize: 9,
          color: A.INK,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 4,
          padding: '1px 5px',
        }}
      >
        {t('discover.coursesPlayed.new', 'New')}
      </span>
    );
  }

  if (row.prev_rounds == null) return null;
  const change = row.rounds - row.prev_rounds;
  if (change === 0) return null;
  const Arrow = change > 0 ? ArrowUp : ArrowDown;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: A.MUTE }}>
      <Arrow size={10} aria-hidden />
      <span className="tabular-nums">{Math.abs(change)}</span>
    </span>
  );
}

/**
 * C3.4 — PLAYS TO takes the to-par colour law: over par is A.INK with a plus,
 * under par is red with a TRUE MINUS. A null figure is an em-dash, never 0.0.
 */
function PlaysTo({ value }: { value: number | null }) {
  const text =
    value == null
      ? '\u2014'
      : value > 0
        ? `+${value.toFixed(1)}`
        : value < 0
          ? `\u2212${Math.abs(value).toFixed(1)}`
          : '0.0';
  const tone = value == null ? A.DIM : value < 0 ? TOPAR_UNDER : A.INK;

  return (
    <span style={{ width: PLAYS_TO_W, flexShrink: 0, textAlign: 'right' }}>
      <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: tone, lineHeight: 1 }}>
        {text}
      </span>
    </span>
  );
}

/** C5.3 / C5.6 — the panel holds a shell at the height it will occupy. */
function CoursePlayers({
  courseId,
  courseName,
  expectedRows,
  userId,
  filters,
  onMemberPress,
  onCoursePress,
}: {
  courseId: string;
  courseName: string | null;
  expectedRows: number;
  userId: string | undefined;
  filters: BoardFilters;
  onMemberPress?: (userId: string) => void;
  onCoursePress?: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const players = useBoardCoursePlayers(userId, courseId, filters, {
    limit: PLAYERS_FETCH_LIMIT,
  });

  if (players.isPending) {
    return (
      <div aria-hidden style={{ paddingBottom: 8, height: expectedRows * PLAYER_H }} />
    );
  }

  const list = players.data ?? [];
  /* P1.4 — ten or fewer players is the panel's NATURAL height: no maxHeight, no
     scroll area, nothing padded out to a fixed size. */
  const scrolls = list.length > PANEL_VISIBLE_ROWS;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* P2 — the count sits ABOVE the list and does not move with it. Derived
          from the rows already in hand (P2.3), never a second call. */}
      <div style={{ ...KICKER, color: A.MUTE, padding: '2px 0 6px' }}>
        {list.length === 1
          ? t('discover.coursesPlayed.oneMember', '1 member')
          : t('discover.coursesPlayed.nMembers', '{{count}} members', { count: list.length })}
      </div>

      <div
        style={
          scrolls
            ? {
                maxHeight: PANEL_MAX_H,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                /* P1.3 — REQUIRED: without contain, the end of this list scrolls
                   the page, or the See all sheet, behind it. */
                overscrollBehavior: 'contain',
                willChange: 'transform',
              }
            : undefined
        }
      >
        {list.map((p) => (
        <button
          key={p.user_id}
          type="button"
          onClick={() => onMemberPress?.(p.user_id)}
          style={{
            width: '100%',
            minHeight: PLAYER_H,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontFamily: SANS,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {/* C5.3 — the app-wide member fallback: hue from the user id. */}
          <SquircleAvatar
            size={26}
            src={p.profile_photo_url}
            alt={p.display_name ?? ''}
            userId={p.user_id}
            hairlineRing
          />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: DISCOVER_FACT,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {p.display_name ?? '\u2014'}
          </span>
          {p.rounds > 1 && (
            <span style={{ ...KICKER, fontSize: 9, color: A.DIM }}>
              {t('discover.coursesPlayed.nRounds', '{{count}} rounds', { count: p.rounds })}
            </span>
          )}
          {/* C5.4 — no usable par is an em-dash, not a zero. */}
          <span
            className="tabular-nums"
            style={{
              flexShrink: 0,
              fontSize: 12.5,
              fontWeight: 700,
              color:
                p.best_to_par == null
                  ? A.DIM
                  : p.best_to_par < 0
                    ? TOPAR_UNDER
                    : A.INK,
            }}
          >
            {p.best_to_par == null
              ? '\u2014'
              : p.best_to_par === 0
                ? 'E'
                : p.best_to_par < 0
                  ? `\u2212${Math.abs(p.best_to_par)}`
                  : `+${p.best_to_par}`}
          </span>
        </button>
        ))}
      </div>

      {/* D2.2 / D2.3 / P4 — who played here, THEN go to the course. It sits
          BELOW the scrolling list and stays reachable without scrolling it. */}
      <button
        type="button"
        onClick={() => onCoursePress?.(courseId)}
        aria-label={courseName ?? undefined}
        style={{
          width: '100%',
          minHeight: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 4,
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontFamily: SANS,
          textAlign: 'left',
          cursor: 'pointer',
          ...KICKER,
          color: A.BODY,
        }}
      >
        <span>{t('discover.coursesPlayed.openCourse', 'Open course')}</span>
        <ChevronRight size={13} aria-hidden />
      </button>
    </div>
  );
}

export default CoursesPlayedSection;
