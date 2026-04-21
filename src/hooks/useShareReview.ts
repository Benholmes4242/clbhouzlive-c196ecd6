import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface ReviewMedia {
  id: string;
  media_url: string;
  media_type: string;
  poster_url: string | null;
  stream_id: string | null;
  is_cover?: boolean;
}

interface ShareReviewParams {
  ratingId: string;
  courseId: string;
  reviewText: string | null;
  media: ReviewMedia[];
}

interface ShareReviewResult {
  success: boolean;
  postId?: string;
  alreadyShared?: boolean;
  error?: string;
}

export function useShareReview() {
  const [isSharing, setIsSharing] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Attaches media uploads to the post row that was auto-created by the
   * `trg_create_post_from_review_media` database trigger.
   *
   * ARCHITECTURE:
   * - When a user submits a review, a `course_ratings` row is created first.
   * - As media uploads complete, `course_review_media` rows are inserted with
   *   status='attached'.
   * - The first successful media insert fires a DB trigger that creates the
   *   corresponding `posts` row (source_review_id = ratingId).
   * - This function then copies the `course_review_media` rows into `post_media`
   *   so they render in the Clubhouse feed.
   *
   * RATING-ONLY REVIEWS:
   * If a review has NO media (rating-only), no post row ever gets created by
   * the trigger. This function's post lookup will return null, and it will
   * no-op gracefully — rating-only reviews intentionally do not appear in the
   * Clubhouse feed or profile Posts tab per product rule. They still appear
   * on the course detail page (About + Reviews tabs) and still count toward
   * played courses, badges, leaderboards, and all other stats.
   *
   * RACE-FREE BY DESIGN:
   * This function was previously the SOLE creator of the post row (via a
   * client-side useEffect), which caused 37 orphaned reviews across 9 users
   * when the user closed the app mid-upload. Post creation now lives in a
   * DB trigger, making it race-free. This function remains responsible only
   * for the media copy.
   */
  const attachMediaToPost = async ({
    ratingId,
    media,
  }: { ratingId: string; media: ReviewMedia[] }): Promise<ShareReviewResult> => {
    setIsSharing(true);

    try {
      // Find the post row created by the DB trigger
      const { data: post, error: lookupError } = await supabase
        .from('posts')
        .select('id')
        .eq('source_review_id', ratingId)
        .eq('actor_type', 'personal')
        .maybeSingle();

      if (lookupError) {
        console.error('[attachMediaToPost] Post lookup failed:', lookupError);
        throw new Error('Could not find post row for this review');
      }

      if (!post) {
        // Post row doesn't exist — could mean the user opted out via "Remove
        // from Clubhouse", or (extremely unlikely) the trigger didn't fire.
        // Either way: nothing to attach to.
        console.warn('[attachMediaToPost] No post row found for rating', ratingId);
        return { success: false, error: 'No post row to attach media to' };
      }

      const postId = post.id;

      // Idempotency: if media already attached (e.g., re-running after partial failure), skip
      const { data: existingMedia } = await supabase
        .from('post_media')
        .select('id')
        .eq('post_id', postId)
        .limit(1);

      if (existingMedia && existingMedia.length > 0) {
        console.log('[attachMediaToPost] Media already attached, skipping');
        return { success: true, postId, alreadyShared: true };
      }

      // Copy media — cover photo first, then preserve original order
      if (media.length > 0) {
        const coverIndex = media.findIndex(m => m.is_cover === true);
        const ordered = coverIndex > 0
          ? [media[coverIndex], ...media.filter((_, i) => i !== coverIndex)]
          : [...media];

        const mediaInserts = ordered.map((m, i) => ({
          post_id: postId,
          media_type: m.media_type,
          media_url: m.media_url,
          poster_url: m.poster_url,
          stream_id: m.stream_id,
          display_order: i,
        }));

        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaInserts);

        if (mediaError) {
          console.error('[attachMediaToPost] Failed to insert post_media:', mediaError);
          // Don't delete the post — text-only review post is still valid content
          throw new Error('Failed to attach media to post');
        }
      }

      // Invalidate feed queries so new content appears immediately
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

      window.dispatchEvent(new CustomEvent('postCreated'));

      analyticsEvents.track('ratings.review_shared', {
        ratingId,
        postId,
        mediaCount: media.length,
        hasVideo: media.some(m => m.media_type === 'video'),
      });

      return { success: true, postId };
    } catch (err: any) {
      console.error('[attachMediaToPost] Error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSharing(false);
    }
  };

  // Backward-compat alias — keep `shareReview` exported but route to new impl.
  // courseId and reviewText params are now ignored (the DB trigger handles
  // post creation using the rating row's data).
  const shareReview = async (params: ShareReviewParams): Promise<ShareReviewResult> => {
    return attachMediaToPost({
      ratingId: params.ratingId,
      media: params.media,
    });
  };

  return { shareReview, attachMediaToPost, isSharing };
}
