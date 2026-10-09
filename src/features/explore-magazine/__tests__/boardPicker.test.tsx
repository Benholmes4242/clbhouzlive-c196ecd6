import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardPicker } from '../BoardPicker';
import { FiltersPill } from '../ScoresFilterHead';
import {
  OFFERED_RANKING_BOARD_KEYS,
  boardValueIsFigure,
} from '@/components/explore-tab-new/courseled/boardFilters';

describe('board picker', () => {
  it('offers exactly the six ranking boards in order, no feats, no retired gross', () => {
    expect(OFFERED_RANKING_BOARD_KEYS).toEqual(['recent', 'topar', 'net', 'stableford', 'improved', 'birdies']);
    render(<BoardPicker open onClose={() => {}} board="recent" onPick={() => {}} />);
    expect(screen.getAllByRole('option')).toHaveLength(6);
  });

  it('choosing a board picks it and closes, opening no panel', () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(<BoardPicker open onClose={onClose} board="recent" onPick={onPick} />);
    fireEvent.click(screen.getAllByRole('option')[2]);
    expect(onPick).toHaveBeenCalledWith('net');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('the Filters pill still calls its own open handler', () => {
    const onOpen = vi.fn();
    render(<FiltersPill count={0} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('boardValueIsFigure', () => {
  it('numeric boards get the large leader value; recent gets row size', () => {
    expect(boardValueIsFigure('topar')).toBe(true);
    expect(boardValueIsFigure('net')).toBe(true);
    expect(boardValueIsFigure('recent')).toBe(false);
  });
});
