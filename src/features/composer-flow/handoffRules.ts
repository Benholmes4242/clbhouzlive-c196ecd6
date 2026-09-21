/**
 * handoffRules — the conditions under which STEP 1 comes back, written down as
 * one pure function so they can be tested rather than described.
 *
 * ARM: only at the moment step 1 hands off to a composer (the first time we
 * observe that we have actually left it).
 *
 * REOPEN: only a BACK navigation landing straight back on the page step 1 was
 * opened from, with the composer closed. One-shot — it fires or it expires.
 *
 * DISARM immediately and permanently on any of: navigating anywhere that is not
 * that page (handled here), the composer being closed by anything other than
 * back (handled here), firing once (handled here), completing a post or review
 * (notifyComposerCompleted), the app being backgrounded (visibilitychange).
 */
export interface HandoffSnapshot {
  returnPath: string;
  armed: boolean;
  awayPath: string | null;
}

export interface HandoffInput {
  handoff: HandoffSnapshot | null;
  pathname: string;
  studioOpen: boolean;
  /** True when the navigation being reacted to was a back (popstate). */
  navWasBack: boolean;
}

export type HandoffAction =
  | { type: 'none' }
  | { type: 'arm'; awayPath: string }
  | { type: 'clear' }
  | { type: 'reopen' };

export function nextHandoffAction({
  handoff,
  pathname,
  studioOpen,
  navWasBack,
}: HandoffInput): HandoffAction {
  if (!handoff) return { type: 'none' };

  const onReturnPath = pathname === handoff.returnPath;
  const left = studioOpen || !onReturnPath;

  if (!handoff.armed) {
    return left ? { type: 'arm', awayPath: pathname } : { type: 'none' };
  }

  // Moved on somewhere else entirely → this is no longer a return.
  if (!onReturnPath && pathname !== handoff.awayPath) return { type: 'clear' };

  if (left) return { type: 'none' }; // still inside the composer

  // Back on the page step 1 was opened from with the composer closed.
  // Closed by anything other than back → expire without reopening.
  return navWasBack ? { type: 'reopen' } : { type: 'clear' };
}

/**
 * THE POST COMPOSER'S LEADING CONTROL (phase 3 §1.4). Written as a pure rule so
 * it is tested rather than described.
 *
 * ← only when the member arrived from step 1, which is the only case where
 * there IS a previous step to return to. Every other entry — a course page's
 * "post about this", an edit, a draft, a deep link — has no step 1 behind it, so
 * the control closes the composer instead of pretending to go back.
 *
 * Existence of the handoff is the test, not `armed`: the record is written as
 * step 1 hands off and armed one effect later, so a composer reading `armed` on
 * its first paint would draw × and then swap to ←.
 */
export function postLeadingControl(handoff: HandoffSnapshot | null): 'back' | 'close' {
  return handoff ? 'back' : 'close';
}
