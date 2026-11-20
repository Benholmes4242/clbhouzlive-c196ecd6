/** Create and edit share error presentation; diagnostics never undo the post
 * or imply that unsaved tags were published. Writes/notifications stay in postWith. */
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { PostWithError } from './postWith';

export function reportPostWithError(error: PostWithError | null, count: number, mode: 'create' | 'edit' | 'review_create' | 'review_edit'): void {
  if (!error) return;
  toast.error(`Couldn't save who you played with. ${error.message}${error.code ? ` (${error.code})` : ''}`, { duration: 8000 });
  void analyticsEvents.track('post_with_write_failed', { ...error, count, mode });
}