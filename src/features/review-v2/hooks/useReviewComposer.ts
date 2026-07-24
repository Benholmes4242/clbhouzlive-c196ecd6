/**
 * useReviewComposer — pure state container for the composer.
 * No I/O; the shell wires this into hooks/useReviewSubmit and
 * hooks/useReviewMediaPipeline.
 */

import { useCallback, useMemo, useState } from 'react';
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

export function useReviewComposer(existing?: ExistingReview | null, hasNewMedia?: () => boolean) {
  const [state, setState] = useState<ReviewComposerState>(() => seedFromExisting(existing));

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

  const allCategoriesSet = useMemo(
    () =>
      state.scores.design != null &&
      state.scores.condition != null &&
      state.scores.clubhouse != null &&
      state.scores.facilities != null,
    [state.scores],
  );

  const canSubmit = useMemo(
    () => state.overall != null && allCategoriesSet,
    [state.overall, allCategoriesSet],
  );

  const progressPct = useMemo(() => {
    // Buckets: overall + categories (all four) + words-or-skip + media-or-skip
    const total = 4;
    let filled = 0;
    if (state.overall != null) filled++;
    if (allCategoriesSet) filled++;
    if (state.reviewText.trim().length > 0) filled++;
    if (hasNewMedia && hasNewMedia()) filled++;
    return Math.round((filled / total) * 100);
  }, [state, allCategoriesSet, hasNewMedia]);

  return {
    state,
    setVerdict,
    setOverall,
    setCategory,
    setReviewText,
    setShareToFeed,
    setTeeLabel,
    canSubmit,
    allCategoriesSet,
    progressPct,
  };
}
