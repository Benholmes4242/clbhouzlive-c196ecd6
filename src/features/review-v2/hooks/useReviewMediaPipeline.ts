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
import type { QueryClient } from '@tanstack/react-query';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { usePendingPostsStore, type PendingPost } from '@/uploads/pendingPostsStore';
import { reviewRetryRegistry } from '@/uploads/reviewRetryRegistry';
import { startReviewUpload } from '../lib/reviewUploadController';
import { REVIEW_V2_LIMITS } from '../tokens';
import type { ExistingMedia, MediaItem } from '../types';

/*
 * R1 §1.4a — there is no bucket constant here any more. The client used to
 * append `bucketName: 'clbhouz-review-images'` while the edge function reads
 * `bucketType`, so the name was decorative: every review image has always
 * landed in bucket clbhouz-media under <user>/course-media/, which the 468
 * live urls confirm. The parameter and the constant are gone; the function's
 * own `bucketType || 'course-media'` fallback preserves today's destination
 * exactly. Moving existing files is a separate, unauthorised migration.
 */

/** Per-item cache sweeps are throttled to at most one every 2s. */
const SWEEP_THROTTLE_MS = 2000;

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
        // No bucket parameter — see the note at the top of this file.

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
          sweep(true);
        });
      }

      try {
        for (const it of pending) {
          // Skip items removed since dispatch.
          if (!itemsRef.current.find((c) => c.id === it.id)) continue;
          // eslint-disable-next-line no-await-in-loop
          await uploadOne(it, reviewId);
          // Item landed (or failed) — let mounted surfaces pick it up.
          if (itemsRef.current.find((c) => c.id === it.id)?.status === 'ready') sweep(false);
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
        // Final, unthrottled sweep — fires on success, partial failure, or
        // after the composer has unmounted mid-flight.
        sweep(true);
      }
    },
    [userId, uploadOne],
  );

  /* ---------------------------------------------------------------------
   * R1 §1.1 — THE INVERTED ORDER. uploadPendingMedia() then attachToReview().
   *
   * The old order was: RPC -> receipt -> upload (20s) -> insert rows, which
   * made the member's photographs depend on the composer's page surviving
   * twenty seconds it had already navigated away from. The new order is:
   * upload (foreground, visible) -> RPC -> insert rows (milliseconds) ->
   * receipt. Nothing slow happens after navigation.
   *
   * flushToReview() below is KEPT, unchanged, and is no longer called by the
   * composer. It remains the only code path that registers a pending card and
   * the reviewRetryRegistry entry, so it is not deleted while those surfaces
   * exist; if it is ever removed, the card and the registry go with it.
   * ------------------------------------------------------------------- */

  /** One stable key per composer instance, so a remount joins its own run. */
  const uploadKeyRef = useRef<string>(`rv2-${nid()}`);

  const insertMediaRow = useCallback(
    async (reviewId: string, item: MediaItem): Promise<string | null> => {
      const dims = item.type === 'image' && item.width && item.height
        ? { width: item.width, height: item.height, aspect_ratio: parseFloat((item.width / item.height).toFixed(4)) }
        : {};
      const { data: row, error } = await supabase
        .from('course_review_media')
        .insert({
          review_id: reviewId,
          media_url: item.uploadedUrl ?? '',
          media_type: item.type,
          stream_id: item.streamId ?? null,
          poster_url: item.posterUrl ?? null,
          file_name: item.file?.name ?? null,
          file_size: item.file?.size ?? null,
          status: 'attached',
          owner_user_id: userId,
          duration_seconds: item.type === 'video' ? (item.durationSeconds ?? null) : null,
          ...dims,
        })
        .select('id')
        .single();
      if (error) throw error;
      return row?.id ?? null;
    },
    [userId],
  );

  /**
   * Move the bytes for every pending/failed item, in the foreground, and
   * report the outcome to the CALLER — which is what makes a failure sayable
   * in words instead of a silent tile (R1 §1.3b). Resolves { ok, failed }.
   */
  const uploadPendingMedia = useCallback(async (): Promise<{ ok: boolean; failed: number }> => {
    const pending = itemsRef.current.filter(
      (i) => (i.status === 'pending' || i.status === 'failed') && !!i.file,
    );
    if (pending.length === 0) return { ok: true, failed: 0 };
    if (!userId) return { ok: false, failed: pending.length };

    for (const it of pending) {
      updateItem(it.id, { status: 'uploading', progress: 0, error: undefined });
    }

    const results = await startReviewUpload(
      uploadKeyRef.current,
      userId,
      pending.map((i) => ({ id: i.id, type: i.type, file: i.file as File })),
    );

    let failed = 0;
    for (const r of results) {
      if (r.ok) {
        updateItem(r.id, {
          status: 'uploaded',
          progress: 100,
          uploadedUrl: r.uploadedUrl ?? null,
          streamId: r.streamId ?? null,
          posterUrl: r.posterUrl ?? null,
          error: undefined,
        });
      } else {
        failed += 1;
        updateItem(r.id, { status: 'failed', error: r.error || 'Upload failed' });
      }
    }
    return { ok: failed === 0, failed };
  }, [userId, updateItem]);

  /**
   * Write one course_review_media row per already-uploaded item. Runs after
   * the RPC and takes milliseconds — the bytes are already at rest.
   */
  /**
   * THE PARTIAL-ATTACH WINDOW (R1.2 §1, 18 Sep 2026).
   *
   * After R1 the only remaining way work can be lost is here: the bytes are in
   * R2, the review exists, and the INSERT fails. Telling the member to edit the
   * review and add the photo again would ask them to re-upload a file that is
   * already uploaded, so this window is closed in two stages before any such
   * sentence is shown.
   *
   *  a. RETRY THE INSERT. Three attempts with a short backoff. A failed insert
   *     after a successful upload is almost always transient (a dropped socket,
   *     a token refresh mid-flight), so most of this window closes itself.
   *  b. HOLD THE PAIR. If it still fails, the uploaded url and the review id
   *     are both known, so the item stays 'uploaded' — NOT 'failed', because
   *     the bytes are safe — and a retry is registered in reviewRetryRegistry
   *     that re-attempts the INSERT ONLY. Nothing is re-uploaded.
   *  c. Only when there is no home for that pair (no identity wired, so no
   *     pending card can carry the Retry) does the caller show the dead-end
   *     message. It is the right sentence for a genuine dead end; it should be
   *     far rarer than one failed insert.
   */
  const INSERT_ATTEMPTS = 3;
  const INSERT_BACKOFF_MS = [400, 1200];

  const insertMediaRowWithRetry = useCallback(
    async (reviewId: string, item: MediaItem): Promise<string | null> => {
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < INSERT_ATTEMPTS; attempt += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          return await insertMediaRow(reviewId, item);
        } catch (e) {
          lastErr = e;
          const wait = INSERT_BACKOFF_MS[attempt];
          if (wait == null) break;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Could not attach media');
    },
    [insertMediaRow],
  );

  const attachToReview = useCallback(
    async (
      reviewId: string,
      opts?: { queryClient?: QueryClient; caption?: string },
    ): Promise<{ inserted: number; failed: number; held: number }> => {
      const uploaded = itemsRef.current.filter((i) => i.status === 'uploaded' && !i.dbRowId);
      if (uploaded.length === 0) return { inserted: 0, failed: 0, held: 0 };

      let inserted = 0;
      const stillUnattached: MediaItem[] = [];
      for (const it of uploaded) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const rowId = await insertMediaRowWithRetry(reviewId, it);
          updateItem(it.id, { status: 'ready', progress: 100, dbRowId: rowId, error: undefined });
          inserted += 1;
        } catch (e) {
          // Status stays 'uploaded': the file is at rest and must never be
          // re-uploaded to fix this. Only the row is missing.
          stillUnattached.push(it);
          updateItem(it.id, {
            error: e instanceof Error ? e.message : 'Could not attach media',
          });
        }
      }

      // (b) HOLD THE (url, reviewId) PAIR so a retry attaches without uploading.
      let held = 0;
      const ident = identityRef.current;
      if (stillUnattached.length > 0 && ident && userId) {
        const jobId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `rv2-attach-${nid()}`;
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
          caption: (opts?.caption ?? '').trim()
            || (ident.courseName ? `Review · ${ident.courseName}` : 'New review'),
          media: stillUnattached.map((it) => ({ id: it.id, kind: it.type, previewUrl: it.previewUrl })),
          courseId: ident.courseId,
          courseName: ident.courseName,
          totalFiles: stillUnattached.length,
          fileProgress: {},
          status: 'uploading',
          files: [],
          createdAt: new Date().toISOString(),
        };
        usePendingPostsStore.getState().addPending(entry);
        usePendingPostsStore.getState().markFailed(jobId, 'Could not attach media to the review');

        // The retry re-attempts the INSERT only — the url is already known.
        reviewRetryRegistry.register(jobId, async () => {
          const pendingRows = itemsRef.current.filter(
            (i) => i.status === 'uploaded' && !i.dbRowId && !!i.uploadedUrl,
          );
          let ok = 0;
          for (const it of pendingRows) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const rowId = await insertMediaRowWithRetry(reviewId, it);
              updateItem(it.id, { status: 'ready', progress: 100, dbRowId: rowId, error: undefined });
              ok += 1;
            } catch {
              /* stays held; the card keeps its Retry */
            }
          }
          if (ok === pendingRows.length) {
            usePendingPostsStore.getState().removeJob(jobId);
            reviewRetryRegistry.unregister(jobId);
            if (opts?.queryClient) invalidateCourseRatingCaches(opts.queryClient);
          }
        });
        held = stillUnattached.length;
      }

      if (opts?.queryClient) invalidateCourseRatingCaches(opts.queryClient);
      // 'failed' now means ONLY the dead end: unattached with nowhere to retry.
      return { inserted, failed: stillUnattached.length - held, held };
    },
    [insertMediaRowWithRetry, updateItem, userId],
  );

  /**
   * Retry one failed tile. With no reviewId (the R1 order) the item goes back
   * to pending and the whole pending set is re-uploaded — items that already
   * succeeded are 'uploaded' and are not touched. The two-argument form is
   * the legacy flushToReview retry and is preserved for the pending card.
   */
  const retryItem = useCallback(
    async (id: string, reviewId?: string) => {
      const it = itemsRef.current.find((i) => i.id === id);
      if (!it) return;
      if (reviewId) {
        await uploadOne(it, reviewId);
        return;
      }
      updateItem(id, { status: 'pending', progress: 0, error: undefined });
      await uploadPendingMedia();
    },
    [uploadOne, updateItem, uploadPendingMedia],
  );

  const hasNewMedia = useCallback(() => items.some((i) => !i.isExisting), [items]);

  return {
    items,
    addFiles,
    removeItem,
    uploadPendingMedia,
    attachToReview,
    flushToReview,
    retryItem,
    pickerError,
    clearPickerError: () => setPickerError(null),
    count: items.length,
    hasNewMedia,
  };
}
