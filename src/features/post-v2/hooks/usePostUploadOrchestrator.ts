// usePostUploadOrchestrator - the NEW post upload pipeline for Stage composer.
//
// Contract with the rest of the system:
//   - Emits the exact event lifecycle the pendingPostsStore expects:
//       addPending -> attachPostId -> file:upload-progress -> file:upload-complete
//       -> upload:complete (or upload:failed)
//   - NEVER writes to `posts` directly. Birth via create_post_v2; completion
//     via finalize_post_v2. Media rows are inserted into post_media only.
//   - NEVER deletes posts on failure. The publisher cron sweeper is the
//     backstop for stuck-processing rows.
//
// Images: compress + upload to R2 via cloudflare-r2-upload.
// Videos: TUS resumable upload to Cloudflare Stream.
// Crop / frame are persisted as studio_edits (baking is a P3 concern -
// stored as transform data now; safe because MediaStageV2 respects the same
// crop metadata on render, and post_media schema already carries studio_edits).

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { usePendingPostsStore } from '@/uploads/pendingPostsStore';
import { compressImage } from '@/uploads/imageCompression';
import { uploadVideoWithTus } from '@/uploads/tusVideoUpload';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import type { StageMediaItem } from './useStageComposer';

export interface OrchestratorContext {
  jobId: string;
  postId: string;
  userId: string;
  actorType: 'personal' | 'business';
  actorId: string;
}

async function insertMediaRow(
  postId: string,
  displayOrder: number,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase.from('post_media').insert({
    post_id: postId,
    display_order: displayOrder,
    upload_status: 'complete',
    processing_status: 'ready',
    ...patch,
  } as never);
  if (error) throw error;
}

async function uploadImageItem(
  ctx: OrchestratorContext,
  item: StageMediaItem,
  displayOrder: number,
) {
  uploadEventBus.emit('file:upload-start', {
    type: 'file:upload-start',
    jobId: ctx.jobId,
    fileId: item.id,
    fileIndex: displayOrder,
    totalFiles: 0,
  });
  // Compress
  const compressed = await compressImage(item.file, 'feed');
  uploadEventBus.emit('file:upload-progress', {
    type: 'file:upload-progress',
    jobId: ctx.jobId,
    fileId: item.id,
    progress: 40,
  });
  // Upload
  const result = await uploadToCloudflareR2(compressed.file, 'clbhouz-post-images', compressed.file.name);
  if (!result.success || !result.publicUrl) {
    throw new Error(result.error || 'Image upload failed');
  }
  uploadEventBus.emit('file:upload-progress', {
    type: 'file:upload-progress',
    jobId: ctx.jobId,
    fileId: item.id,
    progress: 100,
  });
  await insertMediaRow(ctx.postId, displayOrder, {
    media_type: 'image',
    media_url: result.publicUrl,
    aspect_ratio: compressed.width && compressed.height ? compressed.width / compressed.height : null,
    width: compressed.width ?? null,
    height: compressed.height ?? null,
    studio_edits: { frame: item.frame, crop: item.crop ?? null },
  });
  uploadEventBus.emit('file:upload-complete', {
    type: 'file:upload-complete',
    jobId: ctx.jobId,
    fileId: item.id,
  });
}

async function uploadVideoItem(
  ctx: OrchestratorContext,
  item: StageMediaItem,
  displayOrder: number,
) {
  uploadEventBus.emit('file:upload-start', {
    type: 'file:upload-start',
    jobId: ctx.jobId,
    fileId: item.id,
    fileIndex: displayOrder,
    totalFiles: 0,
  });
  const streamId = await new Promise<string>((resolve, reject) => {
    uploadVideoWithTus({
      file: item.file,
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
        uploadEventBus.emit('file:upload-progress', {
          type: 'file:upload-progress',
          jobId: ctx.jobId,
          fileId: item.id,
          progress: pct,
          bytesUploaded,
          bytesTotal,
        });
      },
      onSuccess: (sid) => resolve(sid),
      onError: (err) => reject(err),
      metadata: { postId: ctx.postId, actorType: ctx.actorType, actorId: ctx.actorId },
    }).catch(reject);
  });
  await insertMediaRow(ctx.postId, displayOrder, {
    media_type: 'video',
    media_url: `stream:${streamId}`,
    stream_id: streamId,
    trim_start: item.trimStart ?? null,
    trim_end: item.trimEnd ?? null,
    poster_timestamp: item.posterTimestamp ?? null,
    studio_edits: { frame: item.frame, crop: item.crop ?? null },
  });
  uploadEventBus.emit('file:upload-complete', {
    type: 'file:upload-complete',
    jobId: ctx.jobId,
    fileId: item.id,
  });
}

export function usePostUploadOrchestrator() {
  return useCallback(async (ctx: OrchestratorContext, items: StageMediaItem[]) => {
    // Attach the real post id to the pending card as soon as we have it.
    uploadEventBus.emit('post:shell-created', {
      type: 'post:shell-created',
      jobId: ctx.jobId,
      postId: ctx.postId,
      actorType: ctx.actorType,
      actorId: ctx.actorId,
      hasMedia: items.length > 0,
    });

    let completed = 0;
    const failedIndices: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (item.type === 'video') {
          await uploadVideoItem(ctx, item, i);
        } else {
          await uploadImageItem(ctx, item, i);
        }
        completed++;
      } catch (err) {
        failedIndices.push(i);
        uploadEventBus.emit('file:upload-failed', {
          type: 'file:upload-failed',
          jobId: ctx.jobId,
          fileId: item.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (completed === 0 && items.length > 0) {
      throw new Error('All media uploads failed');
    }

    if (failedIndices.length > 0) {
      uploadEventBus.emit('upload:partial-failure', {
        type: 'upload:partial-failure',
        jobId: ctx.jobId,
        completedFiles: completed,
        failedFiles: failedIndices.length,
        totalFiles: items.length,
      });
    }

    // Finalize on the server - flips 'processing' -> 'published' | 'scheduled'.
    const { data, error } = await supabase.rpc('finalize_post_v2', { p_post_id: ctx.postId });
    if (error) throw error;

    void usePendingPostsStore; // referenced to keep the contract explicit
    return data;
  }, []);
}
