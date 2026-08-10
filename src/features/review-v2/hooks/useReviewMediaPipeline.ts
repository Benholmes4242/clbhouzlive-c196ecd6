/**
 * useReviewMediaPipeline — fresh media orchestration for review-v2.
 *
 * Reuses platform primitives (Cloudflare Stream TUS + R2 upload edge
 * function) but manages its own per-item state, retries, and DB row
 * inserts. Media is HELD LOCALLY until the caller invokes flushToReview(),
 * which uploads each pending item and inserts a course_review_media row
 * (review_id = rating_id, status = 'attached').
 *
 * Visibility (pending card): flushToReview() also registers ONE pending
 * job with usePendingPostsStore (kind:'review') so the author's profile
 * Posts tab renders a "Review · Posting…" card while uploads run. This
 * store integration is visibility-only — execution stays in this hook.
 * The hard-fenced UploadManager / uploadPipeline are NEVER called from
 * the review path.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { usePendingPostsStore, type PendingPost } from '@/uploads/pendingPostsStore';
import { reviewRetryRegistry } from '@/uploads/reviewRetryRegistry';
import { REVIEW_V2_LIMITS } from '../tokens';
import type { ExistingMedia, MediaItem } from '../types';

const REVIEW_R2_BUCKET = 'clbhouz-review-images';

function nid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata'));
    };
    v.src = url;
  });
}

async function probeImageDims(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export interface ReviewPipelineIdentity {
  actorType: 'personal' | 'business';
  actorId: string;
  viewerActorType: 'personal' | 'business';
  viewerActorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;
  courseId?: string;
  courseName?: string;
}

interface UseReviewMediaPipelineArgs {
  userId: string | null;
  existingMedia?: ExistingMedia[];
  /** Required to register a pending card on flush. Omit → no card. */
  identity?: ReviewPipelineIdentity;
}

interface ActiveJob {
  jobId: string;
  reviewId: string;
}

export function useReviewMediaPipeline({ userId, existingMedia, identity }: UseReviewMediaPipelineArgs) {
  const [items, setItems] = useState<MediaItem[]>(() =>
    (existingMedia ?? []).map<MediaItem>((m) => ({
      id: `existing-${m.id}`,
      dbRowId: m.id,
      type: m.media_type === 'video' ? 'video' : 'image',
      previewUrl: m.poster_url ?? m.media_url,
      posterUrl: m.poster_url ?? null,
      streamId: m.stream_id ?? null,
      uploadedUrl: m.media_url,
      status: 'existing',
      progress: 100,
      isExisting: true,
    })),
  );
  const [pickerError, setPickerError] = useState<string | null>(null);

  // Revoke blob URLs on unmount to prevent leaks.
  const blobUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch { /* noop */ }
      });
    };
  }, []);

  const registerBlob = (url: string) => {
    blobUrlsRef.current.add(url);
    return url;
  };

  // Refs so callbacks (e.g. retry) always see current items / active job.
  const itemsRef = useRef<MediaItem[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const activeJobRef = useRef<ActiveJob | null>(null);
  const identityRef = useRef<ReviewPipelineIdentity | undefined>(identity);
  useEffect(() => { identityRef.current = identity; }, [identity]);

  const addFiles = useCallback(
    async (files: File[]) => {
      setPickerError(null);
      let currentCount = items.length;

      for (const file of files) {
        if (currentCount >= REVIEW_V2_LIMITS.MAX_MEDIA) {
          setPickerError('Reviews carry up to 10 photos or clips.');
          break;
        }

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
          try {
            const dur = await probeVideoDuration(file);
            if (dur > REVIEW_V2_LIMITS.MAX_VIDEO_SECONDS) {
              setPickerError('Videos need to be 3 minutes or under.');
              continue;
            }
            const preview = registerBlob(URL.createObjectURL(file));
            const item: MediaItem = {
              id: nid(),
              file,
              type: 'video',
              previewUrl: preview,
              posterUrl: null,
              status: 'pending',
              progress: 0,
              durationSeconds: dur,
            };
            setItems((prev) => [...prev, item]);
            currentCount++;
          } catch {
            setPickerError('Could not read video.');
          }
        } else {
          const dims = await probeImageDims(file);
          const preview = registerBlob(URL.createObjectURL(file));
          const item: MediaItem = {
            id: nid(),
            file,
            type: 'image',
            previewUrl: preview,
            status: 'pending',
            progress: 0,
            width: dims?.width ?? null,
            height: dims?.height ?? null,
          };
          setItems((prev) => [...prev, item]);
          currentCount++;
        }
      }
    },
    [items.length],
  );

  const removeItem = useCallback(async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    setItems((prev) => prev.filter((i) => i.id !== id));

    // Existing media -> delete DB row + cleanup asset.
    if (target.isExisting && target.dbRowId) {
      await supabase.from('course_review_media').delete().eq('id', target.dbRowId);
      supabase.functions
        .invoke('cleanup-review-media', {
          body: {
            mediaItems: [{
              id: target.dbRowId,
              media_url: target.uploadedUrl ?? '',
              media_type: target.type,
              stream_id: target.streamId ?? null,
            }],
          },
        })
        .catch((err) => { console.warn('[review-v2] cleanup-review-media failed', err); });
      return;
    }

    // In-flight uploads: DB row may or may not exist yet.
    if (target.dbRowId) {
      await supabase.from('course_review_media').delete().eq('id', target.dbRowId);
    }
    if (target.streamId) {
      supabase.functions
        .invoke('cleanup-review-media', {
          body: {
            mediaItems: [{
              id: target.dbRowId ?? target.id,
              media_url: target.uploadedUrl ?? '',
              media_type: 'video',
              stream_id: target.streamId,
            }],
          },
        })
        .catch((err) => { console.warn('[review-v2] cleanup-review-media failed', err); });
    }
  }, [items]);


  const updateItem = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    // Mirror progress into the pending-card store when a review flush is active.
    const active = activeJobRef.current;
    if (active && typeof patch.progress === 'number') {
      usePendingPostsStore.getState().updateProgress(active.jobId, id, patch.progress);
    }
  }, []);

  const uploadOne = useCallback(
    async (item: MediaItem, reviewId: string): Promise<void> => {
      if (!userId || !item.file) return;

      updateItem(item.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        if (item.type === 'video') {
          const streamId: string = await new Promise((resolve, reject) => {
            uploadVideoResilient({
              file: item.file!,
              onProgress: (loaded, total) => {
                updateItem(item.id, {
                  progress: total > 0 ? Math.round((loaded / total) * 100) : 0,
                });
              },
              onSuccess: (sid) => resolve(sid),
              onError: (err) => reject(err),
            }).catch(reject);
          });

          const hls = generateStreamHlsUrl(streamId);
          const poster = generateStreamThumbnailUrl(streamId);

          const { data: row, error: insErr } = await supabase
            .from('course_review_media')
            .insert({
              review_id: reviewId,
              media_url: hls,
              media_type: 'video',
              stream_id: streamId,
              poster_url: poster,
              file_name: item.file.name,
              file_size: item.file.size,
              status: 'attached',
              owner_user_id: userId,
              duration_seconds: item.durationSeconds ?? null,
            })
            .select('id')
            .single();

          if (insErr) throw insErr;

          updateItem(item.id, {
            status: 'ready',
            progress: 100,
            streamId,
            uploadedUrl: hls,
            posterUrl: poster,
            dbRowId: row?.id ?? null,
          });
          return;
        }

        // Image via R2 edge function.
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}-${item.file.name}`;
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('fileName', fileName);
        formData.append('bucketName', REVIEW_R2_BUCKET);

        // No native progress from supabase.functions.invoke; simulate a bump.
        updateItem(item.id, { progress: 30 });

        const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
          body: formData,
        });
        if (error) throw error;
        if (!data?.success || !data?.publicUrl) throw new Error(data?.error || 'Image upload failed');

        const dims = item.width && item.height
          ? { width: item.width, height: item.height, aspect_ratio: parseFloat((item.width / item.height).toFixed(4)) }
          : {};

        const { data: row, error: insErr } = await supabase
          .from('course_review_media')
          .insert({
            review_id: reviewId,
            media_url: data.publicUrl,
            media_type: 'image',
            file_name: item.file.name,
            file_size: item.file.size,
            status: 'attached',
            owner_user_id: userId,
            ...dims,
          })
          .select('id')
          .single();

        if (insErr) throw insErr;

        updateItem(item.id, {
          status: 'ready',
          progress: 100,
          uploadedUrl: data.publicUrl,
          dbRowId: row?.id ?? null,
        });
      } catch (e) {
        updateItem(item.id, {
          status: 'failed',
          error: e instanceof Error ? e.message : 'Upload failed',
        });
      }
    },
    [userId, updateItem],
  );

  // Flush every pending/failed item to the given review. Registers ONE
  // pending-card job for the whole flush (visibility only). On completion:
  //   - all items ready → removeJob (card disappears)
  //   - any item failed → markFailed (Retry primed via reviewRetryRegistry)
  const flushToReview = useCallback(
    async (
      reviewId: string,
      opts?: { caption?: string; queryClient?: QueryClient },
    ) => {
      const pending = itemsRef.current.filter((i) => i.status === 'pending' || i.status === 'failed');
      if (pending.length === 0) return;

      // Cache sweeps: the composer hands us the QueryClient explicitly so the
      // reference survives its unmount (flushToReview is fire-and-forget).
      // Per-item sweep throttled to one every 2s; final sweep in finally().
      const qc = opts?.queryClient ?? null;
      let lastSweepAt = 0;
      const sweep = (force: boolean) => {
        if (!qc) return;
        const now = Date.now();
        if (!force && now - lastSweepAt < SWEEP_THROTTLE_MS) return;
        lastSweepAt = now;
        invalidateCourseRatingCaches(qc);
      };


      const store = usePendingPostsStore.getState();
      const ident = identityRef.current;

      // Register pending card only when we have identity (composer wires it).
      let jobId: string | null = null;
      if (ident && userId) {
        jobId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `rv2-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const entry: PendingPost = {
          jobId,
          kind: 'review',
          postId: null,
          reviewId,
          actorType: ident.actorType,
          actorId: ident.actorId,
          userId,
          viewerActorType: ident.viewerActorType,
          viewerActorId: ident.viewerActorId,
          authorName: ident.authorName,
          authorAvatarUrl: ident.authorAvatarUrl,
          authorUsername: ident.authorUsername,
          caption: (opts?.caption ?? '').trim() || (ident.courseName ? `Review · ${ident.courseName}` : 'New review'),
          media: pending.map((it) => ({ id: it.id, kind: it.type, previewUrl: it.previewUrl })),
          courseId: ident.courseId,
          courseName: ident.courseName,
          totalFiles: pending.length,
          fileProgress: {},
          status: 'uploading',
          files: [], // review pipeline owns its own File refs; no re-enqueue via UploadManager.
          createdAt: new Date().toISOString(),
        };
        store.addPending(entry);
        activeJobRef.current = { jobId, reviewId };

        // Retry primitive for the review branch of PendingPostCard.
        reviewRetryRegistry.register(jobId, async () => {
          const failed = itemsRef.current.filter((i) => i.status === 'failed');
          if (failed.length === 0) return;
          activeJobRef.current = { jobId: jobId!, reviewId };
          for (const it of failed) {
            // eslint-disable-next-line no-await-in-loop
            await uploadOne(it, reviewId);
          }
          const anyStillFailed = itemsRef.current.some((i) => i.status === 'failed');
          if (anyStillFailed) {
            usePendingPostsStore.getState().markFailed(jobId!, 'Some items failed');
          } else {
            usePendingPostsStore.getState().removeJob(jobId!);
            reviewRetryRegistry.unregister(jobId!);
            activeJobRef.current = null;
          }
        });
      }

      try {
        for (const it of pending) {
          // Skip items removed since dispatch.
          if (!itemsRef.current.find((c) => c.id === it.id)) continue;
          // eslint-disable-next-line no-await-in-loop
          await uploadOne(it, reviewId);
        }
      } finally {
        if (jobId) {
          const anyFailed = itemsRef.current.some((i) => i.status === 'failed');
          if (anyFailed) {
            usePendingPostsStore.getState().markFailed(jobId, 'Some items failed');
          } else {
            usePendingPostsStore.getState().removeJob(jobId);
            reviewRetryRegistry.unregister(jobId);
            activeJobRef.current = null;
          }
        }
      }
    },
    [userId, uploadOne],
  );

  const retryItem = useCallback(
    async (id: string, reviewId: string) => {
      const it = itemsRef.current.find((i) => i.id === id);
      if (!it) return;
      await uploadOne(it, reviewId);
    },
    [uploadOne],
  );

  const hasNewMedia = useCallback(() => items.some((i) => !i.isExisting), [items]);

  return {
    items,
    addFiles,
    removeItem,
    flushToReview,
    retryItem,
    pickerError,
    clearPickerError: () => setPickerError(null),
    count: items.length,
    hasNewMedia,
  };
}
