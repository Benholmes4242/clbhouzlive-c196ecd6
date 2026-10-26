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
 * Preuploads are now cleaned on remove/abandon; published jobs retain ownership.
 * HISTORICAL ORPHAN NOTE (superseded for normal closes). Uploading before the record means an
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
import { writeComposerHolePhoto, type ComposerHoleJob } from '@/lib/courseMedia/composerHolePhotos';

export interface ReviewUploadInput {
  /** Client item id — echoed back on the result so the caller can match. */
  id: string;
  type: 'image' | 'video';
  file: File;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  uploadedUrl?: string | null;
  streamId?: string | null;
  posterUrl?: string | null;
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

/** Image XHR exposes real transferred file bytes; functions.invoke cannot do this. */
async function uploadImage(userId: string, item: ReviewUploadInput, onProgress: (pct: number) => void, signal: AbortSignal): Promise<ReviewUploadResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to upload');
  const form = new FormData(); form.append('file', item.file);
  form.append('fileName', `${userId}-${Date.now()}-${item.file.name}`);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${supabase.supabaseUrl}/functions/v1/cloudflare-r2-upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    const abort = () => xhr.abort(); signal.addEventListener('abort', abort, { once: true });
    const finish = () => signal.removeEventListener('abort', abort);
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.min(100, event.loaded / event.total * 100)); };
    xhr.onload = () => { finish(); try { const data = JSON.parse(xhr.responseText); if (xhr.status < 200 || xhr.status >= 300 || !data.success || !data.publicUrl) throw new Error(data.error || 'Image upload failed'); resolve({ id: item.id, ok: true, uploadedUrl: data.publicUrl }); } catch (e) { reject(e); } };
    xhr.onerror = () => { finish(); reject(new Error('Image upload failed')); };
    xhr.onabort = () => { finish(); reject(new Error('Upload cancelled')); };
    if (signal.aborted) { finish(); reject(new Error('Upload cancelled')); return; } xhr.send(form);
  });
}
async function uploadVideo(item: ReviewUploadInput, onProgress: (pct: number) => void, signal: AbortSignal): Promise<ReviewUploadResult> {
  const streamId = await new Promise<string>((resolve, reject) => {
    let abortUpload: (() => void) | undefined;
    const abort = () => { abortUpload?.(); reject(new Error('Upload cancelled')); };
    signal.addEventListener('abort', abort, { once: true });
    uploadVideoResilient({ file: item.file,
      onProgress: (loaded, total) => onProgress(total > 0 ? loaded / total * 100 : 0),
      onSuccess: sid => { signal.removeEventListener('abort', abort); resolve(sid); },
      onError: err => { signal.removeEventListener('abort', abort); reject(err); },
    }).then(control => { abortUpload = control.abort; if (signal.aborted) abort(); }).catch(reject);
  });
  return { id: item.id, ok: true, uploadedUrl: generateStreamHlsUrl(streamId), streamId, posterUrl: generateStreamThumbnailUrl(streamId) };
}

export interface PreuploadState { status: 'pending' | 'uploading' | 'uploaded' | 'failed'; progress: number; result?: ReviewUploadResult; }
interface PreuploadEntry { input: ReviewUploadInput; userId: string; state: PreuploadState; promise: Promise<ReviewUploadResult>; resolve: (r: ReviewUploadResult) => void; abort: AbortController; removed: boolean; }
const composers = new Map<string, { entries: Map<string, PreuploadEntry>; queue: PreuploadEntry[]; active: number; published: boolean; abandoned: boolean; listeners: Set<(id: string, s: PreuploadState) => void> }>();
function composerUploads(key: string) { let c = composers.get(key); if (!c) { c = { entries: new Map(), queue: [], active: 0, published: false, abandoned: false, listeners: new Set() }; composers.set(key, c); } return c; }
export function cleanupPreuploadedAssets(results: ReviewUploadResult[]): void {
  const mediaItems = results.filter(r => r.ok && r.uploadedUrl).map(r => ({ id: r.id, media_url: r.uploadedUrl, media_type: r.streamId ? 'video' : 'image', stream_id: r.streamId ?? null }));
  if (mediaItems.length) void supabase.functions.invoke('cleanup-review-media', { body: { mediaItems } }).catch(e => console.warn('[review] cleanup failed', e));
}
export function subscribeToPreuploads(key: string, listener: (id: string, state: PreuploadState) => void): () => void {
  const c = composerUploads(key); c.listeners.add(listener); for (const [id, e] of c.entries) listener(id, e.state); return () => { c.listeners.delete(listener); };
}
function pump(key: string): void {
  const c = composerUploads(key);
  while (c.active < 2 && c.queue.length && !c.abandoned) {
    const e = c.queue.shift(); if (!e || e.removed) continue;
    c.active++; e.state = { status: 'uploading', progress: 0 };
    const emit = () => { for (const l of c.listeners) l(e.input.id, e.state); }; emit();
    const progress = (pct: number) => { e.state = { status: 'uploading', progress: pct }; emit(); };
    void (e.input.type === 'video' ? uploadVideo(e.input, progress, e.abort.signal) : uploadImage(e.userId, e.input, progress, e.abort.signal))
      .catch(error => ({ id: e.input.id, ok: false, error: error instanceof Error ? error.message : 'Upload failed' } as ReviewUploadResult))
      .then(result => {
        e.state = { status: result.ok ? 'uploaded' : 'failed', progress: result.ok ? 100 : e.state.progress, result }; emit();
        if ((e.removed || c.abandoned) && result.ok) cleanupPreuploadedAssets([result]);
        e.resolve(result); c.active--; pump(key);
      });
  }
}
export function enqueueReviewUpload(key: string, userId: string, input: ReviewUploadInput, retry = false): Promise<ReviewUploadResult> {
  const c = composerUploads(key); const old = c.entries.get(input.id);
  if (old && !(retry && old.state.status === 'failed')) return old.promise;
  let resolve: (r: ReviewUploadResult) => void = () => {};
  const promise = new Promise<ReviewUploadResult>(r => { resolve = r; });
  const e: PreuploadEntry = { input, userId, promise, resolve, state: { status: 'pending', progress: 0 }, abort: new AbortController(), removed: false };
  c.entries.set(input.id, e); c.queue.push(e); pump(key); return promise;
}
export function removeReviewPreupload(key: string, id: string): void {
  const c = composers.get(key); const e = c?.entries.get(id); if (!c || !e) return;
  e.removed = true; e.abort.abort();
  if (e.state.result?.ok) cleanupPreuploadedAssets([e.state.result]);
  if (e.state.status === 'pending') e.resolve({ id, ok: false, error: 'Removed' });
  c.entries.delete(id);
}
export function abandonReviewPreuploads(key: string): void {
  const c = composers.get(key); if (!c || c.published || c.abandoned) return; c.abandoned = true;
  for (const id of c.entries.keys()) removeReviewPreupload(key, id);
  c.queue = []; c.listeners.clear(); composers.delete(key);
}
export function retainReviewPreuploads(key: string): void { composerUploads(key).published = true; }

async function runJob(
  job: Job,
  userId: string,
  items: ReviewUploadInput[],
  holeJob?: ComposerHoleJob,
): Promise<ReviewUploadResult[]> {
  const results: ReviewUploadResult[] = [];

  await Promise.all(items.map(async item => {
    const c = composerUploads(job.snapshot.key);
    const unsubscribe = subscribeToPreuploads(job.snapshot.key, (id, state) => { if (id === item.id) { job.snapshot.progress[id] = state.progress; emit(job); } });
    const old = c.entries.get(item.id);
    const res = item.uploadedUrl
      ? { id: item.id, ok: true, uploadedUrl: item.uploadedUrl, streamId: item.streamId ?? undefined, posterUrl: item.posterUrl ?? undefined }
      : await enqueueReviewUpload(job.snapshot.key, userId, item, old?.state.status === 'failed');
    unsubscribe(); results.push(res);
    if (res.ok) { job.snapshot.completed++; job.snapshot.progress[item.id] = 100;
      if (res.uploadedUrl) void writeComposerHolePhoto(holeJob, userId, { ...item, streamId: res.streamId ?? null, posterUrl: res.posterUrl ?? null }, res.uploadedUrl);
    } else job.snapshot.failed++;
    emit(job);
  }));

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
  holeJob?: ComposerHoleJob,
): Promise<ReviewUploadResult[]> {
  const existing = jobs.get(key);
  if (existing && existing.snapshot.running) {
    // A foreground tile retry may already own the bytes. Capture optional
    // submit choices on join too, without restarting uploads or waiting on tags.
    if (holeJob) void existing.promise.then(results => {
      for (const result of results) {
        const item = items.find(input => input.id === result.id);
        if (item && result.ok && result.uploadedUrl) void writeComposerHolePhoto(holeJob, userId, { ...item, streamId: result.streamId ?? null, posterUrl: result.posterUrl ?? null }, result.uploadedUrl);
      }
    });
    return existing.promise;
  }

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

  job.promise = runJob(job, userId, items, holeJob).then((results) => {
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
    set?.delete(listener);
    if (set?.size === 0 && publishListeners.get(key) === set) publishListeners.delete(key);
  };
}

export async function uploadAndPublishReview(
  key: string,
  userId: string,
  pendingId: string,
  items: ReviewUploadInput[],
  onPublished?: () => void,
  holeJob?: ComposerHoleJob,
): Promise<PublishOutcome> {
  retainReviewPreuploads(key);
  const byId = new Map(items.map((i) => [i.id, i]));
  setPublishState(key, {
    phase: 'uploading', uploaded: 0, total: items.length, percent: 0,
  });
  let results: ReviewUploadResult[];
  const promise = startReviewUpload(key, userId, items, holeJob); // registers the job
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
    const input = byId.get(r.id);
    if (!input) throw new Error('Missing upload input');
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
