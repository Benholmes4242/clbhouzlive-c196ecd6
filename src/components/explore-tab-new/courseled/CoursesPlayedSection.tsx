import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';

import { CourseImageFallback } from './CourseImageFallback';
import { A, KICKER, SANS, FIGS, DISCOVER_FACT, PODIUM_ACCENT } from './tokens';
import { WINDOW_SHORT, type BoardFilters } from './boardFilters';
import { useBoardCourses, type BoardCourseRow } from './hooks/useBoardCourses';
import { CoursesPlayedSeeAllSheet } from './CoursesPlayedSeeAllSheet';
import { CourseHolePanel } from './CourseHolePanel';
import { ListTerminalRow } from './ListTerminalRow';
import { windowDays } from './GolfThisWeek';

/**
 * HOW THE COURSES PLAYED (BRIEF_COURSES_HOW_THEY_PLAYED).
 *
 * IT ANSWERS HOW EACH COURSE PLAYED, NOT WHERE ROUNDS HAPPENED. get_board_courses
 * now ORDERS BY plays_to DESC and its LIMIT selects on that same axis, so
 * THE ROWS RENDER IN THE RPC'S OWN ORDER AND NOTHING IS SORTED CLIENT-SIDE
 * (S1.3). Sorting the survivors of a most-played limit would rank an arbitrary
 * subset and call it hardest first.
 *
 * THE PANEL DOES NOT LIST MEMBERS (S3.1). It duplicated the board directly above
 * it and cost a query per open; the course's own analytics stand there instead.
 *
 * It still reads the page's one filter bar, still takes NO board key, and
 * switching Ranked by must leave it completely unchanged.
 */

const TOPAR_UNDER = A.RED;
const ROW_H = 46;
const RANK_W = 14;
const PLAYS_TO_W = 62;
const CHEVRON_W = 22;
const CARD_PAD = 12;
/** S2.3 — a rise is GREEN, a fall is A.DIM. Red on this page means UNDER PAR. */
const TREND_UP = PODIUM_ACCENT.green;

const CAP = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
  color: A.DIM,
};

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
  /* S2.5 — one row open at a time. */
  const [openId, setOpenId] = useState<string | null>(null);
  const [seeAll, setSeeAll] = useState(false);

  const win = WINDOW_SHORT[filters.window];
  const windowLabel = t(win.i18n, win.label);
  const days = windowDays(filters.window);

  const courses = useBoardCourses(userId, filters, { limit: 6 });
  const rows = courses.data?.rows ?? [];
  const total = courses.data?.total ?? 0;
  const roundsShown = rows.reduce((s, r) => s + r.rounds, 0);

  const toggle = useCallback((id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  /* The member has already said which course they care about. */
  if (filters.courses === 'one') return null;

  if (courses.isPending) {
    return (
      <section aria-hidden style={{ fontFamily: SANS }}>
        <div style={{ height: 14, width: 176, background: A.PANEL, borderRadius: 3 }} />
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div style={{ height: 15, width: 72, background: A.PANEL, borderRadius: 3 }} />
          <div style={{ height: 15, width: 64, background: A.PANEL, borderRadius: 3 }} />
          <div style={{ height: 15, width: 58, background: A.PANEL, borderRadius: 3 }} />
        </div>
        <div style={{ marginTop: 12, background: A.PANEL, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ height: 22 }} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: ROW_H + 8 }} />
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) return null;

  /* S2.4 — the scale bar reads against the range of the ROWS SHOWN. */
  const playsTo = rows.map((r) => r.plays_to).filter((v): v is number => v != null);
  const scaleMax = playsTo.length > 0 ? Math.max(...playsTo) : 0;
  const scaleMin = playsTo.length > 0 ? Math.min(...playsTo) : 0;

  return (
    <section style={{ fontFamily: SANS, ...FIGS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ ...KICKER, color: A.INK }}>
          {t('discover.coursesPlayed.title', 'How the courses played')}
        </span>
        <span style={{ ...CAP, marginLeft: 'auto' }}>
          {t('discover.coursesPlayed.hardestFirst', 'Hardest first')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
        <CourseStat value={String(total)} label={t('discover.filterBoard.col.courses', 'COURSES')} />
        <CourseStat value={String(roundsShown)} label={t('discover.filterBoard.col.rounds', 'ROUNDS')} />
        <CourseStat value={days} label={t('discover.filterBoard.col.days', 'DAYS')} />
      </div>

      {/* S1.4 — CONTAINMENT GOES LIGHTER, NEVER DARKER. */}
      <div
        style={{
          marginTop: 12,
          background: A.PANEL,
          borderRadius: 12,
          overflow: 'hidden',
          padding: `0 ${CARD_PAD}px`,
        }}
      >
        <CourseHeaderRow />
        {rows.map((row, index) => (
          <CourseRow
            key={row.course_id}
            row={row}
            rank={index + 1}
            first={index === 0}
            open={openId === row.course_id}
            onToggle={() => toggle(row.course_id)}
            userId={userId}
            scaleMin={scaleMin}
            scaleMax={scaleMax}
            onCoursePress={onCoursePress}
          />
        ))}
        {total > 6 && (
          <ListTerminalRow
            label={t('discover.coursesPlayed.seeAll', 'See all {{count}} courses', { count: total })}
            onPress={() => setSeeAll(true)}
          />
        )}
      </div>

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

/** S1.5 — COURSE left, FIELD PLAYS TO right, at the column-header scale. */
export function CourseHeaderRow() {
  const { t } = useTranslation('courses');
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${RANK_W}px minmax(0, 1fr) ${PLAYS_TO_W}px ${CHEVRON_W}px`,
        alignItems: 'center',
        columnGap: 10,
        padding: '10px 0 6px',
        borderBottom: `1px solid ${A.BORDER}`,
      }}
    >
      <span aria-hidden />
      <span style={CAP}>{t('discover.coursesPlayed.course', 'Course')}</span>
      <span style={{ ...CAP, textAlign: 'right' }}>
        {t('discover.coursesPlayed.fieldPlaysTo', 'Field plays to')}
      </span>
      <span aria-hidden />
    </div>
  );
}

export function CourseRow({
  row,
  rank,
  first,
  open,
  onToggle,
  userId,
  scaleMin,
  scaleMax,
  onCoursePress,
}: {
  row: BoardCourseRow;
  rank: number;
  first: boolean;
  open: boolean;
  onToggle: () => void;
  userId: string | undefined;
  scaleMin: number;
  scaleMax: number;
  onCoursePress?: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const Chevron = open ? ChevronUp : ChevronDown;

  /* S2.4 — difficulty as a shape, so the column is read once. */
  const span = Math.max(0.1, scaleMax - scaleMin);
  const fill =
    row.plays_to == null ? 0 : Math.max(4, Math.min(100, ((row.plays_to - scaleMin) / span) * 100));

  return (
    <div style={{ borderTop: first ? 'none' : `1px solid ${A.BORDER}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `${RANK_W}px minmax(0, 1fr) ${PLAYS_TO_W}px ${CHEVRON_W}px`,
          alignItems: 'center',
          columnGap: 10,
          minHeight: ROW_H,
          background: 'transparent',
          border: 'none',
          padding: '6px 0 0',
          fontFamily: SANS,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span className="tabular-nums" style={{ fontSize: 12.5, fontWeight: 700, color: A.MUTE }}>
          {rank}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <CourseImageFallback
            courseId={row.course_id}
            courseName={row.name}
            imageUrl={row.thumbnail_image}
            initialsSize={9}
            style={{ width: 34, height: 26, flexShrink: 0, borderRadius: 5 }}
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
            {/* S2.2 (AMENDMENT B2) — area · N rounds [trend]. No member count. */}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
                ...CAP,
                color: A.MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {row.area ? (
                <>
                  <span
                    style={{
                      minWidth: 0,
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
              <span style={{ flexShrink: 0 }}>
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

      {/* S2.4 — the 3px scale bar, indented past the rank. */}
      <div
        aria-hidden
        style={{
          marginLeft: RANK_W + 10,
          marginTop: 6,
          marginBottom: 8,
          height: 3,
          borderRadius: 2,
          background: A.TRACK,
          overflow: 'hidden',
        }}
      >
        {row.plays_to != null && (
          <i
            style={{
              display: 'block',
              height: '100%',
              width: `${fill}%`,
              borderRadius: 2,
              background: A.MUTE,
            }}
          />
        )}
      </div>

      {open && (
        <div style={{ paddingBottom: 10 }}>
          <LowRoundLine row={row} />
          <CourseHolePanel courseId={row.course_id} userId={userId} onCoursePress={onCoursePress} />
        </div>
      )}
    </div>
  );
}

/**
 * S4 — THE LOW ROUND LINE. The figure sits NEXT TO THE NAME (S4.2), never pushed
 * to the row's right edge: the name and the figure are one statement. When
 * low_gross is null the line renders NOTHING — no dash, no reserved height.
 */
function LowRoundLine({ row }: { row: BoardCourseRow }) {
  const { t } = useTranslation('courses');
  if (row.low_gross == null) return null;

  const toPar = row.low_to_par;
  const toParText =
    toPar == null
      ? null
      : toPar === 0
        ? 'E'
        : toPar < 0
          ? `\u2212${Math.abs(toPar)}`
          : `+${toPar}`;
  const toParTone = toPar == null ? A.DIM : toPar < 0 ? TOPAR_UNDER : toPar === 0 ? A.MUTE : A.INK;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 8,
        padding: '2px 0 10px',
      }}
    >
      <span style={{ ...CAP, color: A.MUTE }}>
        {t('discover.coursesPlayed.lowRoundBy', 'Low round by {{name}}', {
          name: row.low_by ?? '\u2014',
        })}
        {row.eagle_rounds > 0 ? (
          <>
            {' \u00b7 '}
            {t('discover.coursesPlayed.nEagles', '{{count}} eagles', { count: row.eagle_rounds })}
          </>
        ) : null}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
        <span className="tabular-nums" style={{ fontSize: 17, fontWeight: 800, color: A.INK, lineHeight: 1 }}>
          {row.low_gross}
        </span>
        {toParText && (
          <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: toParTone }}>
            {toParText}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * NEW WINS, AND A ROW NEVER CARRIES BOTH.
 *
 * S2.3 — a RISE is green; a FALL is A.DIM. NEVER RED: red means under par on this
 * page, and a red "down 12" beneath a red minus-2 would make one colour mean two
 * opposite things on one screen.
 */
function Badges({ row }: { row: BoardCourseRow }) {
  const { t } = useTranslation('courses');

  if (row.is_new) {
    return (
      <span
        style={{
          ...CAP,
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
  const up = change > 0;
  const Arrow = up ? ArrowUp : ArrowDown;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: up ? TREND_UP : A.DIM }}
    >
      <Arrow size={10} aria-hidden />
      <span className="tabular-nums">{Math.abs(change)}</span>
    </span>
  );
}

/**
 * PLAYS TO takes the to-par colour law: over par is A.INK with a plus, under par
 * is red with a TRUE MINUS. S2.6 — a null figure (no usable par, and it now sorts
 * LAST) renders NOTHING, not a zero and not a dash.
 */
function PlaysTo({ value }: { value: number | null }) {
  if (value == null) return <span style={{ width: PLAYS_TO_W }} aria-hidden />;

  const text =
    value > 0 ? `+${value.toFixed(1)}` : value < 0 ? `\u2212${Math.abs(value).toFixed(1)}` : '0.0';
  const tone = value < 0 ? TOPAR_UNDER : A.INK;

  return (
    <span style={{ width: PLAYS_TO_W, flexShrink: 0, textAlign: 'right' }}>
      <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: tone, lineHeight: 1 }}>
        {text}
      </span>
    </span>
  );
}

export default CoursesPlayedSection;
