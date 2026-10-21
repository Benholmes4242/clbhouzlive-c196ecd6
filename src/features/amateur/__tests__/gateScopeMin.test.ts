import { describe, it, expect } from 'vitest';
import { GATE_SCOPE_MIN_ROUNDS, rungCarries } from '../useAmateurBoardState';

const page = (rows: number, rounds: number) => ({ rows: Array.from({ length: rows }), pool: { rounds } });

describe('CB39 scope minimum', () => {
  it('is five rounds', () => expect(GATE_SCOPE_MIN_ROUNDS).toBe(5));
  it('a rung with four rounds is passed over', () => expect(rungCarries(page(4, 4))).toBe(false));
  it('a rung with five rounds is chosen', () => expect(rungCarries(page(4, 5))).toBe(true));
  it('the row floor still applies', () => expect(rungCarries(page(3, 50))).toBe(false));
});
