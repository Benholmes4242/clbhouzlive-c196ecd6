/* DRAFT DISMISS GUARD (BRIEF_SHEET_BACK_BEHAVIOUR_02 §3)
 *
 * One guarded dismiss for sheets that hold member-authored draft state.
 *
 * WHY A HOOK AND NOT A PROP ON BottomSheet: the four dismiss paths a member
 * can take (backdrop tap, Escape, history/hardware back, explicit close or
 * done button) all funnel through the caller's own `onClose`. Wrapping that
 * one callback therefore covers every path at once, including the automatic
 * history entry registered by BottomSheet, without BottomSheet needing to
 * know what a draft is.
 *
 * CONTRACT
 *  - `requestClose` is what the sheet passes as its `onClose` everywhere.
 *  - When `isDirty` is false it closes immediately: a clean sheet must never
 *    ask a question.
 *  - When `isDirty` is true it opens the confirmation instead of closing.
 *    Nothing is discarded until the member says so.
 *  - `discard` closes for real. `keepEditing` returns to the sheet unchanged.
 *
 * HISTORY NOTE: BottomSheet's history marker is already consumed by the time
 * a back gesture reaches `requestClose`, so choosing "keep editing" leaves the
 * sheet open with its marker spent. A second back closes it (after asking
 * again). This is deliberate: the alternative is re-pushing a marker from
 * inside a popstate handler, which fights the browser and cannot be made
 * reliable on iOS edge-swipe. Reported, not hidden.
 */
import { useCallback, useRef, useState } from 'react';

export interface DraftDismissGuard {
  /** Pass this as `onClose` on every dismiss path. */
  requestClose: () => void;
  /** True while the confirmation is showing. */
  confirmOpen: boolean;
  /** Member chose to lose the draft: closes for real. */
  discard: () => void;
  /** Member chose to stay: dismisses the question only. */
  keepEditing: () => void;
}

export function useDraftDismissGuard(isDirty: boolean, onClose: () => void): DraftDismissGuard {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Read the live values at call time so a stale closure can never decide
  // that a dirty sheet is clean.
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const requestClose = useCallback(() => {
    if (dirtyRef.current) {
      setConfirmOpen(true);
      return;
    }
    closeRef.current();
  }, []);

  const discard = useCallback(() => {
    setConfirmOpen(false);
    closeRef.current();
  }, []);

  const keepEditing = useCallback(() => setConfirmOpen(false), []);

  return { requestClose, confirmOpen, discard, keepEditing };
}
