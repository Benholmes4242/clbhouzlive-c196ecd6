import type { BoardKey } from './boardFilters';

/**
 * THE ONE CLIENT COPY OF EACH BOARD'S FLOOR, in words. public.board_qualifies
 * holds the real predicates; the client never re-applies them, it only NAMES
 * them when telling a member why they have no qualifying round. If a floor
 * changes in SQL, change its sentence here and nowhere else.
 */
export const BOARD_FLOOR_COPY: Record<BoardKey, { i18n: string; label: string }> = {
  recent: { i18n: 'amateur.board.floor.recent', label: 'a round in this window' },
  gross: { i18n: 'amateur.board.floor.complete', label: 'a complete card' },
  topar: { i18n: 'amateur.board.floor.complete', label: 'a complete card' },
  net: { i18n: 'amateur.board.floor.complete', label: 'a complete card' },
  stableford: { i18n: 'amateur.board.floor.stableford', label: '36 points or better' },
  improved: { i18n: 'amateur.board.floor.improved', label: 'a round that cut your handicap index' },
  birdies: { i18n: 'amateur.board.floor.birdies', label: 'three birdies or more in a round' },
  ace: { i18n: 'amateur.board.floor.ace', label: 'a hole in one' },
  albatross: { i18n: 'amateur.board.floor.albatross', label: 'an albatross' },
  eagle: { i18n: 'amateur.board.floor.eagle', label: 'an eagle' },
  clean_card: { i18n: 'amateur.board.floor.cleanCard', label: 'a bogey-free round' },
};
