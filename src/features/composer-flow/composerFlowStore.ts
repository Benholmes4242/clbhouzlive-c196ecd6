/**
 * composerFlowStore — the handoff record between STEP 1 (a sheet) and the
 * composer that step 1 opens (an overlay for the post path, a route for the
 * review path).
 *
 * WHY THIS EXISTS: back out of the composer must land on STEP 1, not on the
 * page underneath it. Step 1 is a sheet and the composers are not, so nothing
 * in the sheet stack can express that return on its own.
 *
 * ARMING IS THE WHOLE TRICK. The review handoff navigates through
 * afterSheetHistorySettled, so at the moment the record is written the route
 * has NOT changed yet and the studio is NOT open yet. A reopen rule that only
 * asked "are we back on the return path?" would therefore fire instantly and
 * re-open step 1 over its own handoff. The record is only ARMED once we have
 * actually left — either the path changed or the studio opened — and only an
 * armed record can reopen step 1.
 */
import { create } from 'zustand';

interface Handoff {
  /** The path step 1 was opened from; the path a return lands back on. */
  returnPath: string;
  /** True once we have actually left step 1. Only then may it reopen. */
  armed: boolean;
}

interface ComposerFlowState {
  handoff: Handoff | null;
  /** Called by step 1 as it hands off to a composer. */
  beginHandoff: (returnPath: string) => void;
  arm: () => void;
  clearHandoff: () => void;
}

export const useComposerFlowStore = create<ComposerFlowState>((set) => ({
  handoff: null,
  beginHandoff: (returnPath) => set({ handoff: { returnPath, armed: false } }),
  arm: () => set((s) => (s.handoff ? { handoff: { ...s.handoff, armed: true } } : s)),
  clearHandoff: () => set({ handoff: null }),
}));
