// Upload toasts bridge - shows toast notifications for upload events
// Also handles cache invalidation when uploads complete

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { uploadEventBus } from './uploadEventBus';
import { postKeys } from '@/queryKeys/posts';
import { deleteDraft } from '@/services/drafts/draftService';
import { uploadManager } from './UploadManager';
import { triggerHaptic } from '@/lib/ui/haptics';
import { formatWeekdayMonthDayShortUS, formatTimeHmUS } from '@/i18n/format';


const TOAST_DURATION_ERROR_MS = 4000;

export function UploadToastsBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const offEnqueued = uploadEventBus.on('upload:enqueued', (_evt) => {
      // No toast on enqueue — banner already reflects queued state.
    });

    const offComplete = uploadEventBus.on('upload:complete', (evt) => {
      // Toast copy per kind.
      if (evt.isScheduled) {
        toast.success('Post scheduled', {
          description: evt.scheduledAt
            ? `Goes live ${formatWeekdayMonthDayShortUS(new Date(evt.scheduledAt))} at ${formatTimeHmUS(new Date(evt.scheduledAt))}`
            : undefined,

          duration: 4000,
        });
      } else if (evt.uploadType === 'review') {
        toast.success('Your review is live', { duration: 4000 });
        triggerHaptic('success');
      } else {
        toast.success('Your moment is live.', { duration: 4000 });
        triggerHaptic('success');
      }

      // Scheduled list refresh.
      if (evt.isScheduled) {
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts-count'] });
      }

      // Author-scoped post lists / counts.
      if (evt.actorType && evt.actorId) {
        queryClient.invalidateQueries({
          queryKey: postKeys.actorPosts(evt.actorType, evt.actorId),
        });
        queryClient.invalidateQueries({
          queryKey: postKeys.actorPostsCount(evt.actorType, evt.actorId),
        });
      }

      queryClient.invalidateQueries({ queryKey: postKeys.trending() });

      // Real feed query keys (the ones the feeds actually use).
      queryClient.invalidateQueries({ queryKey: ['videos-feed'] });
      queryClient.invalidateQueries({ queryKey: ['friends-feed'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed'] });

      // Legacy CustomEvent — recentMediaListener + a few hooks still listen.
      if (!evt.isScheduled && evt.uploadType !== 'review' && evt.postId) {
        try {
          window.dispatchEvent(
            new CustomEvent('postCompleted', {
              detail: { optimisticId: null, realPost: { id: evt.postId } },
            }),
          );
        } catch (err) {
          console.warn('[UploadToastsBridge] postCompleted dispatch failed:', err);
        }
      }

      // Delete the resumed draft (if any).
      const job = uploadManager.getJob(evt.jobId);
      const draftId = (job as any)?.draftId as string | undefined;
      if (draftId) {
        void deleteDraft(draftId).catch((err) =>
          console.warn('[UploadToastsBridge] deleteDraft failed:', err),
        );
      }
    });

    const offFailed = uploadEventBus.on('upload:failed', (evt) => {
      toast.error('Upload failed', {
        description: evt.error || 'Tap to retry',
        duration: TOAST_DURATION_ERROR_MS,
      });
    });

    return () => {
      offEnqueued();
      offComplete();
      offFailed();
    };
  }, [queryClient]);

  return null;
}
