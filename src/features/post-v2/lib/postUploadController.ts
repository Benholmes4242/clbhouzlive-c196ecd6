// postUploadController - module-level upload engine that OUTLIVES the composer.
//
// The composer fires jobs at start(); the controller then owns their lifecycle
// entirely - compression, R2/TUS upload, per-file post_media inserts, and the
// final finalize_post_v2 RPC. Uploads keep running through any React unmount:
// closing the composer, navigating away, backgrounding the tab all leave the
// job untouched. Only killing the whole app stops it (the publisher cron
// sweeper is the backstop for stuck-processing rows).
//
// Emits the same pendingPostsStore/eventBus lifecycle the old orchestrator
// did so feed pending cards + toasts remain unchanged.

import { supabase } from '@/integrations/supabase/client';
import { uploadEventBus } from '@/uploads/uploadEventBus';
import { compressImage, COMPRESSION_PRESETS } from '@/uploads/imageCompression';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { bakeFrameCrop } from './bakeFrameCrop';
import type { StageMediaItem } from '../hooks/useStageComposer';

export interface UploadJobContext {
  jobId: string;
  postId: string;
  userId: string;
  actorType: 'personal' | 'business';
  actorId: string;
  isScheduled: boolean;
  scheduledAt?: string;
  /**
   * Edit mode: post already exists and is (usually) published. Skip the
   * finalize_post_v2 call (which flips processing -> published) and skip
   * the post:shell-created event (no pending card - the post row is real).
   */
  skipFinalize?: boolean;
  /** Continue numbering post_media.display_order from this offset (edit adds). */
  displayOrderOffset?: number;
}

export type UploadJobPhase = 'running' | 'complete' | 'failed';

export interface UploadJobSnapshot {
  jobId: string;
  postId: string;
  phase: UploadJobPhase;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  overallProgress: number; // 0..100
  /**
   * BRIEF_UPLOAD_PROGRESS S2 - the phase model. A percentage alone lies at the
   * start: bake and compress happen before a single byte moves.
   *   preparing  - job start until the first progress event of the current item
   *   uploading  - bytes are moving
   *   publishing - every item done, finalize_post_v2 in flight
   */
  stage: 'preparing' | 'uploading' | 'publishing';
  /** Bytes moved so far across every item. */
  bytesUploaded: number;
  /**
   * Known total. GROWS during a multi-image post because item 3's compressed
   * size is unknown until item 3 is compressed. Never estimated from original
   * file sizes - a wrong estimate would make the bar retreat.
   */
  bytesTotal: number;
  error?: string;
}

type Listener = (s: UploadJobSnapshot) => void;

interface InternalJob {
  ctx: UploadJobContext;
  items: StageMediaItem[];
  snapshot: UploadJobSnapshot;
  perFile: Record<string, number>;
  bytesById: Record<string, { uploaded: number; total: number }>;
  listeners: Set<Listener>;
}

const jobs = new Map<string, InternalJob>();
const globalListeners = new Set<Listener>();

function emitSnapshot(job: InternalJob) {
  const total = job.items.length || 1;
  const sum = Object.values(job.perFile).reduce((acc, v) => acc + v, 0);
  const next = Math.min(100, Math.round(sum / total));
  // MONOTONIC: a bar that retreats destroys trust in every other figure on the
  // screen. If a recomputation would lower the value, hold the previous one.
  job.snapshot.overallProgress = Math.max(job.snapshot.overallProgress, next);
  let up = 0;
  let tot = 0;
  for (const b of Object.values(job.bytesById)) { up += b.uploaded; tot += b.total; }
  job.snapshot.bytesUploaded = up;
  job.snapshot.bytesTotal = tot;
  for (const l of job.listeners) l(job.snapshot);
  for (const l of globalListeners) l(job.snapshot);
}

async function insertMediaRow(
  postId: string,
  displayOrder: number,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase.from('post_media').insert({
    post_id: postId,
    display_order: displayOrder,
    upload_status: 'completed',
    processing_status: 'ready',
    ...patch,
  } as never);
  if (error) throw error;
}

async function runImage(job: InternalJob, item: StageMediaItem, displayOrder: number) {
  const { ctx } = job;
  uploadEventBus.emit('file:upload-start', {
    type: 'file:upload-start',
    jobId: ctx.jobId,
    fileId: item.id,
    fileIndex: displayOrder,
    totalFiles: job.items.length,
  });

  if (!item.file) throw new Error('Image item missing file');
  let sourceFile: File = item.file;
  const crop = item.crop;
  const hasCropAdjust = !!crop && (crop.scale !== 1 || crop.x !== 50 || crop.y !== 50);
  const shouldBake = (item.frame && item.frame !== 'original') || hasCropAdjust;
  if (shouldBake) {
    try {
      const pos = crop ? { x: crop.x, y: crop.y } : { x: 50, y: 50 };
      const scale = crop?.scale ?? 1;
      sourceFile = await bakeFrameCrop(item.file, item.frame, pos, scale);
    } catch (err) {
      console.warn('[post-v2] frame bake failed, falling back to original', err);
    }
  }

  const compressed = await compressImage(sourceFile, COMPRESSION_PRESETS.feed);
  // bytesTotal only becomes known here - the compressed size, never an estimate.
  job.bytesById[item.id] = { uploaded: 0, total: compressed.file.size };
  emitSnapshot(job);

  const result = await uploadToCloudflareR2(
    compressed.file,
    'clbhouz-post-images',
    compressed.file.name,
    (bytesUploaded, bytesTotal) => {
      const pct = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
      job.perFile[item.id] = pct;
      job.bytesById[item.id] = { uploaded: bytesUploaded, total: bytesTotal };
      job.snapshot.stage = 'uploading';
      uploadEventBus.emit('file:upload-progress', {
        type: 'file:upload-progress',
        jobId: ctx.jobId,
        fileId: item.id,
        progress: pct,
        bytesUploaded,
        bytesTotal,
      });
      emitSnapshot(job);
    },
  );
  if (!result.success || !result.publicUrl) {
    throw new Error(result.error || 'Image upload failed');
  }
  job.perFile[item.id] = 100;
  uploadEventBus.emit('file:upload-progress', {
    type: 'file:upload-progress',
    jobId: ctx.jobId,
    fileId: item.id,
    progress: 100,
  });
  emitSnapshot(job);

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

async function runVideo(job: InternalJob, item: StageMediaItem, displayOrder: number) {
  const { ctx } = job;
  uploadEventBus.emit('file:upload-start', {
    type: 'file:upload-start',
    jobId: ctx.jobId,
    fileId: item.id,
    fileIndex: displayOrder,
    totalFiles: job.items.length,
  });

  if (!item.file) throw new Error('Video item missing file');
  const videoFile: File = item.file;
  const streamId = await new Promise<string>((resolve, reject) => {
    uploadVideoResilient({
      file: videoFile,
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
        job.perFile[item.id] = pct;
        job.bytesById[item.id] = { uploaded: bytesUploaded, total: bytesTotal };
        job.snapshot.stage = 'uploading';
        uploadEventBus.emit('file:upload-progress', {
          type: 'file:upload-progress',
          jobId: ctx.jobId,
          fileId: item.id,
          progress: pct,
          bytesUploaded,
          bytesTotal,
        });
        emitSnapshot(job);
      },
      onSuccess: (sid) => resolve(sid),
      onError: (err) => reject(err),
      metadata: { postId: ctx.postId, actorType: ctx.actorType, actorId: ctx.actorId },
    }).catch(reject);
  });

  const posterTimestamp = typeof item.posterTimestamp === 'number' ? item.posterTimestamp : null;
  const posterUrl = posterTimestamp && posterTimestamp > 0
    ? `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=${posterTimestamp}s&height=1080`
    : null;

  await insertMediaRow(ctx.postId, displayOrder, {
    media_type: 'video',
    media_url: `stream:${streamId}`,
    stream_id: streamId,
    trim_start: item.trimStart ?? null,
    trim_end: item.trimEnd ?? null,
    poster_timestamp: posterTimestamp,
    ...(posterUrl ? { poster_url: posterUrl } : {}),
    studio_edits: { frame: item.frame, crop: item.crop ?? null },
  });

  uploadEventBus.emit('file:upload-complete', {
    type: 'file:upload-complete',
    jobId: ctx.jobId,
    fileId: item.id,
  });
}

async function runJob(job: InternalJob): Promise<void> {
  const { ctx, items } = job;
  const offset = ctx.displayOrderOffset ?? 0;

  if (!ctx.skipFinalize) {
    uploadEventBus.emit('post:shell-created', {
      type: 'post:shell-created',
      jobId: ctx.jobId,
      postId: ctx.postId,
      actorType: ctx.actorType,
      actorId: ctx.actorId,
      hasMedia: items.length > 0,
    });
  }

  const failedIndices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    job.snapshot.stage = 'preparing';
    emitSnapshot(job);
    try {
      if (item.type === 'video') {
        await runVideo(job, item, offset + i);
      } else {
        await runImage(job, item, offset + i);
      }
      job.snapshot.completedFiles++;
      emitSnapshot(job);
    } catch (err) {
      failedIndices.push(i);
      job.snapshot.failedFiles++;
      uploadEventBus.emit('file:upload-failed', {
        type: 'file:upload-failed',
        jobId: ctx.jobId,
        fileId: item.id,
        error: err instanceof Error ? err.message : String(err),
      });
      emitSnapshot(job);
    }
  }

  if (job.snapshot.completedFiles === 0 && items.length > 0) {
    throw new Error('All media uploads failed');
  }

  if (failedIndices.length > 0) {
    uploadEventBus.emit('upload:partial-failure', {
      type: 'upload:partial-failure',
      jobId: ctx.jobId,
      completedFiles: job.snapshot.completedFiles,
      failedFiles: failedIndices.length,
      totalFiles: items.length,
    });
  }

  job.snapshot.stage = 'publishing';
  emitSnapshot(job);

  if (!ctx.skipFinalize) {
    const { data: fin, error } = await supabase.rpc('finalize_post_v2', { p_post_id: ctx.postId });
    if (error) throw error;

    const finalized = (fin as any)?.finalized === true;

    if (!finalized) {
      const reason = (fin as any)?.reason
        ?? ((fin as any)?.pending_media != null
             ? `media still processing (${(fin as any).pending_media})`
             : 'finalize refused');

      throw new Error(`Post could not be published: ${reason}`);
    }
  }

  uploadEventBus.emit('upload:complete', {
    type: 'upload:complete',
    jobId: ctx.jobId,
    uploadType: 'post',
    postId: ctx.postId,
    actorType: ctx.actorType,
    actorId: ctx.actorId,
    isScheduled: ctx.isScheduled,
    scheduledAt: ctx.scheduledAt,
  });
}


/**
 * Start an upload job. Returns synchronously with the job snapshot; the
 * actual work runs in the background and survives any React unmount.
 */
export function startPostUpload(ctx: UploadJobContext, items: StageMediaItem[]): UploadJobSnapshot {
  const job: InternalJob = {
    ctx,
    items,
    perFile: {},
    bytesById: {},
    listeners: new Set(),
    snapshot: {
      jobId: ctx.jobId,
      postId: ctx.postId,
      phase: 'running',
      totalFiles: items.length,
      completedFiles: 0,
      failedFiles: 0,
      overallProgress: 0,
      stage: 'preparing',
      bytesUploaded: 0,
      bytesTotal: 0,
    },
  };
  jobs.set(ctx.jobId, job);

  runJob(job)
    .then(() => {
      job.snapshot.phase = 'complete';
      job.snapshot.overallProgress = 100;
      emitSnapshot(job);
      // Retain briefly so late subscribers still see the terminal state.
      setTimeout(() => jobs.delete(ctx.jobId), 30_000);
    })
    .catch((err) => {
      job.snapshot.phase = 'failed';
      job.snapshot.error = err instanceof Error ? err.message : String(err);
      uploadEventBus.emit('upload:failed', {
        type: 'upload:failed',
        jobId: ctx.jobId,
        postId: ctx.postId,
        error: job.snapshot.error ?? 'Upload failed',
      });
      emitSnapshot(job);
      setTimeout(() => jobs.delete(ctx.jobId), 30_000);
    });

  return job.snapshot;
}

export function getJobSnapshot(jobId: string): UploadJobSnapshot | null {
  return jobs.get(jobId)?.snapshot ?? null;
}

export function subscribeToJob(jobId: string, listener: Listener): () => void {
  const job = jobs.get(jobId);
  if (!job) return () => {};
  job.listeners.add(listener);
  listener(job.snapshot);
  return () => { job.listeners.delete(listener); };
}

export function subscribeToAllJobs(listener: Listener): () => void {
  globalListeners.add(listener);
  return () => { globalListeners.delete(listener); };
}
