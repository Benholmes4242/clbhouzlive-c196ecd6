/**
 * Back-compat shim: legacy callers used `openTrophiesSheet()` to open the old
 * AllTrophiesSheet. That sheet has been retired in favour of
 * `GamAchievementsSheet`, which is mounted by `GamMount` and listens to the
 * `gamAchievementsBus`. We re-route the old entrypoint to the new sheet so
 * every Trophy icon / "View N trophies" link across the app opens the
 * Dispatch-styled achievements sheet without per-callsite changes.
 */
import { openGamAchievements } from './gam/events';

export function openTrophiesSheet(): void {
  openGamAchievements();
}

/** @deprecated retained only so the legacy TrophiesSheetMount still compiles
 *  if anything still references it. The new sheet manages its own subscription. */
export function subscribeOpenTrophies(_fn: () => void): () => void {
  return () => {};
}
