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

import { basisLine } from './basisLine';
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
           rows arrive. */
        <div style={{ height: 240 }} aria-hidden />
      ) : total === 0 ? (
        <div style={{ padding: '18px 2px' }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>
            {t('discover.filterBoard.emptyLine', 'Nothing on this board for {{line}}.', {
              line: appliedParts.join(' \u00B7 '),
            })}
          </p>
          {!filtersAreDefault(filters) && (
            <button
              type="button"
              onClick={state.resetFilters}
              style={{
                ...KICKER,
                marginTop: 10,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: A.INK,
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              {t('discover.filterBoard.reset', 'Clear the filter')}
            </button>
          )}
        </div>
      ) : (
        <>
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
          {total > visible.length && (
            <ListTerminalRow
              label={t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit })}
              onPress={() => {
                analyticsEvents.track('amateur_board_see_all_opened', { board, total });
                setSeeAll(true);
              }}
            />
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
    </section>
  );
}
