/**
 * composerFlowStore — the handoff record between STEP 1 (a sheet) and the
 * composer that step 1 opens (an overlay for the post path, a route for the
 * review path).
 *
 * WHY THIS EXISTS: backing out of the composer must land on STEP 1, not on the
 * page underneath it — a member who opened the post composer and then realised
 * they meant to rate the course should land back on the tiles. Step 1 is a
 * sheet and the composers are not, so nothing in the sheet stack can express
 * that return on its own.
 *
 * IN MEMORY ONLY — NEVER PERSISTED. This record must not touch sessionStorage,
 * localStorage or the URL. A persisted record can resurrect on a cold launch
 * and open the composer over whatever the member opened the app to do; that is
 * the worst version of this bug and the hardest to reproduce. Zustand without
 * `persist` means the record starts null on every fresh JS context, so a cold
 * launch cannot reopen step 1 under any circumstance.
 *
 * ARMING IS THE WHOLE TRICK. The review handoff navigates through
 * afterSheetHistorySettled, so at the moment the record is written the route
 * has NOT changed yet and the studio is NOT open yet. A reopen rule that only
 * asked "are we back on the return path?" would therefore fire instantly and
 * re-open step 1 over its own handoff. The record is only ARMED once we have
 * actually left — either the path changed or the studio opened — and only an
 * armed record can reopen step 1.
 *
 * DISARMED IMMEDIATELY AND PERMANENTLY BY ANY OF (enforced in
 * GlobalBottomNavigation's reopen effect, except completion which is reported
 * by the composers themselves through notifyComposerCompleted):
 *   - the member completing a post or a review
 *   - navigating anywhere that is not the page step 1 was opened from
 *   - step 1 reopening once — it is one-shot: it fires or it expires
 *   - the app being backgrounded and restored
 *   - the composer being closed by anything other than back
 */
import { create } from 'zustand';

interface Handoff {
  /** The path step 1 was opened from; the path a return lands back on. */
  returnPath: string;
  /** True once we have actually left step 1. Only then may it reopen. */
  armed: boolean;
  /** The path we left step 1 for, captured at the moment of arming. */
  awayPath: string | null;
}

interface ComposerFlowState {
  handoff: Handoff | null;
  /**
   * Set by requestReopen(); consumed by GlobalBottomNavigation, which opens
   * step 1 and spends the flag. Separate from the handoff on purpose — see
   * requestReopen below.
   */
  reopenRequested: boolean;
  /** Called by step 1 as it hands off to a composer. */
  beginHandoff: (returnPath: string) => void;
  arm: (awayPath: string) => void;
  clearHandoff: () => void;
  /**
   * THE POST COMPOSER'S ← (phase 3 §1.4). The post composer is an OVERLAY, so
   * closing it is not a navigation and the popstate path in nextHandoffAction
   * cannot serve this return: there is no back event to observe. This is an
   * EXPLICIT request instead, and nextHandoffAction's rules are left exactly as
   * they are — they are tested and correct for the review path, which is a
   * route.
   *
   * ONE-SHOT, LIKE EVERYTHING ELSE HERE: the handoff is cleared as the flag is
   * raised, so a second call with no handoff left does nothing at all.
   */
  requestReopen: () => void;
  /** GlobalBottomNavigation spends the flag once it has opened step 1. */
  consumeReopen: () => void;
}

export const useComposerFlowStore = create<ComposerFlowState>((set) => ({
  handoff: null,
  reopenRequested: false,
  beginHandoff: (returnPath) => set({ handoff: { returnPath, armed: false, awayPath: null } }),
  arm: (awayPath) =>
    set((s) => (s.handoff ? { handoff: { ...s.handoff, armed: true, awayPath } } : s)),
  clearHandoff: () => set({ handoff: null }),
  requestReopen: () =>
    set((s) => (s.handoff ? { handoff: null, reopenRequested: true } : s)),
  consumeReopen: () => set({ reopenRequested: false }),
}));
