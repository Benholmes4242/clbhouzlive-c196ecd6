import { describe, it, expect } from 'vitest';
import { BOARD_FLOOR_COPY } from '../boardFloors';

/* public.board_qualifies changed on 27 October 2026: the ranking boards no
   longer hold entry floors, so stableford, birdies and improved include every
   round carrying the value they sort on. Only the four feat boards still
   require the event. */
const NO_ROUND_LABEL = "You haven't posted a round in this window.";

describe('board floor copy', () => {
  it('ranking boards all read the no-round entry line', () => {
    for (const board of ['recent', 'gross', 'topar', 'net', 'stableford', 'birdies', 'improved'] as const) {
      expect(BOARD_FLOOR_COPY[board].label, board).toBe(NO_ROUND_LABEL);
      expect(BOARD_FLOOR_COPY[board].i18n, board).toBe('amateur.board.floor.noRound');
    }
  });

  it('feat boards still name the event they require', () => {
    expect(BOARD_FLOOR_COPY.ace.label).toBe('You need a hole in one in this window.');
    expect(BOARD_FLOOR_COPY.albatross.label).toBe('You need an albatross in this window.');
    expect(BOARD_FLOOR_COPY.eagle.label).toBe('You need an eagle in this window.');
    expect(BOARD_FLOOR_COPY.clean_card.label).toBe('You need a bogey-free round in this window.');
    expect(BOARD_FLOOR_COPY.clean_card.i18n).toBe('amateur.board.floor.cleanCard');
  });

  it('no ranking board still asks for a scoring floor', () => {
    const copy = Object.entries(BOARD_FLOOR_COPY)
      .filter(([board]) => ['stableford', 'birdies', 'improved'].includes(board))
      .map(([, value]) => value.label)
      .join(' ');
    expect(copy).not.toContain('36 points');
    expect(copy).not.toContain('three birdies');
    expect(copy).not.toContain('cut your handicap');
  });
});
