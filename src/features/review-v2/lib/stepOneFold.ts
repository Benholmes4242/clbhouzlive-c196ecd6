/**
 * STEP 1 FOLD (BRIEF_REVIEW_STEP_ONE §1). "Empty" = first step, no words, no
 * media, not recording or transcribing, not edit mode. The photo header shows
 * only while empty and before anything has started; once any of those changes
 * the composer stays compact for the rest of the flow (step 2 and back).
 */
import { useLayoutEffect, useState } from 'react';

export interface StepOneInput {
  onFirstStep: boolean;
  textLength: number;
  mediaCount: number;
  voiceActive: boolean;
  isEditMode: boolean;
}

export function isStepOneEmpty(i: StepOneInput): boolean {
  return i.onFirstStep && i.textLength === 0 && i.mediaCount === 0 && !i.voiceActive && !i.isEditMode;
}

/** True while the photo header should render; latches false once folded. */
export function usePhotoHeaderForm(i: StepOneInput): boolean {
  const emptyNow = isStepOneEmpty(i);
  const [started, setStarted] = useState(!emptyNow);
  useLayoutEffect(() => { if (!emptyNow && !started) setStarted(true); }, [emptyNow, started]);
  return emptyNow && !started;
}
