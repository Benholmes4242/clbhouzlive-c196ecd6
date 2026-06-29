// PendingPostsController — subscribes the pendingPostsStore to the upload event bus.
//
// Lifecycle wiring:
//   post:shell-created       → attachPostId  (status → 'uploading')
//   file:upload-progress     → updateProgress
//   file:upload-complete     → updateProgress(100)
//   upload:failed            → markFailed (Retry button enabled)
//   upload:complete          → invalidate-then-remove-after-microtask
//                              (belt-and-braces: selector filters out pending
//                               whose postId already lives in real rows)
//
// NOTE: Cache invalidation for completed uploads still lives in
// UploadToastsBridge. We only schedule the removal here, so that the
// pending card stays visible until the real row is in the cache. The
// selector double-checks by post id to prevent a duplicate flash.

import { useEffect } from 'react';
import { uploadEventBus } from './uploadEventBus';
import { usePendingPostsStore } from './pendingPostsStore';

export function PendingPostsController() {
  useEffect(() => {
    const offShell = uploadEventBus.on('post:shell-created', (evt) => {
      usePendingPostsStore.getState().attachPostId(evt.jobId, evt.postId);
    });

    const offProgress = uploadEventBus.on('file:upload-progress', (evt) => {
      usePendingPostsStore.getState().updateProgress(evt.jobId, evt.fileId, evt.progress);
    });

    const offFileComplete = uploadEventBus.on('file:upload-complete', (evt) => {
      usePendingPostsStore.getState().updateProgress(evt.jobId, evt.fileId, 100);
    });

    const offFailed = uploadEventBus.on('upload:failed', (evt) => {
      // Only mark pending entries (post type). Review failures don't live in this store.
      const store = usePendingPostsStore.getState();
      if (store.byJobId[evt.jobId]) {
        store.markFailed(evt.jobId, evt.error || 'Upload failed');
      }
    });

    const offComplete = uploadEventBus.on('upload:complete', (evt) => {
      // Defer removal so the invalidation triggered by UploadToastsBridge
      // has a chance to begin refetching the feed before we drop the card.
      // The selector's belt-and-braces (filter by known postId) prevents
      // any duplicate flash.
      queueMicrotask(() => {
        usePendingPostsStore.getState().removeJob(evt.jobId);
      });
    });

    return () => {
      offShell();
      offProgress();
      offFileComplete();
      offFailed();
      offComplete();
    };
  }, []);

  return null;
}
