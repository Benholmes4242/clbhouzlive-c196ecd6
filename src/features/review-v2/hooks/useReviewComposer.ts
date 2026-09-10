/**
 * useReviewComposer - state container for the three-step wizard.
 * No I/O beyond sessionStorage draft persistence; the shell wires this into
 * hooks/useReviewSubmit and hooks/useReviewMediaPipeline.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CategoryKey,
  ExistingReview,
  ReviewComposerState,
} from '../types';
import type { VerdictSlug } from '../tokens';

const EMPTY_STATE: ReviewComposerState = {
  verdict: null,
  overall: null,
  scores: {
    design: null,
    condition: null,
    clubhouse: null,
    facilities: null,
  },
  reviewText: '',
  shareToFeed: true,
  teeLabel: null,
};

export type WizardStep = 0 | 1 | 2;

const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/* DRAFT KEYS (BRIEF_SHEET_BACK_BEHAVIOUR_04 §1).
 *
 * Two namespaces, never one:
 *   create  review-draft:<courseId>
 *   edit    review-draft:edit:<ratingId>
 *
 * A create draft and an edit draft for the same course are different bodies of
 * work, and two edits of two different reviews are different again, so the key
 * carries the rating id in edit mode. Nothing can collide.
 */
function draftKey(courseId: string | null | undefined, reviewId?: string | null) {
  return reviewId
    ? `review-draft:edit:${reviewId}`
    : `review-draft:${courseId ?? 'unknown'}`;
}

interface DraftShape {
  step: WizardStep;
  overall: number | null;
  scores: Record<CategoryKey, number | null>;
  reviewText: string;
  shareToFeed: boolean;
  teeLabel: string | null;
  /* THE COUNT, NOT THE FILES (BRIEF_SHEET_BACK_BEHAVIOUR_05 §1).
   *
   * Attached media is local File/blob data at guard time and is not
   * serialisable, so it cannot be restored. Two numbers can be, and they are
   * what turns a silent loss into a stated one: on restore the notice names how
   * many photos and videos were attached and could not be kept, so the member
   * re-attaches before publishing instead of discovering it afterwards.
   *
   * Counted from LOCAL items only. Existing media on an edited review lives in
   * course_review_media and is never at risk, so counting it would warn about
   * something that is still there. Optional for drafts written before this. */
  photoCount?: number;
  videoCount?: number;
  savedAt: number;
}

/** Attached-media counts at save time, local (unuploaded) items only. */
export interface DraftMediaCounts {
  photos: number;
  videos: number;
}



function readDraft(
  courseId: string | null | undefined,
  reviewId?: string | null,
): DraftShape | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(draftKey(courseId, reviewId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftShape;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(
  courseId: string | null | undefined,
  draft: DraftShape,
  reviewId?: string | null,
) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(draftKey(courseId, reviewId), JSON.stringify(draft));
  } catch {
    /* private browsing throws */
  }
}

export function clearReviewDraft(
  courseId: string | null | undefined,
  reviewId?: string | null,
) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(draftKey(courseId, reviewId));
  } catch {
    /* private browsing throws */
  }
}


function seedFromExisting(existing: ExistingReview | null | undefined): ReviewComposerState {
  if (!existing) return EMPTY_STATE;
  const asVerdict = (existing.verdict ?? null) as VerdictSlug | null;
  return {
    verdict: asVerdict,
    overall: existing.rating ?? null,
    scores: {
      design: existing.design_score ?? null,
      condition: existing.condition_score ?? null,
      clubhouse: existing.clubhouse_score ?? null,
      facilities: existing.facilities_score ?? null,
    },
    reviewText: existing.review ?? '',
    // share_to_feed is the source of truth for feed visibility (v2 RPC).
    shareToFeed: existing.share_to_feed !== false,
    teeLabel: existing.tee_label ?? null,
  };
}

function sameAsPublished(draft: DraftShape, base: ReviewComposerState): boolean {
  const s = draft.scores ?? ({} as DraftShape['scores']);
  return (
    (draft.overall ?? null) === (base.overall ?? null) &&
    (s.design ?? null) === (base.scores.design ?? null) &&
    (s.condition ?? null) === (base.scores.condition ?? null) &&
    (s.clubhouse ?? null) === (base.scores.clubhouse ?? null) &&
    (s.facilities ?? null) === (base.scores.facilities ?? null) &&
    (draft.reviewText ?? '') === (base.reviewText ?? '') &&
    (draft.shareToFeed !== false) === (base.shareToFeed !== false) &&
    (draft.teeLabel ?? null) === (base.teeLabel ?? null)
  );
}

export function useReviewComposer(
  existing?: ExistingReview | null,
  courseId?: string | null,
  /* Live attached-media counts, supplied by the shell (which owns the media
     pipeline). Read at every debounced write so the stored numbers describe
     what was attached at the moment the draft was last saved. */
  mediaCounts?: DraftMediaCounts,
) {

  const isEditMode = !!existing;
  const reviewId = existing?.id ?? null;

  /* EDIT MODE PERSISTS TOO (BRIEF_SHEET_BACK_BEHAVIOUR_04 §1).
   *
   * It used to not: edit mode seeded from the published review and never wrote
   * a draft, so an iOS edge-swipe out of an edit destroyed the rewrite outright
   * while the header arrow — the path members use least — was the only one that
   * asked. Both modes now write the same 24h sessionStorage draft, under keys
   * that cannot collide (see draftKey).
   *
   * A restored EDIT draft is announced, never silent: showing text that differs
   * from what is published without saying so would be a second fault. The
   * announcement is suppressed when the stored draft is byte-identical to the
   * published review, because then there is nothing to announce.
   */
  const publishedBase = useMemo(() => seedFromExisting(existing), [existing]);

  const restored = useMemo(
    () => readDraft(courseId, reviewId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, setState] = useState<ReviewComposerState>(() => {
    const base = seedFromExisting(existing);
    if (!restored) return base;
    return {
      ...base,
      overall: restored.overall ?? null,
      scores: { ...base.scores, ...(restored.scores ?? {}) },
      reviewText: restored.reviewText ?? '',
      shareToFeed: restored.shareToFeed !== false,
      teeLabel: restored.teeLabel ?? null,
    };
  });

  // Edit mode only: true when unsaved changes were brought back from a draft.
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(
    () => !!(isEditMode && restored && !sameAsPublished(restored, publishedBase)),
  );

  /* WHAT COULD NOT COME BACK WITH IT (_05 §1). Non-null only when the restored
     draft records attached media, in BOTH modes: a create-mode restore is
     otherwise silent, and silence is exactly what made the loss invisible. The
     counts are frozen at first read, like the draft itself, so re-attaching does
     not rewrite the sentence describing what was lost. */
  const [restoredMediaCounts, setRestoredMediaCounts] = useState<DraftMediaCounts | null>(() => {
    const photos = restored?.photoCount ?? 0;
    const videos = restored?.videoCount ?? 0;
    return photos > 0 || videos > 0 ? { photos, videos } : null;
  });


  const [step, setStepRaw] = useState<WizardStep>(() => (restored?.step ?? 0) as WizardStep);
  const setStep = useCallback((n: WizardStep) => setStepRaw(n), []);

  const setVerdict = useCallback((slug: VerdictSlug) => {
    setState((s) => ({ ...s, verdict: slug }));
  }, []);

  const setOverall = useCallback((v: number) => {
    setState((s) => ({ ...s, overall: Math.round(v * 10) / 10 }));
  }, []);

  const setCategory = useCallback((key: CategoryKey, v: number) => {
    setState((s) => ({
      ...s,
      scores: { ...s.scores, [key]: Math.round(v * 10) / 10 },
    }));
  }, []);

  const setReviewText = useCallback((text: string) => {
    setState((s) => ({ ...s, reviewText: text }));
  }, []);

  const setShareToFeed = useCallback((v: boolean) => {
    setState((s) => ({ ...s, shareToFeed: v }));
  }, []);

  const setTeeLabel = useCallback((label: string | null) => {
    setState((s) => ({ ...s, teeLabel: label }));
  }, []);

  /* Debounced draft write. Both modes. The FILES are still never persisted —
     they are local blobs — but their COUNTS are, so the restore can say what it
     could not bring back (_05 §1). */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoCount = mediaCounts?.photos ?? 0;
  const videoCount = mediaCounts?.videos ?? 0;
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeDraft(
        courseId,
        {
          step,
          overall: state.overall,
          scores: state.scores,
          reviewText: state.reviewText,
          shareToFeed: state.shareToFeed,
          teeLabel: state.teeLabel,
          photoCount,
          videoCount,
          savedAt: Date.now(),
        },
        reviewId,
      );
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [courseId, reviewId, step, state, photoCount, videoCount]);

  const clearDraft = useCallback(
    () => clearReviewDraft(courseId, reviewId),
    [courseId, reviewId],
  );

  /* GETTING BACK TO WHAT IS LIVE. A restoration the member cannot undo would
   * trap them in an edit they may not remember making, so discarding returns
   * the composer to the published review and drops the stored draft. */
  const discardRestoredDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearReviewDraft(courseId, reviewId);
    setState(seedFromExisting(existing));
    setRestoredFromDraft(false);
    setRestoredMediaCounts(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, reviewId, existing]);

  /* Dismissing the media sentence alone, without discarding the restored work:
     the member has read it and re-attached, or decided not to. */
  const acknowledgeRestoredMedia = useCallback(() => setRestoredMediaCounts(null), []);




  const catsSet = useMemo(
    () =>
      (state.scores.design != null ? 1 : 0) +
      (state.scores.condition != null ? 1 : 0) +
      (state.scores.clubhouse != null ? 1 : 0) +
      (state.scores.facilities != null ? 1 : 0),
    [state.scores],
  );

  const allCategoriesSet = catsSet === 4;
  const step0Gate = state.overall != null;
  const step1Gate = allCategoriesSet;

  const canSubmit = useMemo(
    () => step0Gate && step1Gate,
    [step0Gate, step1Gate],
  );

  return {
    state,
    step,
    setStep,
    restoredFromDraft,
    discardRestoredDraft,

    setVerdict,
    setOverall,
    setCategory,
    setReviewText,
    setShareToFeed,
    setTeeLabel,
    canSubmit,
    allCategoriesSet,
    catsSet,
    step0Gate,
    step1Gate,
    clearDraft,
  };
}
