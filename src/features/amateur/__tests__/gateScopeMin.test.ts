import { describe, it, expect } from 'vitest';
import { GATE_SCOPE_MIN_ROUNDS, rungCarries, skippedBelowMin } from '../useAmateurBoardState';

const page = (rows: number, rounds: number) => ({ rows: Array.from({ length: rows }), pool: { rounds } });

describe('CB39/CB40 scope minimum (gated only)', () => {
  it('is five rounds', () => expect(GATE_SCOPE_MIN_ROUNDS).toBe(5));
  it('gated: a rung with four rounds is passed over', () => expect(rungCarries(page(4, 4), true)).toBe(false));
  it('gated: a rung with five rounds is chosen', () => expect(rungCarries(page(4, 5), true)).toBe(true));
  it('gated: the row floor still applies', () => expect(rungCarries(page(3, 50), true)).toBe(false));
  it('connected: a four-round circle still lands on circle', () => expect(rungCarries(page(4, 4), false)).toBe(true));
  it('connected: the row floor alone decides', () => expect(rungCarries(page(3, 50), false)).toBe(false));
  it('the skip event condition is gated-only and minimum-only', () => {
    expect(skippedBelowMin(page(4, 4), true)).toBe(true);
    expect(skippedBelowMin(page(4, 4), false)).toBe(false);
    expect(skippedBelowMin(page(3, 3), true)).toBe(false);
  });
});
