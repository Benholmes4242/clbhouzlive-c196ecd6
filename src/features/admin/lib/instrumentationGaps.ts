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
  // MEASURED, 7 Sep 2026, and NOT what it looked like. This event measured the
  // media-TYPE chips (all / photos / clips / videos) on /explore. Those chips
  // live in MediaActBar.tsx, which has NO consumer anywhere in src/ — the chip
  // row a member sees on the media surface now is watch-v2's HubChipBar, whose
  // ids are audience filters (all / following / your_courses / bucket_list /
  // trending), a different question entirely. So this is neither a lost emit on
  // a live control nor a clean retirement: the control was replaced by an
  // unrelated one and the replacement was never instrumented.
  //
  // Held here rather than retired, deliberately, because retiring it would bury
  // two open items: (1) is MediaActBar dead code, to be decided by reading the
  // code as AmateurCircuitHero was, and (2) the Watch hub filter fires nothing.
  // Awaiting Ben's call on both; do not move this line without one.
  community_media_filter_selected:
    'Media-type chips (MediaActBar) have no consumer; the live Watch hub chips ask a different question and emit nothing. Decide MediaActBar, then instrument the Watch chips.',
};

export function gapReason(name: string): string | null {
  return INSTRUMENTATION_GAPS[name] ?? null;
}
