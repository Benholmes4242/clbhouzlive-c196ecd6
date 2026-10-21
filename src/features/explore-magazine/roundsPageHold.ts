/**
 * CB44 — ONE HOLD, ONE PAINT. The Rounds page changes shape exactly once:
 * from the hold to the settled page. The hold is in force while ANY of the
 * three is undecided:
 *   1. the session ("not yet known" is undecided, never signed out);
 *   2. the WHS connection read (the gate state is 'loading');
 *   3. In form's own read — once it will mount (signed in, or the board state
 *      resolved), until it settles. Settled includes empty and error.
 * The hold draws only the page's three sized section placeholders: no scope
 * switch (it vanishes when gated) and nothing for In form (it can settle
 * absent, so any reserved height would contract).
 */
export function roundsPageHeld(input: {
  sessionKnown: boolean;
  signedIn: boolean;
  gate: 'signedOut' | 'loading' | 'gated' | 'connected';
  boardReady: boolean;
  inFormPending: boolean;
}): boolean {
  if (!input.sessionKnown) return true;
  if (input.gate === 'loading') return true;
  /* Signed in, the landing ladder always resolves (failed rungs count as
     settled), and In form mounts once it does. Signed out, the board state
     does not resolve today, so In form never mounts and is decided-absent. */
  if (input.signedIn && !input.boardReady) return true;
  return input.boardReady && input.inFormPending;
}
