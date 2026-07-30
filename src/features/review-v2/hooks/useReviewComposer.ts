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

function draftKey(courseId: string | null | undefined) {
  return `review-draft:${courseId ?? 'unknown'}`;
}

interface DraftShape {
  step: WizardStep;
  overall: number | null;
  scores: Record<CategoryKey, number | null>;
  reviewText: string;
  shareToFeed: boolean;
  teeLabel: string | null;
  savedAt: number;
}

function readDraft(courseId: string | null | undefined): DraftShape | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(draftKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftShape;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(courseId: string | null | undefined, draft: DraftShape) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(draftKey(courseId), JSON.stringify(draft));
  } catch {
    /* private browsing throws */
  }
}

export function clearReviewDraft(courseId: string | null | undefined) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(draftKey(courseId));
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

export function useReviewComposer(
  existing?: ExistingReview | null,
  courseId?: string | null,
) {
  const isEditMode = !!existing;

  // In edit mode the existing review always wins; drafts are create-mode only.
  const restored = useMemo(
    () => (isEditMode ? null : readDraft(courseId)),
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

  // Debounced draft write. Create mode only; media is never persisted.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isEditMode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeDraft(courseId, {
        step,
        overall: state.overall,
        scores: state.scores,
        reviewText: state.reviewText,
        shareToFeed: state.shareToFeed,
        teeLabel: state.teeLabel,
        savedAt: Date.now(),
      });
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isEditMode, courseId, step, state]);

  const clearDraft = useCallback(() => clearReviewDraft(courseId), [courseId]);

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
