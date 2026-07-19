/**
 * useReviewSubmit — thin wrapper around the two v2 RPCs.
 * The client never writes course_ratings/posts/notifications directly.
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ReviewComposerState } from '../types';

interface SubmitArgs {
  courseId: string;
  state: ReviewComposerState;
}

interface SubmitResult {
  ratingId: string;
  shareToFeed: boolean;
}

export function useReviewSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async ({ courseId, state }: SubmitArgs): Promise<SubmitResult> => {
    if (state.overall == null) throw new Error('Overall score required');
    if (
      state.scores.design == null ||
      state.scores.condition == null ||
      state.scores.clubhouse == null ||
      state.scores.facilities == null
    ) {
      throw new Error('All category scores required');
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('submit_course_review_v2', {
        p_course_id: courseId,
        p_rating: state.overall,
        p_design: state.scores.design,
        p_condition: state.scores.condition,
        p_clubhouse: state.scores.clubhouse,
        p_facilities: state.scores.facilities,
        p_review: state.reviewText || undefined,
        p_verdict: state.verdict,
        p_share_to_feed: state.shareToFeed,
      });
      if (error) throw error;

      // Award regional Top 100 badges immediately if this rating
      // completed a milestone -- fire and forget, never block the
      // review UX.
      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (uid) {
          void supabase.functions.invoke('gam-evaluator', {
            body: { user_id: uid, top100_only: true },
          });
        }
      } catch (e) {
        console.warn('[review] top100 badge refresh failed', e);
      }


      // RPC returns Json — accept { rating_id } or { id } or a bare uuid.
      const anyData = data as { rating_id?: string; id?: string } | string | null;
      let ratingId: string | undefined;
      if (typeof anyData === 'string') {
        ratingId = anyData;
      } else if (anyData && typeof anyData === 'object') {
        ratingId = anyData.rating_id ?? anyData.id;
      }
      if (!ratingId) throw new Error('Submit succeeded but no rating id returned');

      return { ratingId, shareToFeed: state.shareToFeed };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const remove = useCallback(async (ratingId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('delete_course_review_v2', {
        p_rating_id: ratingId,
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, remove, submitting, error };
}
