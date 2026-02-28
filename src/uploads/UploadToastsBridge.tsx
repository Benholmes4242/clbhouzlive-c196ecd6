// Upload toasts bridge - shows toast notifications for upload events
// Also handles cache invalidation when uploads complete

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadEventBus } from './uploadEventBus';
import { postKeys } from '@/queryKeys/posts';

const TOAST_DURATION_MS = 2000;
const TOAST_DURATION_ERROR_MS = 4000;

export function UploadToastsBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const offEnqueued = uploadEventBus.on('upload:enqueued', (evt) => {
      toast("Uploading...", {
        description: "Your post will appear soon.",
        duration: TOAST_DURATION_MS,
      });
    });

    const offComplete = uploadEventBus.on('upload:complete', (evt) => {
      // PostSuccessScreen handles all post-success feedback — no toast here

      // Still invalidate queries so content appears
      if (evt.isScheduled) {
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts-count'] });
      }

      if (evt.actorType && evt.actorId) {
        queryClient.invalidateQueries({ 
          queryKey: postKeys.actorPosts(evt.actorType, evt.actorId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: postKeys.actorPostsCount(evt.actorType, evt.actorId) 
        });
      }
      
      queryClient.invalidateQueries({ 
        queryKey: postKeys.trending() 
      });
    });

    const offFailed = uploadEventBus.on('upload:failed', (evt) => {
      toast.error("Upload failed", {
        description: evt.error || "Tap to retry",
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