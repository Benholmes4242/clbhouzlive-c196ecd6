import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

  const shareReview = async ({
    ratingId,
    courseId,
    reviewText,
    media,
  }: ShareReviewParams): Promise<ShareReviewResult> => {
    setIsSharing(true);

    try {
      // 1) Get current user
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id;
      if (!userId) {
        throw new Error('Not authenticated');
      }

      // 2) Idempotency check: see if this review was already shared
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('source_review_id', ratingId)
        .eq('actor_type', 'personal')
        .eq('actor_id', userId)
        .maybeSingle();

      if (existingPost) {
        toast('Already shared', { description: 'This review has already been shared to your profile.' });
        return { success: true, postId: existingPost.id, alreadyShared: true };
      }

      // 3) Create the post row
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          actor_type: 'personal',
          actor_id: userId,
          course_id: courseId,
          content: reviewText || null,
          visibility: 'anyone',
          source_review_id: ratingId,
          categories: ['review'],
          status: 'published',
        })
        .select('id')
        .single();

      if (postError) {
        console.error('[ShareReview] Failed to create post:', postError);
        throw new Error('Failed to share review');
      }

      const postId = post.id;

      // 4) Copy media from course_review_media to post_media
      if (media.length > 0) {
        // Sort: cover photo first, then preserve original order
        const coverIndex = media.findIndex(m => m.is_cover === true);
        let ordered: ReviewMedia[];
        if (coverIndex > 0) {
          // Move the cover to display_order: 0
          const cover = media[coverIndex];
          ordered = [cover, ...media.filter((_, i) => i !== coverIndex)];
        } else {
          ordered = [...media];
        }

        // Insert into post_media with display_order
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
          console.error('[ShareReview] Failed to insert post_media:', mediaError);
          // Clean up the orphaned post
          await supabase.from('posts').delete().eq('id', postId);
          throw new Error('Failed to attach media to post');
        }
      }

      // 5) Invalidate all post-related query keys so feeds refresh immediately
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

      // 6) Dispatch window events so any listening components refresh
      window.dispatchEvent(new CustomEvent('postCreated'));

      // 7) Analytics
      analyticsEvents.track('ratings.review_shared', {
        courseId,
        ratingId,
        postId,
        mediaCount: media.length,
        hasVideo: media.some(m => m.media_type === 'video'),
      });

      toast.success('Review shared', { description: 'Your review is now visible in Clubhouse and on your profile.' });

      return { success: true, postId };
    } catch (err: any) {
      console.error('[ShareReview] Error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
      return { success: false, error: err.message };
    } finally {
      setIsSharing(false);
    }
  };

  return { shareReview, isSharing };
}