import { describe, it, expect } from 'vitest';
import { roundsPageHeld } from '@/features/explore-magazine/roundsPageHold';

const base = { sessionKnown: true, signedIn: true, gate: 'gated' as const, boardReady: true, inFormPending: false };

describe('CB44 — one hold, one paint', () => {
  it('holds while the session is not yet known, even with no user', () => {
    expect(roundsPageHeld({ ...base, sessionKnown: false, signedIn: false, gate: 'signedOut' })).toBe(true);
  });
  it('holds while the connection read is undecided', () => {
    expect(roundsPageHeld({ ...base, gate: 'loading' })).toBe(true);
  });
  it('holds a signed-in member until the board state resolves', () => {
    expect(roundsPageHeld({ ...base, boardReady: false })).toBe(true);
  });
  it('holds until In form settles, and settled (rows, empty or error) releases it', () => {
    expect(roundsPageHeld({ ...base, inFormPending: true })).toBe(true);
    expect(roundsPageHeld(base)).toBe(false);
  });
  it('a resolved signed-out visitor is never held', () => {
    expect(roundsPageHeld({ ...base, signedIn: false, gate: 'signedOut', boardReady: false })).toBe(false);
  });
  it('a connected member is released once In form settles', () => {
    expect(roundsPageHeld({ ...base, gate: 'connected' })).toBe(false);
  });
});
