/**
 * reviewUploadController — module-level upload engine for the review path.
 *
 * WHY THIS EXISTS (BRIEF_R1 §1.2, 18 Sep 2026). Before R1 the review's byte
 * moving lived in a callback closed over by the composer and was fired AFTER
 * the review RPC had returned and the member had been sent to the receipt.
 * Nothing owned it: if the webview was suspended or discarded — which the
 * native shell does whenever the app is backgrounded, and the photo picker
 * backgrounds the app as a matter of course — the uploads died mid-flight, no
 * rows were written, and no surface anywhere said so. Measured consequence:
 * a review submitted 18 Sep 14:16 UTC with media_count 2 at submit and zero
 * course_review_media rows, the member told nothing.
 *
 * WHAT CHANGED. Bytes now move BEFORE the review record exists, while the
 * composer is on screen, and they are owned here — outside React — so a
 * remount or an unmount cannot cancel a run in progress. The composer awaits
 * this; a composer that comes back mid-run re-attaches to the same job via
 * getReviewUploadJob/subscribeToReviewUpload rather than starting a second.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO.
 *  - It writes NO database rows. It returns urls; course_review_media inserts
 *    stay in the pipeline hook, run after the RPC, and take milliseconds
 *    because the bytes are already at rest.
 *  - It does NOT touch UploadManager / uploadPipeline. The pipeline header's
 *    fence ("the hard-fenced UploadManager / uploadPipeline are NEVER called
 *    from the review path") stands; this is modelled on postUploadController,
 *    not routed through it.
 *
 * ORPHANS ARE ACCEPTED, EXPLICITLY. Uploading before the record means an
 * abandoned composer can leave a file in R2 with no row pointing at it. That
 * is cheap and sweepable; losing a member's photographs is not. If a sweeper
 * is ever written, its input is R2 keys with no matching course_review_media
 * row older than a day.
 */

import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { toast } from '@/lib/toast';
import i18n from '@/i18n';
import { analyticsEvents } from '@/utils/analyticsEvents';

export interface ReviewUploadInput {
  /** Client item id — echoed back on the result so the caller can match. */
  id: string;
  type: 'image' | 'video';
  file: File;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface ReviewUploadResult {
  id: string;
  ok: boolean;
  /** Images: the R2 public url. Videos: the Stream HLS url. */
  uploadedUrl?: string;
  streamId?: string;
  posterUrl?: string;
  error?: string;
}

export interface ReviewUploadSnapshot {
  key: string;
  running: boolean;
  total: number;
  completed: number;
  failed: number;
  /** 0..100 per item id. */
  progress: Record<string, number>;
}

type Listener = (s: ReviewUploadSnapshot) => void;

interface Job {
  snapshot: ReviewUploadSnapshot;
  promise: Promise<ReviewUploadResult[]>;
  listeners: Set<Listener>;
}

const jobs = new Map<string, Job>();

function emit(job: Job) {
  for (const l of job.listeners) l({ ...job.snapshot, progress: { ...job.snapshot.progress } });
}

async function uploadImage(userId: string, item: ReviewUploadInput): Promise<ReviewUploadResult> {
  const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}-${item.file.name}`;
  const formData = new FormData();
  formData.append('file', item.file);
  formData.append('fileName', fileName);
  /*
   * BUCKET PARAMETER (BRIEF_R1 §1.4a). The client used to append
   * `bucketName: 'clbhouz-review-images'`; the edge function reads
   * `bucketType` and nothing else, so that value was ignored for the whole
   * life of the feature and every one of the 468 live review images sits in
   * bucket clbhouz-media under <user>/course-media/. The parameter is not
   * sent at all now, and the constant that named a bucket the code never
   * used is gone: the function's own fallback (`bucketType || 'course-media'`)
   * produces exactly today's destination, so no existing url moves. Sending
   * `bucketType: 'course-media'` would be equivalent; omitting it keeps one
   * fewer place claiming to choose something it does not choose. Changing
   * WHERE review images land is a separate migration and is not authorised.
   */

  const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
    body: formData,
  });
  if (error) throw error;
  if (!data?.success || !data?.publicUrl) throw new Error(data?.error || 'Image upload failed');
  return { id: item.id, ok: true, uploadedUrl: data.publicUrl as string };
}

async function uploadVideo(
  item: ReviewUploadInput,
  onProgress: (pct: number) => void,
): Promise<ReviewUploadResult> {
  const streamId = await new Promise<string>((resolve, reject) => {
    uploadVideoResilient({
      file: item.file,
      onProgress: (loaded, total) => onProgress(total > 0 ? Math.round((loaded / total) * 100) : 0),
      onSuccess: (sid) => resolve(sid),
      onError: (err) => reject(err),
    }).catch(reject);
  });
  return {
    id: item.id,
    ok: true,
    uploadedUrl: generateStreamHlsUrl(streamId),
    streamId,
    posterUrl: generateStreamThumbnailUrl(streamId),
  };
}

async function runJob(
  job: Job,
  userId: string,
  items: ReviewUploadInput[],
): Promise<ReviewUploadResult[]> {
  const results: ReviewUploadResult[] = [];

  for (const item of items) {
    const setProgress = (pct: number) => {
      job.snapshot.progress[item.id] = pct;
      emit(job);
    };
    try {
      // Images get no native progress from functions.invoke; a single bump to
      // 30 is honest about "started", and 100 lands on completion.
      setProgress(item.type === 'video' ? 0 : 30);
      const res = item.type === 'video'
        ? await uploadVideo(item, setProgress)
        : await uploadImage(userId, item);
      results.push(res);
      job.snapshot.completed += 1;
      setProgress(100);
    } catch (e) {
      results.push({
        id: item.id,
        ok: false,
        error: e instanceof Error ? e.message : 'Upload failed',
      });
      job.snapshot.failed += 1;
      emit(job);
    }
  }

  return results;
}

/**
 * Move the bytes for every given item. Resolves once each item has either a
 * url or an error — it never throws, so the caller always learns per-item
 * outcomes. A job already running under this key is joined, not duplicated.
 */
export function startReviewUpload(
  key: string,
  userId: string,
  items: ReviewUploadInput[],
): Promise<ReviewUploadResult[]> {
  const existing = jobs.get(key);
  if (existing && existing.snapshot.running) return existing.promise;

  const job: Job = {
    snapshot: {
      key,
      running: true,
      total: items.length,
      completed: 0,
      failed: 0,
      progress: {},
    },
    promise: Promise.resolve([]),
    listeners: new Set(),
  };
  jobs.set(key, job);

  job.promise = runJob(job, userId, items).then((results) => {
    job.snapshot.running = false;
    emit(job);
    // Retain briefly so a composer that remounts late still reads the outcome.
    setTimeout(() => {
      if (jobs.get(key) === job) jobs.delete(key);
    }, 60_000);
    return results;
  });

  return job.promise;
}

/** The in-flight (or just-finished) job for this key, if any. */
export function getReviewUploadJob(key: string): ReviewUploadSnapshot | null {
  const job = jobs.get(key);
  return job ? { ...job.snapshot, progress: { ...job.snapshot.progress } } : null;
}

/** Join an in-flight job's promise — used by a composer that came back. */
export function resumeReviewUpload(key: string): Promise<ReviewUploadResult[]> | null {
  const job = jobs.get(key);
  return job && job.snapshot.running ? job.promise : null;
}

export function subscribeToReviewUpload(key: string, listener: Listener): () => void {
  const job = jobs.get(key);
  if (!job) return () => {};
  job.listeners.add(listener);
  listener({ ...job.snapshot, progress: { ...job.snapshot.progress } });
  return () => { job.listeners.delete(listener); };
}

/* ---------------------------------------------------------------------------
 * PHASE 2 — STAGED REVIEWS. The controller owns the whole job: upload, then
 * publish, or mark failed. It survives the composer unmounting, so no
 * arrangement of navigation can leave a staged row with nobody finishing it.
 * ------------------------------------------------------------------------- */

/** A PostgrestError carries code/message/details as plain fields; keep all
 *  three, because error_message is what phase 3 shows and what we read when
 *  diagnosing a failure. */
function errText(e: unknown, fallback: string): string {
  if (typeof e === 'string') return e || fallback;
  const o = (e ?? {}) as { message?: string; details?: string; code?: string };
  const parts = [o.code, o.message, o.details].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' | ') : fallback;
}

function pgCode(e: unknown): string | undefined {
  return (e as { code?: string } | null | undefined)?.code;
}

async function markPendingFailed(pendingId: string, message: string) {
  try {
    // pending_reviews is not in the generated types yet, hence the cast.
    await (supabase as any)
      .from('pending_reviews')
      .update({
        status: 'failed',
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingId);
  } catch (e) {
    console.warn('[review] could not mark pending review failed', e);
  }
}

function failNoisily(_detail: string) {
  // If the member has left, the marked row is the only record (phase 3
  // surfaces it). If they are still here, say it now.
  try {
    toast.error(i18n.t('courses:review.toast.stagedFailed'));
  } catch {
    /* i18n not ready — the row is still marked, which is what matters */
  }
}

export interface PublishOutcome { ok: boolean; ratingId?: string; error?: string; }

/* ---------------------------------------------------------------------------
 * PUBLISH STATE — what the pending receipt watches. Unlike the upload job,
 * a listener can register before any state exists and hears the first change.
 * ------------------------------------------------------------------------- */

export type ReviewPublishPhase = 'uploading' | 'publishing' | 'published' | 'failed';

export interface ReviewPublishState {
  phase: ReviewPublishPhase;
  uploaded: number;
  total: number;
  /** 0..100 averaged across all files. */
  percent: number;
  ratingId?: string;
}

const publishStates = new Map<string, ReviewPublishState>();
const publishListeners = new Map<string, Set<(s: ReviewPublishState) => void>>();

function setPublishState(key: string, patch: Partial<ReviewPublishState>) {
  const cur = publishStates.get(key) ?? {
    phase: 'uploading' as ReviewPublishPhase, uploaded: 0, total: 0, percent: 0,
  };
  const next = { ...cur, ...patch };
  publishStates.set(key, next);
  for (const l of publishListeners.get(key) ?? []) l(next);
  if (next.phase === 'published' || next.phase === 'failed') {
    // Retain terminal states briefly, as the job map does, so a receipt that
    // mounts late still reads the outcome.
    setTimeout(() => {
      if (publishStates.get(key) === next) {
        publishStates.delete(key);
        publishListeners.delete(key);
      }
    }, 60_000);
  }
}

export function getReviewPublishState(key: string): ReviewPublishState | null {
  return publishStates.get(key) ?? null;
}

export function subscribeToReviewPublish(
  key: string,
  listener: (s: ReviewPublishState) => void,
): () => void {
  let set = publishListeners.get(key);
  if (!set) { set = new Set(); publishListeners.set(key, set); }
  set.add(listener);
  const cur = publishStates.get(key);
  if (cur) listener(cur);
  return () => {
    set!.delete(listener);
    if (set!.size === 0 && publishListeners.get(key) === set) publishListeners.delete(key);
  };
}

export async function uploadAndPublishReview(
  key: string,
  userId: string,
  pendingId: string,
  items: ReviewUploadInput[],
  onPublished?: () => void,
): Promise<PublishOutcome> {
  const byId = new Map(items.map((i) => [i.id, i]));
  setPublishState(key, {
    phase: 'uploading', uploaded: 0, total: items.length, percent: 0,
  });
  let results: ReviewUploadResult[];
  const promise = startReviewUpload(key, userId, items); // registers the job
  const unsub = subscribeToReviewUpload(key, (s) => {
    const vals = Object.values(s.progress);
    const pct = s.total > 0
      ? Math.round(vals.reduce((a, b) => a + b, 0) / s.total)
      : 0;
    setPublishState(key, { uploaded: s.completed, total: s.total, percent: pct });
  });
  try {
    results = await promise;
  } catch (e) {
    const msg = errText(e, 'Upload failed');
    await markPendingFailed(pendingId, msg);
    failNoisily(msg);
    analyticsEvents.track('review_staged_failed', {
      pending_id: pendingId, total: items.length, failed: items.length,
      stage: 'upload_threw',
    });
    setPublishState(key, { phase: 'failed' });
    return { ok: false, error: msg };
  } finally {
    unsub();
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0 || results.length !== items.length) {
    const msg = errText(failed[0]?.error, 'Some files did not finish uploading');
    await markPendingFailed(pendingId, msg);
    failNoisily(msg);
    analyticsEvents.track('review_staged_failed', {
      pending_id: pendingId, total: items.length, failed: failed.length,
    });
    setPublishState(key, { phase: 'failed' });
    return { ok: false, error: msg };
  }

  // EVERY FILE OR NOTHING — the RPC re-checks this count and refuses a short
  // array, so a mismatch here can never publish a partial review.
  const media = results.map((r) => {
    const input = byId.get(r.id)!;
    const w = input.width ?? null;
    const h = input.height ?? null;
    return {
      media_url: r.uploadedUrl ?? '',
      media_type: input.type,
      stream_id: r.streamId ?? null,
      poster_url: r.posterUrl ?? null,
      width: w,
      height: h,
      aspect_ratio: w && h ? Number((w / h).toFixed(4)) : null,
      duration_seconds: input.type === 'video' ? (input.durationSeconds ?? null) : null,
    };
  });

  setPublishState(key, { phase: 'publishing', percent: 100 });
  try {
    const { data, error } = await supabase.rpc('publish_pending_review' as never, {
      p_pending_id: pendingId,
      p_media: media,
    } as never);
    if (error) throw error;
    const ratingId = typeof data === 'string' ? data : undefined;
    analyticsEvents.track('review_staged_published', {
      pending_id: pendingId, media_count: media.length,
    });
    onPublished?.();
    setPublishState(key, { phase: 'published', ratingId });
    return { ok: true, ratingId };
  } catch (e) {
    // SUPERSEDED, NOT FAILED. The member submitted again for this course and
    // stage_course_review dropped this row on purpose. Say nothing, mark
    // nothing, paint nothing: the member is on a newer receipt.
    if (pgCode(e) === '02000') {
      publishStates.delete(key);
      publishListeners.delete(key);
      analyticsEvents.track('review_staged_superseded', { pending_id: pendingId });
      return { ok: false, error: 'superseded' };
    }

    const msg = errText(e, 'Could not post your review');
    await markPendingFailed(pendingId, msg);
    failNoisily(msg);
    analyticsEvents.track('review_staged_failed', {
      pending_id: pendingId, total: items.length, failed: 0, stage: 'publish',
    });
    setPublishState(key, { phase: 'failed' });
    return { ok: false, error: msg };
  }
}
