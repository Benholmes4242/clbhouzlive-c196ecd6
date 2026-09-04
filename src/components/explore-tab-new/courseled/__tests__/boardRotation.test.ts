import { describe, expect, it } from 'vitest';

import { FALLBACK_PICK, pickRotation, type RotationRow } from '../boardRotation';

const row = (board: string, win: string, n: number, viewer_pos: number | null = null): RotationRow =>
  ({ board, win, n, viewer_pos });

/** Deterministic draw: always takes the first ticket. */
const first = () => 0;
/** Deterministic draw: always takes the last ticket. */
const last = () => 0.999999;

describe('pickRotation', () => {
  it('R3.1 — falls back to topar / 14 when the RPC returns nothing', () => {
    expect(pickRotation([])).toEqual(FALLBACK_PICK);
    expect(pickRotation(null)).toEqual(FALLBACK_PICK);
  });

  it('R2.1 — collapses windows that return the same count, keeping the shortest', () => {
    const rows = [
      row('topar', '14', 18),
      row('topar', '90', 21),
      row('topar', 'year', 21),
      row('topar', 'all', 21),
    ];
    const picks = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const p = pickRotation(rows);
      picks.add(`${p.board}:${p.window}`);
    }
    expect([...picks].sort()).toEqual(['topar:14', 'topar:90']);
  });

  it('R2.2 — the board is drawn uniformly, not by row count', () => {
    const rows = [row('recent', 'all', 3412), row('topar', '14', 18)];
    expect(pickRotation(rows, { random: first }).board).toBe('recent');
    expect(pickRotation(rows, { random: last }).board).toBe('topar');
  });

  it('R2.3 — a board the member renders on carries double weight', () => {
    const rows = [row('topar', '14', 18, 3), row('net', '14', 18, 40)];
    let visible = 0;
    for (let i = 0; i < 3000; i += 1) {
      if (pickRotation(rows).board === 'topar') visible += 1;
    }
    expect(visible / 3000).toBeGreaterThan(0.6);
    expect(visible / 3000).toBeLessThan(0.72);
  });

  it('R2.4 — never repeats the previous session, unless that empties the set', () => {
    const rows = [row('topar', '14', 18), row('net', '14', 18)];
    for (let i = 0; i < 50; i += 1) {
      expect(pickRotation(rows, { last: { board: 'topar', window: '14' } })).toEqual({
        board: 'net',
        window: '14',
      });
    }
    const only = [row('topar', '14', 18)];
    expect(pickRotation(only, { last: { board: 'topar', window: '14' } })).toEqual({
      board: 'topar',
      window: '14',
    });
  });
});

describe('pickRotation — F2.3 the handicap default board is excluded', () => {
  it('never draws the excluded board, and falls back when nothing survives', () => {
    const rows = [row('net', '14', 21), row('topar', '14', 21), row('recent', 'all', 3412)];
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      seen.add(pickRotation(rows, { excludeBoard: 'net' }).board);
    }
    expect(seen.has('net')).toBe(false);

    const onlyNet = [row('net', '14', 21)];
    expect(
      pickRotation(onlyNet, { excludeBoard: 'net', fallback: { board: 'net', window: '14' } }),
    ).toEqual({ board: 'net', window: '14' });
  });
});
