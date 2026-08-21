import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, Trophy } from 'lucide-react';

import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedPlayer, MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
import { formatNumber } from '@/i18n/format';
import { MostPlayedPanel as MostPlayedPanelShell } from './DiscoverCourseLedSkeleton';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';


/**
 * Section 5 — WHERE THEY PLAYED THIS WEEK
 * (BRIEF_MOST_PLAYED_LEADERBOARD, SUPERSEDES BRIEF_MOST_PLAYED_WHO_PLAYED).
 *
 * FOUR FAULTS THIS FIXES (§S0):
 *   §S0.1 the expanded list was INDENTED under the thumbnail and narrow, with a
 *         lake of white between a name and its number. It is now a FULL-WIDTH
 *         board and nothing is indented.
 *   §S0.2 the RANK NUMBER is gone from the course rows. Live counts were
 *         11 / 2 / 1 / 1 — three effective ties, so the badge was decoration
 *         inviting a member to read a contest into a list of places.
 *   §S0.3 "PLAYED TO" was a grey small-caps caption and is now the row's
 *         HEADLINE FIGURE on the right.
 *   §S0.4 the section stopped being a leaderboard of COURSES when the content is
 *         PLAYERS. Nobody needs to know a course was played eleven times; they
 *         want to know WHO, and how they went.
 *
 * THE ORDERING IS UNCHANGED (§S1.3) — still most rounds first. The count moved
 * into the meta line as CONTEXT, not a score (§S1.4). The movement marker stays
 * in its existing tones: it is the one genuinely comparative thing here (§S1.6).
 *
 * POSITION FIRST, SCORE LAST (§S2.2). That is the order every golfer has read on
 * every board they have ever stood in front of, and it is why the format needs
 * no explaining.
 */

interface Props {
  rows: MostPlayedRow[];
  limit?: number;
  /** TRUE while the rounds aggregate has not settled — shell holds the slot. */
  isPending?: boolean;
  onRowPress: (row: MostPlayedRow) => void;
  onSeeAll?: () => void;
  showEyebrow?: boolean;
}

/**
 * A WHOLE-NUMBER to-par, TRUE MINUS, "E" at level — for a single round's score
 * on the board, which is always an integer.
 */
function formatRelInt(v: number): string {
  if (v === 0) return 'E';
  return `${v > 0 ? '+' : '\u2212'}${formatNumber(Math.abs(v))}`;
}

/** One decimal, TRUE MINUS, "E" at level. */
function formatToPar(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'E';
  const n = Math.abs(r).toFixed(1);
  return `${r > 0 ? '+' : '\u2212'}${n}`;
}

/**
 * MOVEMENT — a MOVEMENT, not a score: INDEX_DELTA.light green up / red down.
 * NEW is amber (the absence of a prior week), LEVEL is dim. Absolute figures
 * only; a percentage at this volume would lie (see §5).
 */
function MoveMark({
  row,
  t,
}: {
  row: MostPlayedRow;
  t: (key: string, def: string, opts?: Record<string, unknown>) => string;
}) {
  const base: React.CSSProperties = {
    ...LABEL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    fontSize: 9,
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums lining-nums',
  };
  if (row.move === 'new')
    return <span style={{ ...base, color: A.AMBER }}>{t('discover.mostPlayedNew', 'New')}</span>;
  if (row.move === 'level')
    return <span style={{ ...base, color: A.DIM }}>{t('discover.mostPlayedLevel', 'Level')}</span>;
  const up = row.move === 'up';
  const color = up ? INDEX_DELTA.light.improved : INDEX_DELTA.light.drifted;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span style={{ ...base, color }}>
      <Icon size={9} strokeWidth={2.75} />
      {formatNumber(Math.abs(row.change))}
    </span>
  );
}

/* ───────────────────────── THE BOARD (§S2) ─────────────────────────
 * FULL WIDTH, NO INDENT (§S2.3). The name column takes all remaining space; the
 * NAME_INDENT that used to align this list with the course name is DELETED —
 * that indent was fault §S0.1.
 */

/** Beyond twelve the expansion navigates instead of growing (§S2.5, unchanged). */
const LIST_CAP = 12;

/** Ink ramp of the round tiles, shared so the board reads as one family. */
const INK = '#0B0F14';
const MID = '#5A6673';
const FAINT = '#8A929C';
const GHOST = '#C8D0D8';

/** §S2.8 — the viewing member's row takes a 4.5% amber tint. NO RING, NO "You". */
const VIEWER_TINT = 'rgba(247,147,30,0.045)';

/** §S2.5 — every gross in a board aligns on its right edge. */
const GROSS_COL = 30;
/** §S2.2 — position first, in a fixed column so names start on one line. */
const POS_COL = 17;

/* NO VIEWER MARKING ON THE COURSE HEADER. Ben's call
 * (BRIEF_SCORECARD_WIDTH_AND_VIEWER_RING §S2) — the amber ring and the "You"
 * substitution were both removed deliberately, and §S2.8 keeps that: the board
 * marks the viewer with a TINT ONLY. Amber still means the viewing member. */

/** A face that opens its member's profile and never toggles the row (§S2.7). */
function MemberFace({
  player,
  size,
  onOpen,
}: {
  player: MostPlayedPlayer;
  size: number;
  onOpen: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // STOP, OR THE ROW TOGGLES BEHIND THE NAVIGATION (§S2.7).
        e.stopPropagation();
        onOpen(player.userId);
      }}
      aria-label={player.name}
      style={{
        display: 'block',
        padding: 0,
        border: 'none',
        background: 'transparent',
        borderRadius: '34%',
        cursor: 'pointer',
        flex: 'none',
        // THE RING READS THEM APART: 1.5px of the panel colour, on EVERY face.
        boxShadow: `0 0 0 1.5px ${A.PANEL}`,
      }}
    >
      <SquircleAvatar
        size={size}
        src={player.avatarUrl}
        alt={player.name}
        userId={player.userId}
        hairlineRing
      />
    </button>
  );
}

/* §S3.1 — THE COLLAPSED FACE ROW IS DELETED, and with it "BEST 68" (§S3.3).
 * The board answers "who played here" far better than six overlapping faces
 * did, and the board's FIRST ROW IS THE BEST SCORE — so a separate best figure
 * was the same fact twice. Keeping either would show the same members twice on
 * one card. Do not reinstate them. */

/**
 * §S2 — THE TOURNAMENT BOARD.
 *
 *   position | avatar | name over home club | to-par | gross
 *
 * NO INTERNAL SCROLL, AND THAT IS DELIBERATE (carried from §S2.4 of the previous
 * brief): "a scrollable panel inside a scrolling page is a real fault on a
 * phone: a finger that lands on the list scrolls the list instead of the page,
 * and a member cannot tell why the page stopped moving. The expansion is
 * member-initiated, so its height is consented to."
 *
 * A MEMBER WHO PLAYED TWICE APPEARS ONCE with their BEST round (§S2.9) — the
 * hook already collapses them by (course, member) minimum gross.
 */
function MemberBoard({
  row,
  viewerId,
  onOpenMember,
  onSeeAllAtCourse,
}: {
  row: MostPlayedRow;
  viewerId: string | null;
  onOpenMember: (userId: string) => void;
  onSeeAllAtCourse: () => void;
}) {
  const { t } = useTranslation('courses');
  const listed = row.players.slice(0, LIST_CAP);
  const hidden = row.players.length - listed.length;
  if (listed.length === 0) return null;

  return (
    <div style={{ paddingBottom: 10 }}>
      {listed.map((p) => {
        const isViewer = viewerId != null && p.userId === viewerId;
        const under = p.toPar != null && p.toPar < 0;
        return (
          <div
            key={p.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              // FULL WIDTH (§S2.3): the tint bleeds to the card's own padding
              // rather than starting at a thumbnail-width indent.
              margin: '0 -14px',
              padding: '7px 14px',
              minWidth: 0,
              // §S2.8 — TINT ONLY.
              background: isViewer ? VIEWER_TINT : 'transparent',
            }}
          >
            {/* §S2.2 — POSITION FIRST. The leader's position is INK; the rest
                are GHOST, so the board has one focal point per course. */}
            <span
              style={{
                ...NUMF,
                flex: 'none',
                width: POS_COL,
                fontSize: 11,
                lineHeight: 1,
                color: p.position === 1 ? INK : GHOST,
              }}
            >
              {formatNumber(p.position)}
            </span>
            <MemberFace player={p} size={24} onOpen={onOpenMember} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMember(p.userId);
              }}
              style={{
                // ALL REMAINING SPACE (§S2.3).
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  // EVERY NAME RENDERS THE SAME — no bold on the viewer, no
                  // amber text, no "You" (§S2.8).
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                  color: INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </span>
              {/* §S2.4 — THE HOME CLUB UNDER THE NAME. A member with none
                  renders NOTHING: no placeholder, no "No club". The row does not
                  change height because nothing here reserves space for it. */}
              {p.homeClub && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                    lineHeight: 1.25,
                    color: FAINT,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.homeClub}
                </span>
              )}
            </button>
            {/* §S2.5 — THE TO-PAR: 12px, A.MID, RED WHEN UNDER PAR, in the SAME
                token as the mini scorecard and the superlative band. */}
            <span
              style={{
                ...NUMF,
                flex: 'none',
                fontSize: 12,
                lineHeight: 1,
                color: under ? TOPAR_RED : MID,
              }}
            >
              {p.toPar != null ? formatRelInt(p.toPar) : ''}
            </span>
            {/* §S2.5 — THE GROSS LAST, right-aligned in a FIXED column so every
                score in the board aligns on its right edge. */}
            <span
              style={{
                ...NUMF,
                flex: 'none',
                width: GROSS_COL,
                textAlign: 'right',
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: INK,
              }}
            >
              {p.gross != null ? formatNumber(p.gross) : '\u2014'}
            </span>
          </div>
        );
      })}
      {/* A NAVIGATION, NEVER A SCROLL TRAP (§S2.5). */}
      {hidden > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeeAllAtCourse();
          }}
          style={{
            ...LABEL,
            fontSize: 9,
            color: INK,
            border: 'none',
            background: 'transparent',
            padding: '6px 0 0',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {t('discover.mostPlayedSeeAllAtCourse', 'See all at this course')}
        </button>
      )}
    </div>
  );
}


export function MostPlayedLeaderboard({
  rows,
  limit = 5,
  isPending = false,
  onRowPress,
  onSeeAll,
  showEyebrow = true,
}: Props) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  /** §S2.8 — the viewing member, marked by TINT ONLY. */
  const viewerId = user?.id ?? null;
  /** ONE COURSE OPEN AT A TIME (§S2.10) — a single id, never a set. */
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = rows.slice(0, limit);
  const metaQuery = useCourseCardMeta(shown.map((r) => r.courseId));
  const meta = metaQuery.data;
  // DECORATION ONLY (layer 2b): the row already holds its own course_name from
  // gam_round_stats, so only the THUMBNAIL waits — the shimmer sits in that slot
  // while the rest of the row reads straight away.
  const thumbPending = shown.length > 0 && metaQuery.isPending;

  const openMember = (userId: string) => navigate(`/profile/${userId}`);

  if (isPending) return <MostPlayedPanelShell />;
  if (shown.length === 0) return null;


  return (
    <section>
      {showEyebrow && (
        <Eyebrow
          icon={Trophy}
          aside={
            rows.length > shown.length && onSeeAll ? (
              <InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>
            ) : (
              <span style={LABEL}>{t('discover.trackedRounds', 'Tracked rounds')}</span>
            )
          }
        >
          {/* §S1.1 — the heading DESCRIBES WHAT THE SECTION SHOWS rather than
              asserting a ranking that 11 / 2 / 1 / 1 does not support. The old
              'discover.mostPlayed' key is now unused and STAYS in all six
              locale files (§S4.1). */}
          {t('discover.whereTheyPlayed', 'Where they played this week')}
        </Eyebrow>
      )}

      <div style={{ ...CARD_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {shown.map((r, i) => {
          const m = meta?.get(r.courseId);
          const name = m?.name ?? r.courseName ?? t('discover.unknownCourse', 'Course');
          const open = openId === r.courseId;
          const toggle = () => setOpenId(open ? null : r.courseId);
          return (
            <div
              key={r.courseId}
              style={{
                borderBottom: i === shown.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
              }}
            >
              {/* NO BUTTON INSIDE A BUTTON (§S2.8). The row is a div carrying
                  role="button", tabIndex and Enter/Space; the faces, the names
                  and the "see all" action inside it stay REAL buttons, each
                  stopping propagation so a name tap navigates without toggling. */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    toggle();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                {/* §S1.2 — NO RANK NUMBER. With three rows tied at one or two
                    rounds it was decoration, and it invited a member to read a
                    contest into a list of places people happened to play. The
                    ORDER is unchanged (§S1.3); only the badge is gone. */}
                <CourseImageFallback
                  courseId={r.courseId}
                  courseName={name}
                  imageUrl={m?.imageUrl}
                  initialsSize={13}
                  pending={thumbPending}
                  style={{ width: 52, height: 52, borderRadius: 13, flexShrink: 0 }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  {/* TWO LINES, NOT A TRUNCATION: the parenthetical on a
                      two-course club is the only thing telling the two apart. */}
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: A.INK,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                    }}
                  >
                    {name}
                  </span>
                  {/* §S1.4 — THE META LINE: region, then the round count,
                      then the movement marker. "KENT · 11 ROUNDS · ▲6". The
                      count is CONTEXT HERE, NOT A SCORE — that is the whole
                      point of moving it off the right-hand figure. */}
                  <span
                    style={{
                      ...LABEL,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 9,
                      color: A.DIM,
                      marginTop: 4,
                      minWidth: 0,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {m?.region ? `${m.region} \u00B7 ` : ''}
                      {/* §S4.2 — A PLURAL RULE, NEVER A CONCATENATION: i18next
                          count pluralisation, so "1 round" / "11 rounds" and
                          every language's own rule both work. */}
                      {t('discover.mostPlayedRoundCount', '{{count}} round', {
                        count: r.count,
                      })}
                    </span>
                    {/* §S1.6 — THE MOVEMENT MARKER KEEPS ITS EXISTING TONES. It
                        is the one genuinely comparative thing on the header. */}
                    <MoveMark row={r} t={t} />
                  </span>
                </span>
                {/* §S1.5 — "PLAYED TO" IS PROMOTED: 19px / 800 on the right of
                    the header with an 8px label beneath. It is the row's
                    HEADLINE FIGURE, because it is the only figure on the row
                    that describes the GOLF (§S0.3). A course with no comparable
                    scored round this week renders neither figure nor label. */}
                {r.avgToPar != null && (
                  <span style={{ flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
                    <span
                      style={{
                        ...NUMF,
                        display: 'block',
                        fontSize: 19,
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        color: INK,
                      }}
                    >
                      {formatToPar(r.avgToPar)}
                    </span>
                    <span
                      style={{
                        ...LABEL,
                        display: 'block',
                        fontSize: 8,
                        color: FAINT,
                        marginTop: 4,
                      }}
                    >
                      {t('discover.mostPlayedPlayedToLabel', 'Played to')}
                    </span>
                  </span>
                )}
                {/* WITHOUT IT NOTHING SAYS THE ROW OPENS (§S2.2). */}
                <ChevronDown
                  size={14}
                  strokeWidth={2.4}
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    color: A.DIM,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </div>

              {/* §S3.2 — THE COLLAPSED ROW IS JUST THE HEADER: thumbnail, name,
                  meta line, played-to, chevron. Shorter than what shipped. */}
              {open && (
                <MemberBoard
                  row={r}
                  viewerId={viewerId}
                  onOpenMember={openMember}
                  onSeeAllAtCourse={() => onRowPress(r)}
                />
              )}
            </div>
          );
        })}

      </div>


    </section>
  );
}

export default MostPlayedLeaderboard;
