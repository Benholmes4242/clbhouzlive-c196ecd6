import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BoardRowView, gapText } from '@/components/explore-tab-new/courseled/BoardRows';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { ListTerminalRow } from '@/components/explore-tab-new/courseled/ListTerminalRow';
import { describeFilterParts } from '@/components/explore-tab-new/courseled/GolfThisWeek';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import {
  BOARD_LABELS,
  FEAT_BOARD_KEYS,
  RANKING_BOARD_KEYS,
  boardCountsRounds,
  filtersAreDefault,
  type BoardKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { DISCOVER_FACT, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { RailChips } from '@/components/ui/RailChips';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { FindGolfersSheet } from '@/components/explore-tab-new/FindGolfersSheet';
import { SuggestedGolfersRail } from '@/features/social-suggestions/SuggestedGolfersRail';


import { basisLine } from './basisLine';
import { useCircleSize } from './useCircleSize';
import type { AmateurBoardState } from './useAmateurBoardState';


/**
 * BLOCK 1 - THE LEADERBOARD (BRIEF_AMATEUR_PAGE).
 *
 * THE SAME BOARD, THE SAME RPC, THE SAME ROW. get_board_page still ranks;
 * nothing here re-sorts it, and BoardRowView is the deployed row, so a member
 * reads the identical thing on both surfaces while Discover is still up.
 *
 * CAPPED, WITH A SEE-ALL. Eight positions on the page and the rest behind the
 * sheet - a page of four blocks cannot spend two screens on one of them. The
 * member's own row is PINNED beneath the cut when it falls outside it, with the
 * gap to the leader stated, and that row is the ONLY amber on this block.
 */

/** Eight positions on the page; the see-all sheet holds the remainder. */
const VISIBLE_POSITIONS = 8;

/** §2 — four ranked rows is a leaderboard; fewer is a stated thin result. */
const THIN_FLOOR = 4;

/** One quiet affordance shape for every widen/repair action on this block. */
const QUIET_ACTION = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: A.INK,
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
} as const;

const MEMBER_BOARD_KEYS: readonly BoardKey[] = [...RANKING_BOARD_KEYS, ...FEAT_BOARD_KEYS];


export function AmateurLeaderboardBlock({
  userId,
  state,
  onRowPress,
}: {
  userId: string | undefined;
  state: AmateurBoardState;
  onRowPress: (row: BoardRow) => void;
}) {
  const { t } = useTranslation('courses');
  const [seeAll, setSeeAll] = useState(false);
  const [findGolfers, setFindGolfers] = useState(false);

  /* THE READ IS THE PAGE'S, not this block's - the filter panel states the same
     count, and two reads could disagree. */
  const { board, filters, page, total } = state;

  const rows = page.data?.rows ?? [];
  const visible = useMemo(() => rows.filter((row) => row.pos <= VISIBLE_POSITIONS), [rows]);
  const leader = rows[0] ?? null;
  const mine = useMemo(
    () => (userId ? rows.find((row) => row.user_id === userId) ?? null : null),
    [rows, userId],
  );
  const minePinned = !!mine && !visible.some((row) => row.user_id === mine.user_id);

  /* §3 B — a THIN result is a circle one, and only the circle can be thin for a
     reason the member can act on. The head-count that separates state C from
     state D lives on the page state, so both blocks read one answer. */
  const isCircle = filters.scope === 'circle';
  const thin = isCircle && total > 0 && total < THIN_FLOOR;


  const appliedParts = useMemo(() => describeFilterParts(filters, t as never), [filters, t]);
  const boardTitle = t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label);
  const unit = boardCountsRounds(board)
    ? t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total })
    : t('discover.coursesPlayed.nMembers', '{{count}} members', { count: total });


  return (
    <section style={{ paddingTop: 18, fontFamily: SANS, ...FIGS }}>
      {/* THE COUNT LINE STATES ITS SAMPLE: this block is filtered, news and
          media are not, and that difference is the boundary marker. */}
      <DiscoverSectionHeading title={boardTitle} right={basisLine(unit, filters, t as never)} />

      <RailChips
        options={MEMBER_BOARD_KEYS.map((key) => ({
          id: key,
          label: t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label),
        }))}
        value={board}
        onChange={(next) => state.changeBoard(next as BoardKey)}
        ariaLabel="Board"
        style={{ margin: '0 -14px 12px', padding: '0 14px' }}
      />

      {page.isPending ? (
        /* A HELD HEIGHT, NOT A SPINNER: the blocks below must not jump when the
           rows arrive, and no skeleton is ever left standing. */
        <div style={{ height: 240 }} aria-hidden />
      ) : total === 0 ? (
        /* §6 — the only board that can still be empty is one the MEMBER filtered
           to nothing. The circle can no longer land here: an empty circle is
           widened to Everyone, declared, upstream. An absence is explained. */
        <div style={{ padding: '18px 2px' }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>
            {t('discover.filterBoard.emptyLine', 'Nothing on this board for {{line}}.', {
              line: appliedParts.join(' \u00B7 '),
            })}
          </p>
          {!filtersAreDefault(filters) && (
            <button type="button" onClick={state.resetFilters} style={{ ...QUIET_ACTION, marginTop: 12 }}>
              {t('discover.filterBoard.reset', 'Clear the filter')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* §3 C — THE DECLARED WIDENING. The chips and the count already read
              Everyone; this sentence says who moved them and why. */}
          {state.widened && (
            <p style={{ margin: '0 2px 10px', fontSize: 12, color: A.MUTE, lineHeight: 1.45 }}>
              {t(
                'amateur.board.widenedToEveryone',
                'Nobody in your circle has posted a round in the last fortnight, so this is everyone.',
              )}
            </p>
          )}

          {visible.map((row) => (
            <BoardRowView
              key={`${row.pos}:${row.whs_score_id ?? row.user_id}`}
              row={row}
              board={board}
              isSelf={!!userId && row.user_id === userId}
              onPress={onRowPress}
            />
          ))}
          {minePinned && mine && leader && (
            <div style={{ marginTop: 4 }}>
              <BoardRowView
                row={mine}
                board={board}
                isSelf
                gap={gapText(board, mine, leader, t as never)}
                onPress={onRowPress}
              />
            </div>
          )}

          {/* §3 B — A THIN CIRCLE STAYS THIN AND SAYS SO. The list is NOT topped
              up from outside the circle: mixing pools would make the chips and
              the count untrue. */}
          {thin ? (
            <p style={{ margin: '12px 2px 0', fontSize: 12, color: A.MUTE, lineHeight: 1.45 }}>
              {t('amateur.board.thinCircle', 'Only {{count}} rounds in your circle this fortnight.', {
                count: total,
              })}
            </p>
          ) : (
            total > visible.length && (
              <ListTerminalRow
                label={t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit })}
                onPress={() => {
                  analyticsEvents.track('amateur_board_see_all_opened', { board, total });
                  setSeeAll(true);
                }}
              />
            )
          )}

          {/* §3 — THE SCORES COME FIRST AND THE REMEDY AFTER. States B and C get
              the rail; state D gets the one line that explains what a circle is
              for, because nothing was widened for them. */}
          {(thin || state.widened) && <SuggestedGolfersRail surface="explore_board" />}

          {thin && (
            <p style={{ margin: '14px 2px 0', fontSize: 12, color: A.MUTE, lineHeight: 1.45 }}>
              {t('amateur.board.orBeyond', 'Or look beyond your circle.')}{' '}
              <button type="button" onClick={state.seeEveryone} style={{ ...QUIET_ACTION, fontSize: 12 }}>
                {t('amateur.board.seeEveryone', 'See everyone')} &rsaquo;
              </button>
            </p>
          )}

          {state.hasCircle === false && !state.widened && (
            <p style={{ margin: '14px 2px 0', fontSize: 12, color: A.MUTE, lineHeight: 1.45 }}>
              {t('amateur.board.noCircleYet', 'Follow golfers you know and this becomes your circle.')}{' '}
              <button
                type="button"
                onClick={() => setFindGolfers(true)}
                style={{ ...QUIET_ACTION, fontSize: 12 }}
              >
                {t('amateur.board.findGolfers', 'Find golfers')} &rsaquo;
              </button>
            </p>
          )}
        </>
      )}



      <BoardSeeAllSheet
        open={seeAll}
        onClose={() => setSeeAll(false)}
        userId={userId}
        board={board}
        filters={filters}
        appliedParts={appliedParts}
        title={boardTitle}
        onRowPress={onRowPress}
      />

      {/* C2 — the repair action for the cold start, the same sheet the rest of
          the app uses to add golfers. */}
      <FindGolfersSheet open={findGolfers} onClose={() => setFindGolfers(false)} />

    </section>
  );
}
