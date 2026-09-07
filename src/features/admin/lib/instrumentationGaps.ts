/**
 * KNOWN INSTRUMENTATION GAPS — bugs, not decisions.
 *
 * An event listed here belongs to a surface that IS STILL LIVE. The feature
 * works; we simply stopped measuring it, usually because a rewrite did not
 * carry the emit call across. That is a defect with an owner and a fix, and it
 * must never sit inside retiredEvents.ts — a suppression list is read once and
 * never again, so a bug filed there is a bug nobody actions.
 *
 * Difference from RETIRED_EVENTS:
 *  - RETIRED: emitting code is deliberately gone. Silence is correct forever.
 *  - GAP (this file): emitting code should exist and does not. Silence is wrong
 *    and the line is a to-do. It renders on screen as its own "Gap" badge, and
 *    it does NOT count as a healthy event.
 *
 * RULES
 *  - Every line names the live surface and what must be re-instrumented.
 *  - When the emit is restored, DELETE the line. Do not comment it out.
 *  - If a surface turns out to be genuinely gone, the line moves to
 *    retiredEvents.ts with a reason — it does not stay here.
 */
export const INSTRUMENTATION_GAPS: Record<string, string> = {
  // Empty as of 7 Sep 2026: profile_hub_sheet_opened was the only entry and the
  // emit has been restored in ProfileSheetV2 (see that file). Keep this file —
  // the next rewrite will produce another one, and it must not land in the
  // retired list.
};

export function gapReason(name: string): string | null {
  return INSTRUMENTATION_GAPS[name] ?? null;
}
