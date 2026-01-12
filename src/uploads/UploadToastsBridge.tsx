// Upload toasts bridge - shows toast notifications for upload events
// Also handles cache invalidation when uploads complete

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { uploadEventBus } from './uploadEventBus';
import { postKeys } from '@/queryKeys/posts';

const TOAST_DURATION_MS = 2000;
const TOAST_DURATION_ERROR_MS = 4000;

export function UploadToastsBridge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const offEnqueued = uploadEventBus.on('upload:enqueued', (evt) => {
      toast({
        title: "Uploading...",
        description: "Your post will appear soon.",
        duration: TOAST_DURATION_MS,
      });
    });

    const offComplete = uploadEventBus.on('upload:complete', (evt) => {
      // Don't show "Posted" toast for scheduled posts - they have their own toast
      if (evt.isScheduled) {
        console.log('[UploadToastsBridge] Skipping toast for scheduled post');
        // Still invalidate scheduled posts query
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts-count'] });
        return;
      }
      
      // Show success toast for immediately published posts
      toast({
        title: "Posted ✓",
        description: "Now live on clbhouz",
        duration: TOAST_DURATION_MS,
      });

      // Invalidate the actor-scoped feed so media appears immediately
      if (evt.actorType && evt.actorId) {
        queryClient.invalidateQueries({ 
          queryKey: postKeys.actorPosts(evt.actorType, evt.actorId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: postKeys.actorPostsCount(evt.actorType, evt.actorId) 
        });
      }
      
      // Also invalidate trending for good measure
      queryClient.invalidateQueries({ 
        queryKey: postKeys.trending() 
      });
    });

    const offFailed = uploadEventBus.on('upload:failed', (evt) => {
      toast({
        title: "Upload failed",
        description: evt.error || "Tap to retry",
        variant: "destructive",
        duration: TOAST_DURATION_ERROR_MS,
      });
    });

    return () => {
      offEnqueued();
      offComplete();
      offFailed();
    };
  }, [toast, queryClient]);

  return null;
}
