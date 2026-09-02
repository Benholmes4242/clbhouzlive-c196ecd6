import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A, KICKER, SANS, FIGS, DISCOVER_FACT } from './tokens';
import type { BoardFilters } from './boardFilters';
import { useBoardCourses, type BoardCourseRow } from './hooks/useBoardCourses';
import { useBoardCoursePlayers } from './hooks/useBoardCoursePlayers';

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
const ROW_H = 62;

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
        <div style={{ marginTop: 12 }}>
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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ ...KICKER, color: A.INK }}>
          {t('discover.coursesPlayed.title', 'Courses played')}
        </span>
        <span style={{ ...KICKER, color: A.MUTE }}>
          {t('discover.coursesPlayed.seeAll', 'See all {{count}} courses', { count: total })}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
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
      </div>
    </section>
  );
}

function CourseRow({
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: ROW_H }}>
        {/* C3.1 — a null thumbnail is a FLAT PANEL TILE. Courses are not people:
            no hue, no initials. The thumbnail is also the one navigation tap on
            the row; everything else expands. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onCoursePress) onCoursePress(row.course_id);
            else onToggle();
          }}
          aria-label={row.name ?? undefined}
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            padding: 0,
            borderRadius: 8,
            border: `1px solid ${A.BORDER}`,
            background: A.PANEL,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {row.thumbnail_image && (
            <img
              src={row.thumbnail_image}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          style={{
            flex: 1,
            minWidth: 0,
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

          <PlaysTo value={row.plays_to} />

          <Chevron size={16} color={A.DIM} aria-hidden style={{ flexShrink: 0 }} />
        </button>
      </div>

      {open && (
        <CoursePlayers
          courseId={row.course_id}
          expectedRows={Math.max(1, Math.min(row.members, 6))}
          userId={userId}
          filters={filters}
          onMemberPress={onMemberPress}
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
  const { t } = useTranslation('courses');
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
    <span style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span className="tabular-nums" style={{ fontSize: 13.5, fontWeight: 700, color: tone, lineHeight: 1 }}>
        {text}
      </span>
      <span style={{ ...KICKER, fontSize: 9, color: A.DIM }}>
        {t('discover.coursesPlayed.playsTo', 'Plays to')}
      </span>
    </span>
  );
}

/** C5.3 / C5.6 — the panel holds a shell at the height it will occupy. */
function CoursePlayers({
  courseId,
  expectedRows,
  userId,
  filters,
  onMemberPress,
}: {
  courseId: string;
  expectedRows: number;
  userId: string | undefined;
  filters: BoardFilters;
  onMemberPress?: (userId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const players = useBoardCoursePlayers(userId, courseId, filters);
  const PLAYER_H = 40;

  if (players.isPending) {
    return (
      <div aria-hidden style={{ paddingBottom: 8, height: expectedRows * PLAYER_H }} />
    );
  }

  const list = players.data ?? [];
  if (list.length === 0) return null;

  return (
    <div style={{ paddingBottom: 8 }}>
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
  );
}

export default CoursesPlayedSection;
