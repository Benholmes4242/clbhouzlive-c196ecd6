import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, Trophy } from 'lucide-react';

import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedPlayer, MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
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
  /**
   * A TAP ON A PLAYER'S ROW OPENS THAT ROUND'S SCORECARD. The row carries the
   * score id of the exact round the board is showing (their best at this course
   * this week), so the sheet and the board can never disagree. The FACE still
   * opens the member's profile (§S2.7) — a board row is about the round, an
   * avatar is about the person. Omitted, the row falls back to the profile.
   */
  onPlayerPress?: (player: MostPlayedPlayer) => void;
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

/* OVERTURNED (BRIEF_MOST_PLAYED_COUNTS_AND_SCROLL §2). The rule was:
 * "Beyond twelve the expansion navigates instead of growing (§S2.5, unchanged)"
 *   const LIST_CAP = 12;
 * NEW RULE: EVERY RESOLVED PLAYER IS RENDERED. The list carries a MAX HEIGHT of
 * a whole number of rows and scrolls inside it.
 * WHY THE OLD OBJECTION NO LONGER APPLIES: §S2.5 refused an internal scroller
 * because a vertical scroller inside a vertically scrolling page CHAINS — a
 * finger that lands on the list scrolls the list and the page feels stuck.
 * `overscroll-behavior: contain` on the scroller stops the chaining at the
 * list's own boundary, which is the whole difference. One property.
 * NOTE: nothing was ever truncated by twelve in current data — the list is
 * PEOPLE (one entry per distinct member, §S1.4) and the count is ROUNDS. */

/** §2 — a whole number of rows, so a partial row shows there is more. */
const BOARD_ROW_H = 43;
const BOARD_MAX_ROWS = 8.5;
const BOARD_MAX_H = Math.round(BOARD_ROW_H * BOARD_MAX_ROWS);

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

/* BRIEF_COURSE_CARD_REGION_AND_BEST overturns the old rule that removed the
 * collapsed BEST fact. It is intentionally descriptive, not interactive: the
 * whole collapsed header remains the disclosure target, and the same round is
 * available as an individual target after expansion. Gross, to-par and member
 * name must all come from players[0]; bestGross can belong to an unresolved
 * profile and must never be attributed to this resolved member. */

/**
 * §S2 — THE TOURNAMENT BOARD.
 *
 *   position | avatar | name over home club | to-par | gross
 *
 * IT NOW SCROLLS INTERNALLY (§2, BRIEF_MOST_PLAYED_COUNTS_AND_SCROLL). The old
 * rule read: "a scrollable panel inside a scrolling page is a real fault on a
 * phone: a finger that lands on the list scrolls the list instead of the page,
 * and a member cannot tell why the page stopped moving." That fault is real and
 * is prevented by `overscroll-behavior: contain`, which stops the scroll chain
 * at the list's boundary; a bottom fade says there is more below.
 *
 * A MEMBER WHO PLAYED TWICE APPEARS ONCE with their BEST round (§S2.9) — the
 * hook already collapses them by (course, member) minimum gross.
 */
function MemberBoard({
  row,
  viewerId,
  onOpenMember,
  onOpenRound,
  onSeeAllAtCourse,
}: {
  row: MostPlayedRow;
  viewerId: string | null;
  onOpenMember: (userId: string) => void;
  /** Opens the scorecard bottom sheet for that player's round. */
  onOpenRound: (player: MostPlayedPlayer) => void;
  onSeeAllAtCourse: () => void;
}) {
  const { t } = useTranslation('courses');
  /** §2 — NO CAP. Every resolved player is rendered. */
  const listed = row.players;
  const scrolls = listed.length > BOARD_MAX_ROWS;
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  /** The fade hides itself at the end, so it never reads as a cut-off edge. */
  const [atEnd, setAtEnd] = useState(false);
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  };
  if (listed.length === 0) return null;

  return (
    <div style={{ paddingBottom: 10, position: 'relative' }}>
      <div
        ref={scrollerRef}
        onScroll={scrolls ? onScroll : undefined}
        style={
          scrolls
            ? {
                maxHeight: BOARD_MAX_H,
                overflowY: 'auto',
                // §1 — THE X AXIS IS LOCKED. With overflow-y:auto the spec
                // promotes a visible x axis to auto, which is where the
                // sideways drag came from.
                overflowX: 'hidden',
                // THE ONE PROPERTY §S2.5's OBJECTION TURNED ON: the scroll
                // chain stops here, so a swipe that begins on the page keeps
                // moving the page and the page can never feel stuck.
                overscrollBehavior: 'contain',
                // No horizontal swipe on the list can start a back gesture.
                overscrollBehaviorX: 'none',
                WebkitOverflowScrolling: 'touch',
                // §2 — THE CAUSE: the rows used to bleed with margin 0 -14px,
                // which made the CONTENT 28px wider than this box (14px of it
                // reachable to the right, taking the gross with it). The bleed
                // now lives on the scroller, so rows fit exactly and nothing
                // is clipped once x is hidden.
                margin: '0 -14px',
              }
            : undefined
        }

      >
      {listed.map((p) => {
        const isViewer = viewerId != null && p.userId === viewerId;
        const under = p.toPar != null && p.toPar < 0;
        return (
          <div
            key={p.userId}
            /* THE WHOLE ROW OPENS THE SCORECARD. Not a <button>: the face inside
               is a real button and a button inside a button is invalid HTML —
               WebKit commonly never delivers the inner tap. */
            role="button"
            tabIndex={0}
            onClick={() => onOpenRound(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                onOpenRound(p);
              }
            }}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              // FULL WIDTH (§S2.3): the tint bleeds to the card's own padding
              // rather than starting at a thumbnail-width indent.
              // The bleed lives on the scroller when the list scrolls, so the
              // row must NOT widen past it or hiding x would clip the gross.
              margin: scrolls ? 0 : '0 -14px',
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
            {/* THE NAME IS NOT ITS OWN CONTROL ANY MORE: the row it sits in
                opens the scorecard, and the face beside it opens the profile.
                Two different destinations from one line of text was the fault. */}
            <div
              style={{
                // ALL REMAINING SPACE (§S2.3).
                flex: 1,
                minWidth: 0,
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  // §S2.8 — VIEWER NAME MATCHES THE HONOURS BOARD SHEET.
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                  color: isViewer ? A.AMBER_DEEP : INK,
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
            </div>
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
      </div>
      {/* §2 — THE BOTTOM FADE: transparent to the card's own colour, and it
          removes itself once the list is at its end so it never looks like a
          cut edge. Not a scrollbar. */}
      {scrolls && !atEnd && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -14,
            right: -14,
            bottom: 10,
            height: 28,
            pointerEvents: 'none',
            background: `linear-gradient(to bottom, rgba(255,255,255,0), ${A.PANEL})`,
          }}
        />
      )}
      {/* THE SEE-ALL ROW STAYS (§2): it opens the course's own sheet, which is
          a different destination from a longer list. */}
      {onSeeAllAtCourse && (
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
          {t('discover.mostPlayedSeeAllAtCourse', 'Visit this course')}
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
  onPlayerPress,
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

  /* NO SCORE ID (an untracked round, or one the read could not resolve) FALLS
     BACK TO THE PROFILE rather than opening an empty sheet. */
  const openRound = (p: MostPlayedPlayer) => {
    if (p.scoreId && onPlayerPress) onPlayerPress(p);
    else openMember(p.userId);
  };

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
          {/* BRIEF_DISCOVER_ORDER_AND_LABELS §2 — the heading NAMES THE RANKING
              again, on 'discover.mostPlayed'.
              COUNTER-ARGUMENT ON RECORD (the old §S1.1 rule this overturns):
              "the heading DESCRIBES WHAT THE SECTION SHOWS rather than asserting
              a ranking that 11 / 2 / 1 / 1 does not support."
              BEN HEARD IT AND CHOSE THIS: "Most played courses this week" names
              the SET the section contains, it does not claim each row is heavily
              played; and the old heading did not tell anyone what the section
              was. Do not silently reverse this again.
              'discover.whereTheyPlayed' is now unused and STAYS in all six
              locale files, the treatment §S4.1 gave the key it replaced. */}
          {t('discover.mostPlayed', 'Courses played this week')}
        </Eyebrow>
      )}

      <div style={{ fontFamily: SANS }}>
        {shown.map((r) => {
          const m = meta?.get(r.courseId);
          const name = m?.name ?? r.courseName ?? t('discover.unknownCourse', 'Course');
          const bestPlayer = r.players[0];
          const open = openId === r.courseId;
          const toggle = () => setOpenId(open ? null : r.courseId);
          return (
            /* CORRECTION_MOST_PLAYED_COURSE_HEADERS §S1 — ONE CARD PER COURSE,
               10px apart, NOT four rows divided inside one panel. Each course is
               its own board with its own expansion, and an object that opens and
               closes independently should be its own object (§S1.2). The
               dividers BETWEEN courses are gone; the gap separates them (§S1.4).
               The 14px horizontal padding stays on the card so the expanded
               board's `margin: 0 -14px` bleed lands exactly where it did. */
            <div
              key={r.courseId}
              style={{
                background: A.PANEL,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(11,15,20,0.05)',
                marginBottom: 10,
                padding: '0 14px',
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
                      fontSize: 14,
                      fontWeight: 700,
                      color: A.INK,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                    }}
                  >
                    {name}
                  </span>
                   {/* BRIEF_COURSE_CARD_REGION_AND_BEST §1 — REGION OWNS THIS
                       LINE. It deliberately declares every type property rather
                       than spreading LABEL, whose uppercase transform previously
                       changed sentence-case database values such as "Kent". */}
                   {m?.region && (
                     <span
                       style={{
                         display: 'block',
                         marginTop: 2,
                         minWidth: 0,
                         fontSize: 11,
                         fontWeight: 700,
                         lineHeight: 1.2,
                         letterSpacing: 0,
                         color: A.INK,
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap',
                       }}
                     >
                       {m.region}
                     </span>
                   )}

                   {/* THE THIRD LINE IS COUNTS + MOVEMENT ONLY. The count dot,
                       pluralisation and players.length source are unchanged.

                      SUPERSEDED (BRIEF_MOST_PLAYED_META_LINE): §S2.2 recorded
                      "the round count is A.MID and the region is A.FAINT on the
                      same line, on purpose. One is a fact and one is a caption."
                      That reasoning was sound — it fixed a line where BOTH were
                      dim grey and the count vanished — but it is out of date.
                      The same problem is now solved the other way: the WHOLE
                      line sits in A.INK at ONE size (11 / 700), matching the
                      treatment the leader chips on this same page took in
                      BRIEF_BAND_TILE_TYPE_SCALE. Two sections on one page
                      agreeing beats each solving one problem differently.
                       The region now sits alone above this line. */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 2,
                      minWidth: 0,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {/* §S4.2 — A PLURAL RULE, NEVER A CONCATENATION: i18next
                        count pluralisation, so "1 round" / "11 rounds" and
                        every language's own rule both work. */}
                    <span
                      style={{
                        ...NUMF,
                        flex: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: A.INK,
                        marginRight: 7,
                      }}
                    >
                      {t('discover.mostPlayedRoundCount', '{{count}} round', {
                        count: r.count,
                      })}
                    </span>

                    {/* §1 — THE GOLFER COUNT, a SECOND FACT ON THE SAME LINE in
                        the same 11 / 700 / A.INK and the same dot separator.
                        IT IS `players.length`, NOT `members`: members counts ids
                        the board cannot render (deleted account, RLS — §S4.4),
                        so it would reintroduce the very mismatch this fixes.
                        "11 rounds · 9 golfers" reads as two golfers who played
                        twice, not a board missing two entries. */}
                    {r.players.length > 0 && (
                      <>
                        <span
                          aria-hidden
                          style={{
                            flex: 'none',
                            width: 2.5,
                            height: 2.5,
                            borderRadius: '50%',
                            background: GHOST,
                            marginRight: 7,
                          }}
                        />
                        <span
                          style={{
                            ...NUMF,
                            flex: 'none',
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: A.INK,
                            marginRight: 7,
                          }}
                        >
                          {t('discover.mostPlayedGolferCount', '{{count}} golfer', {
                            count: r.players.length,
                          })}
                        </span>
                      </>
                    )}

                    {/* §S1.6 / §S2.3 — THE MOVEMENT MARKER KEEPS ITS EXISTING
                        TONES: green on a rise, amber on NEW, ghost on LEVEL. */}
                    <MoveMark row={r} t={t} />
                  </span>

                   {/* §2 — A SINGLE-SOURCE BEST FACT. Do not substitute
                       r.bestGross: that may belong to a member whose profile did
                       not resolve, while every value and the name here belong to
                       players[0]. No player means no line and no reserved space. */}
                   {bestPlayer && (
                     <span
                       style={{
                         display: 'flex',
                         alignItems: 'baseline',
                         gap: 6,
                         minWidth: 0,
                         marginTop: 6,
                         paddingTop: 6,
                         borderTop: `1px solid ${A.HAIRLINE}`,
                       }}
                     >
                       <span
                         style={{
                           flex: 'none',
                           fontSize: 9,
                           fontWeight: 700,
                           lineHeight: 1,
                           letterSpacing: '0.14em',
                           color: FAINT,
                         }}
                       >
                         BEST
                       </span>
                       <span
                         style={{
                           flex: 'none',
                           fontSize: 12,
                           fontWeight: 700,
                           lineHeight: 1.2,
                           color: A.INK,
                           fontVariantNumeric: 'tabular-nums lining-nums',
                         }}
                       >
                         {bestPlayer.gross != null ? formatNumber(bestPlayer.gross) : ''}
                       </span>
                       <span
                         style={{
                           flex: 'none',
                           fontSize: 10,
                           fontWeight: 700,
                           lineHeight: 1.2,
                           color:
                             bestPlayer.toPar != null && bestPlayer.toPar < 0
                               ? TOPAR_RED
                               : MID,
                           fontVariantNumeric: 'tabular-nums lining-nums',
                         }}
                       >
                         {bestPlayer.toPar != null ? formatRelInt(bestPlayer.toPar) : ''}
                       </span>
                       <span
                         style={{
                           flex: 1,
                           minWidth: 0,
                           fontSize: 12,
                           fontWeight: 700,
                           lineHeight: 1.2,
                           color: A.INK,
                           overflow: 'hidden',
                           textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap',
                         }}
                       >
                         {bestPlayer.name}
                       </span>
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
                        // CORRECTION §S3.2 — -0.04em (found at -0.03em).
                        letterSpacing: '-0.04em',
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
                        letterSpacing: '0.14em',
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
                  size={15}
                  strokeWidth={2.4}
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    // CORRECTION §S3.4 — GHOST, and it sits after played-to.
                    color: GHOST,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </div>
              {open && <div style={{ height: 1, margin: '0 -14px', background: A.BORDER }} />}

              {/* The BEST line is part of this disclosure header and has no
                  nested target. A tap anywhere here expands the board. */}
              {/* §S1.5 — the divider between a header and ITS OWN expanded
                  board stays: that one is inside a single object. */}
              {open && (
                <MemberBoard
                  row={r}
                  viewerId={viewerId}
                  onOpenMember={openMember}
                  onOpenRound={openRound}
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
