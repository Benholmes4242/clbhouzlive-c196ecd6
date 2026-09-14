import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StandoutTile } from '@/components/explore-tab-new/courseled/StandoutTile';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ShelfShell } from './ExploreShells';
import { ExploreShelf } from './ExploreShelf';
import { railCaptionDate } from './exploreCopy';
import { standingOrdinal } from './ordinal';
import { coursePlaceLine } from './placeLine';
import {
  readStandingBoard,
  writeStandingBoard,
  type StandingBoard,
} from './standingBoard';
import { effectiveStandingBoard, useStandingBoards } from './useStandingBoards';
import { useViewerIdentity } from './useViewerIdentity';
import { useViewerStanding, type StandingRow } from './useViewerStanding';


/**
 * "WHERE YOU STAND" (BRIEF_EXPLORE_MAGAZINE §2b, PHASE B1).
 *
 * One tile per course the viewer has played, ordered by the board's most recent
 * change, so what just moved is first. The figure is the viewer's rank ordinal
 * and the unit is the REAL field size (get_board_page's pool_members, not a
 * paged count) — open the course Champions tab and the two must agree.
 *
 * MOVEMENT IS NOT A SCORE. A figure with an arrow reports direction: green is
 * better, red is worse. That is a different scale from a to-par figure, where
 * under par is red. The movement red here is deliberately NOT the to-par red
 * (#E24B3F) — see MOVEMENT below.
 *
 * NO REFERENCE, NO CHIP. delta null (first-ever visit, or a board with nothing
 * at or before the stamp) and delta 0 (the board did not move) both draw
 * nothing. An unresolved reference is never rendered as "no change".
 *
 * EMPTY RENDERS NOTHING. A viewer with no played courses gets no shelf at all
 * in the All view — no heading over nothing. The Scores connect sentence is
 * Phase B2 and is not smuggled in here.
 *
 * THE BOARD SELECTOR (Ben's ruling). Net for everyone by default, five boards,
 * no handicap threshold — the reasoning lives in standingBoard.ts. The
 * HEADING reads only "Where you stand"; the selector in the heading's right
 * slot already names the active board, so repeating it in the heading would be
 * the same word twice. The tiles never repeat the board either, so their
 * subline stays about the course. The selector pushes SEE ALL beneath the cards
 * in the uppercase foot convention. The see-all sheet reads the same selection.
 *
 * THE CONSEQUENCE CARDS DO NOT FOLLOW THIS SELECTOR and must not be made to:
 * a card is a dated statement about a round that happened, while this shelf is
 * a live view. See standingBoard.ts and rankCards.ts.
 */

/** §2b tile geometry — one fixed size for the whole rail. */
const TILE = { w: 206, h: 118 };
/** How many tiles the rail draws before the see-all carries the rest. */
const RENDERED = 12;

/**
 * MOVEMENT TOKENS (§2b). CONTRADICTION, REPORTED: the existing over-photo
 * movement green in StandoutTile's delta chip is #4ADE80. The brief names
 * #57E69A / #F0655A for this shelf, so those are used and the divergence is
 * filed rather than silently "corrected" either way. The red is a full step
 * away from TOPAR_UNDER_DARK #E24B3F, which is the point: a member must never
 * read a rank drop as an under-par score.
 */
const MOVEMENT = { up: '#57E69A', down: '#F0655A' } as const;

function MovementChip({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span
      style={{
        ...NUMF,
        fontFamily: SANS,
        fontSize: 11,
        color: up ? MOVEMENT.up : MOVEMENT.down,
        whiteSpace: 'nowrap',
      }}
    >
      {up ? '\u2191' : '\u2193'}
      {Math.abs(delta)}
    </span>
  );
}

function useStandingCopy() {
  const { t, i18n } = useTranslation('courses');
  return useMemo(
    () => ({
      heading: t('amateur.stream.shelf.standing', 'Where you stand'),
      /**
       * THE BOARD NAMES, used ONLY by the dropdown. The heading no longer
       * appends the board name (Ben: "the same word twice in one row").
       *
       * EVERY LABEL NAMES A ROUND, because every one of these boards ranks a
       * SINGLE ROUND. The Champions tab ranks careers and has a category
       * called "Most birdies" meaning a career total at the course; if this
       * dropdown said "Most birdies" too, a member could not tell the two
       * claims apart, and they are different numbers. "Biggest handicap cut"
       * has no Champions counterpart at all and says what it measures.
       *
       * RETIRED FOR PHASE E: `amateur.stream.standing.board` (the legacy
       * board-name-in-heading key) and `boardNet` / `boardGross` (the short
       * two-board names, now ambiguous against Champions). All three are kept
       * in the six locale files and are no longer read by code.
       */
      boardName: (board: StandingBoard) => {
        switch (board) {
          case 'net':
            return t('amateur.stream.standing.boards.net', 'Lowest net round');
          case 'stableford':
            return t('amateur.stream.standing.boards.stableford', 'Best stableford round');
          case 'birdies':
            return t('amateur.stream.standing.boards.birdies', 'Most birdies in a round');
          case 'improved':
            return t('amateur.stream.standing.boards.improved', 'Biggest handicap cut');
          case 'topar':
          default:
            return t('amateur.stream.standing.boards.topar', 'Lowest gross round');
        }
      },
      pickBoard: t('amateur.stream.standing.pickBoard', 'Change board'),
      /* ERRORED IS NOT EMPTY. A read that failed says so; it never renders as
         a member with no standing, and never as nothing at all. */
      unreadable: t(
        'amateur.stream.standing.unreadable',
        'Your standing could not be loaded.',
      ),
      retry: t('amateur.stream.standing.retry', 'Try again'),
      unit: (count: number) => t('amateur.stream.standing.of', 'of {{count}}', { count }),
      lastChange: (when: string) => t('amateur.stream.standing.lastChange', 'last change {{when}}', { when }),
      seeAll: (count: number) => t('amateur.stream.seeAllCourses', 'See all {{count}} courses', { count }),
      you: t('amateur.stream.you', 'You'),
      locale: i18n.language || 'en',
    }),
    [t, i18n.language],
  );
}

/**
 * THE SUBLINE IS ABOUT THE COURSE, NOT THE BOARD (Ben's ruling). The heading
 * already names the board, so repeating "Lowest gross" on twelve tiles said
 * the same thing thirteen times. The photo overlay already names the region, so
 * repeating it here said the same thing twice. What is left is when this
 * board last moved; when it never has, the line stays empty.
 */
function sublineFor(row: StandingRow, copy: ReturnType<typeof useStandingCopy>): string {
  const when = railCaptionDate(row.last_change_at);
  return when ? copy.lastChange(when) : '';
}

/**
 * THE BOARD SELECTOR. Up to five options, so this is a flat menu and not a
 * native select: it has to wear the dark surface and the flat row convention.
 * It is a CHOICE and reads like one - the current board is stated, the panel
 * marks the selected row, and dismissing changes nothing.
 *
 * THE OPTIONS ARE THE MEMBER'S OWN. `options` carries only boards where this
 * member holds a course with a qualified field of 2 or more, so there is
 * nothing greyed out: a disabled row is a promise the app cannot keep. A member
 * with a single available board gets no control at all.
 */
function BoardSelector({
  board,
  options,
  label,
  ariaLabel,
  nameFor,
  onPick,
}: {
  board: StandingBoard;
  options: readonly StandingBoard[];
  label: string;
  ariaLabel: string;
  nameFor: (b: StandingBoard) => string;
  onPick: (b: StandingBoard) => void;
}) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!hostRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  return (
    <div ref={hostRef} style={{ position: 'relative', fontFamily: SANS }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          border: 0,
          background: 'transparent',
          padding: 0,
          color: A.MUTE,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {label}
        <span aria-hidden style={{ fontSize: 9, lineHeight: 1 }}>{'\u25BE'}</span>
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 5,
            minWidth: 128,
            background: '#1B1E27',
            border: `0.5px solid ${A.HAIRLINE}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {options.map((b, i) => (
            <button
              key={b}
              type="button"
              role="menuitemradio"
              aria-checked={b === board}
              onClick={() => {
                setOpen(false);
                if (b !== board) onPick(b);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                border: 0,
                borderTop: i === 0 ? undefined : `0.5px solid ${A.HAIRLINE}`,
                background: 'transparent',
                padding: '10px 12px',
                color: b === board ? A.INK : A.MUTE,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: b === board ? 700 : 600,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {nameFor(b)}
              {b === board ? <span aria-hidden>{'\u2713'}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StandingShelf({ viewerId, pos }: { viewerId: string | undefined; pos: number }) {
  const navigate = useNavigate();
  const copy = useStandingCopy();
  /* THE SELECTION HOLDS FOR THE SESSION, PER MEMBER: seeded from
     sessionStorage on mount so a scroll away and back does not reset it, and
     written on every pick. Next visit starts at net again. */
  const [board, setBoard] = useState<StandingBoard>(() => readStandingBoard(viewerId));
  useEffect(() => setBoard(readStandingBoard(viewerId)), [viewerId]);
  const pickBoard = useCallback(
    (next: StandingBoard) => {
      setBoard(next);
      writeStandingBoard(viewerId, next);
      analyticsEvents.track('amateur_standing_board_picked', { board: next });
    },
    [viewerId],
  );
  /* WHICH BOARDS THIS MEMBER HAS. Only boards with a course whose qualified
     field is 2 or more are offered, and the remembered selection is replaced
     rather than requested when the member does not have it - the shelf never
     asks for a board it has just said is unavailable. */
  const availability = useStandingBoards(viewerId);
  const askedBoard = effectiveStandingBoard(board, availability.boards);
  /* A HOLD, NOT A GUESS: until availability has settled the standing read
     stays disabled, so a member never sees one board's ranks replaced by
     another's a frame later. */
  const standing = useViewerStanding(availability.isFetched ? viewerId : undefined, askedBoard);
  /* The heading names the board the ROWS are, not the one that was asked for. */
  const shownBoard = standing.board;
  /* The tiles are all the VIEWER's, so the avatar is the viewer's own photo,
     read from user_profiles — never a board row's nearest photo field. */
  const { identity } = useViewerIdentity(viewerId);

  const [sheetOpen, setSheetOpen] = useState(false);

  const tiles = useMemo(() => standing.rows.slice(0, RENDERED), [standing.rows]);

  /**
   * THE TAP OPENS THE COURSE AND CLAIMS NO PARITY (Ben's ruling SS4).
   *
   * It lands on the Champions tab's OWN DEFAULT CATEGORY and passes no `?cat=`.
   * No Champions category measures what these boards measure: Champions ranks
   * CAREERS at the course, these boards rank single ROUNDS, and the pools are
   * not the same either. Measured on production: on gross - the one case that
   * looked cheaply correct - the shelf and Champions disagree on 4 of this
   * member's 31 courses (shelf 1st / Champions 2nd at Royal Portrush and
   * Westerham, 3rd / 4th at Parkstone and Royal Blackheath). Deep linking would
   * therefore hand a member one rank on the shelf and a different rank on the
   * screen they tapped into, which is the two-readers fault. Do NOT add a
   * `?cat=` here, and do NOT add categories to Champions to close the gap.
   */
  const open = (row: StandingRow) => {
    analyticsEvents.track('amateur_standing_tile_tapped', {
      rank: row.rank_now,
      delta: row.delta,
      board: shownBoard,
    });
    rememberAmateurScroll();
    setSheetOpen(false);
    navigate(`/courses/${row.course_id}?tab=champions`);
  };

  /* A HOLD, NOT A GUESS, while either read is in flight — the rail's own
     shape. Availability settles first, so the shelf never draws one board's
     ranks under another board's name. */
  if (!availability.isFetched || !standing.isFetched) {
    return <ShelfShell tileW={TILE.w} tileH={TILE.h} />;
  }
  /* ERRORED IS NOT EMPTY (the fault that hid this shelf). A read that FAILED
     says so, with the plain heading and a retry; only a genuinely empty answer
     renders nothing, because "no standing" is not a sentence worth a heading. */
  if (standing.unresolved) {
    return (
      <div style={{ fontFamily: SANS, padding: '0 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
          {copy.heading}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: A.MUTE }}>
          {copy.unreadable}
        </div>
        <button
          type="button"
          onClick={() => standing.retry()}
          style={{
            marginTop: 8,
            border: 0,
            background: 'transparent',
            padding: 0,
            color: A.INK,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }
  if (standing.rows.length === 0) return null;

  return (
    <>
      <ExploreShelf
        heading={copy.heading}
        /* ONE BOARD IS NOT A CHOICE. A member with a single available board
           gets the plain heading and no control that cannot change anything. */
        headingRight={
          availability.boards.length > 1 ? (
            <BoardSelector
              board={shownBoard}
              options={availability.boards}
              label={copy.boardName(shownBoard)}
              ariaLabel={copy.pickBoard}
              nameFor={copy.boardName}
              onPick={pickBoard}
            />
          ) : undefined
        }
        onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'standing', pos })}
        /* SEE ALL MOVED BENEATH THE CARDS because the selector owns the right
           slot. Uppercase foot convention, and only when there is more than the
           rail shows: the member with one course sees no control. */
        foot={
          standing.total > tiles.length ? (
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('amateur_standing_see_all_opened', { board: shownBoard });
                /* A SHEET, NOT A ROUTE: the member is coming back to the stream. */
                setSheetOpen(true);
              }}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                color: A.MUTE,
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {copy.seeAll(standing.total)}
            </button>
          ) : null
        }
      >
        {tiles.map((row) => (
          <div key={row.course_id} style={{ flex: `0 0 ${TILE.w}px`, width: TILE.w }}>
            <StandoutTile
              courseId={row.course_id}
              courseName={row.course_name}
              imageUrl={row.image_url}
              region={coursePlaceLine({ region: row.region, subCountry: row.sub_country })}
              photo={TILE.h}
               figure={standingOrdinal(row.rank_now, copy.locale)}
              unit={copy.unit(row.field_now)}
              /* DATE BELONGS IN THE CAPTION. The photo already carries rank,
                 course and region; its top-right corner stays empty. */
              whenLabel=""
              who={copy.you}
              isOwn
              avatarUrl={identity?.photoUrl ?? null}
              avatarUserId={viewerId ?? null}

              railCaptionLine={
                <>
                  <span style={{ fontSize: 11, lineHeight: 1, color: A.MUTE }}>
                    {sublineFor(row, copy)}
                  </span>
                  {row.delta != null && row.delta !== 0 ? (
                    <span style={{ marginLeft: 'auto' }}><MovementChip delta={row.delta} /></span>
                  ) : null}
                </>
              }
              onPress={() => open(row)}
            />
          </div>
        ))}
      </ExploreShelf>

      {/* BRIEF_SHEET_SCROLL §1 — scrollBody: this sheet hands over a complete
          list and owned no scroll container, so the rows past the cap were
          unreachable on a device. */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} maxHeight="75dvh" scrollBody>
        <div style={{ fontFamily: SANS, padding: '4px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
              {copy.heading}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: A.MUTE }}>
              {standing.total}
            </span>
          </div>
          {standing.rows.map((row) => (
            <button
              key={row.course_id}
              type="button"
              onClick={() => open(row)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                border: 0,
                background: 'transparent',
                padding: '11px 0',
                borderTop: `0.5px solid ${A.HAIRLINE}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ ...NUMF, fontSize: 14, color: A.INK, minWidth: 44 }}>
                 {standingOrdinal(row.rank_now, copy.locale)}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: A.INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.course_name ?? ''}
                </span>
                <span style={{ display: 'block', fontSize: 12, color: A.MUTE }}>
                  {copy.unit(row.field_now)}
                  {' \u00B7 '}
                  {sublineFor(row, copy)}
                </span>
              </span>
              {row.delta != null && row.delta !== 0 ? <MovementChip delta={row.delta} /> : null}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export default StandingShelf;
