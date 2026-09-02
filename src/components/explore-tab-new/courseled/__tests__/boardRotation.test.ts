import { describe, expect, it } from 'vitest';

import { FALLBACK_PICK, pickRotation, type RotationRow } from '../boardRotation';

const row = (board: string, win: string, n: number, viewer_pos: number | null = null): RotationRow =>
  ({ board, win, n, viewer_pos });

/** Deterministic draw: always takes the first ticket. */
const first = () => 0;
/** Deterministic draw: always takes the last ticket. */
const last = () => 0.999999;

describe('pickRotation', () => {
  it('R3.1 — falls back to gross / 14 when the RPC returns nothing', () => {
    expect(pickRotation([])).toEqual(FALLBACK_PICK);
    expect(pickRotation(null)).toEqual(FALLBACK_PICK);
  });

  it('R2.1 — collapses windows that return the same count, keeping the shortest', () => {
    const rows = [
      row('gross', '14', 18),
      row('gross', '90', 21),
      row('gross', 'year', 21),
      row('gross', 'all', 21),
    ];
    const picks = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const p = pickRotation(rows);
      picks.add(`${p.board}:${p.window}`);
    }
    expect([...picks].sort()).toEqual(['gross:14', 'gross:90']);
  });

  it('R2.2 — the board is drawn uniformly, not by row count', () => {
    const rows = [row('recent', 'all', 3412), row('gross', '14', 18)];
    expect(pickRotation(rows, { random: first }).board).toBe('recent');
    expect(pickRotation(rows, { random: last }).board).toBe('gross');
  });

  it('R2.3 — a board the member renders on carries double weight', () => {
    const rows = [row('gross', '14', 18, 3), row('net', '14', 18, 40)];
    let visible = 0;
    for (let i = 0; i < 3000; i += 1) {
      if (pickRotation(rows).board === 'gross') visible += 1;
    }
    expect(visible / 3000).toBeGreaterThan(0.6);
    expect(visible / 3000).toBeLessThan(0.72);
  });

  it('R2.4 — never repeats the previous session, unless that empties the set', () => {
    const rows = [row('gross', '14', 18), row('net', '14', 18)];
    for (let i = 0; i < 50; i += 1) {
      expect(pickRotation(rows, { last: { board: 'gross', window: '14' } })).toEqual({
        board: 'net',
        window: '14',
      });
    }
    const only = [row('gross', '14', 18)];
    expect(pickRotation(only, { last: { board: 'gross', window: '14' } })).toEqual({
      board: 'gross',
      window: '14',
    });
  });
});
