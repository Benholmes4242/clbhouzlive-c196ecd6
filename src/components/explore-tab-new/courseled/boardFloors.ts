import type { BoardKey } from './boardFilters';

/**
 * WHY A MEMBER HAS NO QUALIFYING ROUND, one sentence per board, each naming
 * the one thing they can change. A plain-English rendering of
 * public.board_qualifies. That SQL is NOT in this repo: if the floors change
 * in the database, this file will not know — update it by hand.
 * THE RANKING BOARDS HAVE NO FLOORS. board_qualifies was changed on 27
 * October 2026 so stableford, birdies and improved include every round that
 * carries a points, birdies or handicap-movement value: they only sort. Those
 * three therefore read the same entry line as recent, gross, topar and net.
 * Only the four feat boards — ace, albatross, eagle and clean_card — still
 * require the event itself.
 * board_pool already restricts to 18-hole rounds, so the scoring boards'
 * par guard checks course data, never the member's card; hence "a round in
 * this window", not "a complete card".
 */
const NO_ROUND = { i18n: 'amateur.board.floor.noRound', label: "You haven't posted a round in this window." };
export const BOARD_FLOOR_COPY: Record<BoardKey, { i18n: string; label: string }> = {
  recent: NO_ROUND,
  gross: NO_ROUND,
  topar: NO_ROUND,
  /* A round with no net row (separate table) cannot be told apart client-side. */
  net: NO_ROUND,
  /* No floor: these three rank every round that carries the value they sort on. */
  stableford: NO_ROUND,
  birdies: NO_ROUND,
  improved: NO_ROUND,
  ace: { i18n: 'amateur.board.floor.ace', label: 'You need a hole in one in this window.' },
  albatross: { i18n: 'amateur.board.floor.albatross', label: 'You need an albatross in this window.' },
  eagle: { i18n: 'amateur.board.floor.eagle', label: 'You need an eagle in this window.' },
  clean_card: { i18n: 'amateur.board.floor.cleanCard', label: 'You need a bogey-free round in this window.' },
};
