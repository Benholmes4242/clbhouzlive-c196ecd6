/** Both instant and staged review publication call this after a real review id
 * exists. Tag diagnostics and mention-sync failures never undo the review;
 * server triggers alone own notifications. */
import { reportPostWithError } from '@/features/post-v2/lib/postWithError';
import { syncMentionsForContent } from '@/lib/mentions/syncMentions';
import { syncReviewWith, writeReviewWith } from './reviewWith';
import type { PostWithError } from '@/features/post-v2/lib/postWith';

export async function saveReviewSocial({ reviewId, userId, content, previous, next, edit, personal }: {
  reviewId: string; userId: string; content: string; previous: readonly string[]; next: readonly string[]; edit: boolean; personal: boolean;
}): Promise<void> {
  if (personal) {
    const mode = edit ? 'review_edit' : 'review_create';
    try {
      const error = edit ? await syncReviewWith(reviewId, userId, previous, next) : (await writeReviewWith(reviewId, userId, next)).error;
      reportPostWithError(error, next.length, mode);
    } catch (cause) {
      const error = cause as Partial<PostWithError> | null;
      reportPostWithError({ code: error?.code ?? null, message: error?.message ?? "Couldn't save the tags", details: error?.details ?? null, hint: error?.hint ?? null }, next.length, mode);
    }
  }
  try {
    await syncMentionsForContent({ sourceType: 'review', sourceId: reviewId, content, mentionerId: userId });
  } catch (error) {
    console.warn('[review-v2] mention sync failed:', error);
  }
}