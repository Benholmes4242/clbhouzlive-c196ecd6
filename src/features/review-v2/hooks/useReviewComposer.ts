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

/**
 * THE DIAL OPENS AT 9.0 — AND THE TOUCHED FLAG IS WHY THAT IS SAFE.
 *
 * The step-3 dial shows a figure from the moment it opens (an em-dash read as
 * unloaded content on device), but an untouched default and a deliberate 9.0
 * must not write identical rows: the platform median is 8.8, so a default
 * nobody moved would anchor the whole scale upward. `overallTouched` records
 * whether the member has moved it; until they have, the primary button reads
 * "Set your score" and is disabled. One drag satisfies it, including a drag
 * that ends back on 9.0. EDIT MODE starts SATISFIED — they already have a
 * score and must not re-drag it to fix a typo.
 */
export const DEFAULT_OVERALL = 9.0;

const EMPTY_STATE: ReviewComposerState = {
  verdict: null,
  overall: DEFAULT_OVERALL,
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

/**
 * THE STEP NUMBERS ARE THE MEMBER'S STEP NUMBERS.
 *
 * The unified composer's step 1 ("What are you sharing?") is a sheet this
 * composer never renders, so the composer owns steps 2 and 3 and uses those
 * very numbers — no second numbering to translate for the counter, the
 * segmented bar or the analytics indices.
 *
 * 2 = photos and a few words. 3 = the dial and the breakdown.
 */
export type WizardStep = 2 | 3;
export const FIRST_STEP: WizardStep = 2;
export const LAST_STEP: WizardStep = 3;
/** Total steps in the review path, including step 1's tiles. */
export const REVIEW_TOTAL_STEPS = 3;

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

/* DRAFT VERSION — THE ONE THAT WOULD HAVE BITTEN ON SHIP DAY.
 *
 * The stored `step` index changed MEANING when the review path was reordered:
 * 1 used to be Breakdown and is now Words, 2 used to be Words and is now the
 * rating. A draft written before the reorder therefore restores onto the wrong
 * screen with the member's work intact and the flow scrambled.
 *
 * A draft whose version is not the current one is DISCARDED SILENTLY — not
 * migrated, not partially restored. Drafts live 24 hours, so the problem
 * disappears within a day of shipping, and a missing draft is a smaller harm
 * than a wrong-screen restore. BUMP THIS whenever the step indices or the
 * shape's meaning change again.
 */
export const DRAFT_VERSION = 2;

interface DraftShape {
  /** DRAFT_VERSION at write time. Absent or stale means discard. */
  v?: number;
  step: WizardStep;
  /** Whether the member had moved the dial when the draft was written. */
  overallTouched?: boolean;
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
    if (parsed.v !== DRAFT_VERSION) return null; // pre-reorder draft: discard
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

/**
 * PHASE 3 — seed the create-namespace draft from a failed staged review so
 * "retry" means "here is your review, add the photos again". A staged review
 * has no rating row (even when it was an edit); submit_course_review_v2
 * upserts on publish, so an edit still resolves correctly.
 */
export function seedReviewDraftFromPending(row: {
  course_id: string;
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  verdict: string | null;
  tee_label: string | null;
  share_to_feed: boolean | null;
}) {
  writeDraft(row.course_id, {
    v: DRAFT_VERSION,
    // Step 2, not 3: the scores are theirs; media is attached on step 2.
    step: FIRST_STEP,
    // They already set this score — don't make them drag the dial again.
    overallTouched: true,
    overall: row.rating,
    scores: {
      design: row.design_score,
      condition: row.condition_score,
      clubhouse: row.clubhouse_score,
      facilities: row.facilities_score,
    },
    reviewText: row.review ?? '',
    shareToFeed: row.share_to_feed ?? true,
    teeLabel: row.tee_label ?? null,
    // photoCount/videoCount deliberately omitted: pending_reviews records the
    // total expected, not the split. The retry notice names the situation.
    savedAt: Date.now(),
  });
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
  // Edit mode opens on the EXISTING score, never on the 9.0 default.
  const asVerdict = (existing.verdict ?? null) as VerdictSlug | null;
  return {
    verdict: asVerdict,
    overall: existing.rating ?? DEFAULT_OVERALL,
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
      overall: restored.overall ?? base.overall,
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


  /* THE TOUCHED FLAG. Edit mode starts satisfied; a create starts unsatisfied
     even though the dial already displays 9.0. A restored draft carries the
     member's own answer forward. */
  const [overallTouched, setOverallTouched] = useState<boolean>(
    () => isEditMode || restored?.overallTouched === true,
  );

  const [step, setStepRaw] = useState<WizardStep>(
    () => (restored?.step === LAST_STEP ? LAST_STEP : FIRST_STEP),
  );
  const setStep = useCallback((n: WizardStep) => setStepRaw(n), []);

  const setVerdict = useCallback((slug: VerdictSlug) => {
    setState((s) => ({ ...s, verdict: slug }));
  }, []);

  const setOverall = useCallback((v: number) => {
    setOverallTouched(true);
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
          v: DRAFT_VERSION,
          step,
          overallTouched,
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
  }, [courseId, reviewId, step, state, photoCount, videoCount, overallTouched]);

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
    setOverallTouched(isEditMode);
    setRestoredFromDraft(false);
    setRestoredMediaCounts(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, reviewId, existing, isEditMode]);

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
  /* STEP 2 (words and photos) can be passed with nothing: the rating is what
     the flow exists for, and a score with no words is still worth having. */
  const wordsGate = true;
  /* STEP 3 needs a dial the member actually moved AND all four categories.
     Ben's July decision that all four are required is not reopened here. */
  const ratingGate = overallTouched && allCategoriesSet;

  const canSubmit = useMemo(
    () => ratingGate,
    [ratingGate],
  );

  return {
    state,
    step,
    setStep,
    restoredFromDraft,
    discardRestoredDraft,
    restoredMediaCounts,
    acknowledgeRestoredMedia,


    overallTouched,
    setVerdict,
    setOverall,
    setCategory,
    setReviewText,
    setShareToFeed,
    setTeeLabel,
    canSubmit,
    allCategoriesSet,
    catsSet,
    wordsGate,
    ratingGate,
    clearDraft,
  };
}
