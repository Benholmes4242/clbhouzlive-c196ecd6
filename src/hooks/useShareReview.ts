import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface NotifyReviewSharedParams {
  ratingId: string;
}

interface NotifyReviewSharedResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Post-submission coordination for reviews.
 *
 * ARCHITECTURE (as of 2026-04-21):
 * - Review submitted → course_ratings row inserted.
 * - Each media upload completes → course_review_media row inserted with
 *   status='attached'.
 * - DB trigger `trg_create_post_from_review_media` creates the posts row
 *   on the first attached media insert (idempotent).
 * - DB trigger `trg_sync_review_media_to_post_media` copies each
 *   course_review_media row into post_media as it arrives (idempotent).
 *
 * The client does NOT copy media. The DB is authoritative. This hook's only
 * job is to:
 *   - Look up the post row (if it exists) once media has settled.
 *   - Invalidate feed queries so the new review appears on next read.
 *   - Fire the analytics event with ACCURATE media counts read from
 *     post_media (not from submission-time state).
 *
 * RATING-ONLY REVIEWS: if the user submits a rating with no media, the DB
 * trigger never creates a post row and the lookup returns null. We skip feed
 * invalidation and analytics in that case. Rating-only reviews intentionally
 * do not appear in the Clubhouse feed (they still count toward played courses,
 * stats, badges, and leaderboards, and still render on the course detail page).
 */
export function useShareReview() {
  const [isSharing, setIsSharing] = useState(false);
  const queryClient = useQueryClient();

  const notifyReviewShared = async ({
    ratingId,
  }: NotifyReviewSharedParams): Promise<NotifyReviewSharedResult> => {
    setIsSharing(true);
    try {
      const { data: post, error: lookupError } = await supabase
        .from('posts')
        .select('id')
        .eq('source_review_id', ratingId)
        .eq('actor_type', 'personal')
        .maybeSingle();

      if (lookupError) {
        console.error('[notifyReviewShared] Post lookup failed:', lookupError);
        return { success: false, error: lookupError.message };
      }

      if (!post) {
        // Rating-only review — no feed-facing side effects.
        return { success: true };
      }

      // Count media that has actually landed in post_media (after trigger settle).
      const { data: mediaRows } = await supabase
        .from('post_media')
        .select('id, media_type')
        .eq('post_id', post.id);

      const mediaCount = mediaRows?.length ?? 0;
      const hasVideo = (mediaRows ?? []).some((m) => m.media_type === 'video');

      // Invalidate every feed query that could be rendering this new review.
      queryClient.invalidateQueries({ queryKey: ['media-feed'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-followed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['actor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['activity-posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['followedUsersPosts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-content'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pinned-posts'] });
      queryClient.invalidateQueries({ queryKey: ['featured-post'] });
      queryClient.invalidateQueries({ queryKey: ['creator-features'] });
      queryClient.invalidateQueries({ queryKey: ['clubhouse-shorts'] });
      queryClient.invalidateQueries({ queryKey: ['friends-shorts'] });
      queryClient.invalidateQueries({ queryKey: ['review-shared', ratingId] });

      window.dispatchEvent(new CustomEvent('postCreated'));

      analyticsEvents.track('ratings.review_shared', {
        ratingId,
        postId: post.id,
        mediaCount,
        hasVideo,
      });

      return { success: true, postId: post.id };
    } catch (err: any) {
      console.error('[notifyReviewShared] Error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSharing(false);
    }
  };

  return { notifyReviewShared, isSharing };
}
