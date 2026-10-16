import { describe, it, expect } from 'vitest';
import { lockFacts } from '../LockedCard';

// Newest first. Oldest (last) is 20 and non-counting; counters are 1..8.
const base = () => [
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((d) => ({ handicap_differential: d, is_counter: true })),
  ...Array.from({ length: 12 }, () => ({ handicap_differential: 20, is_counter: false })),
];

describe('lockFacts', () => {
  it('locks when the oldest round is non-counting and names the worst counter', () => {
    expect(lockFacts(base())).toEqual({ worstCounting: 8 });
  });
  it('does not lock when the oldest round is counting', () => {
    const r = base();
    r[19] = { handicap_differential: 0.5, is_counter: true };
    expect(lockFacts(r)).toBeNull();
  });
  it('does not lock below twenty rounds', () => {
    expect(lockFacts(base().slice(0, 19))).toBeNull();
  });
});
