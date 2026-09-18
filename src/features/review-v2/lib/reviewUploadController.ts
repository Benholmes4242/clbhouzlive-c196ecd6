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

export interface ReviewUploadInput {
  /** Client item id — echoed back on the result so the caller can match. */
  id: string;
  type: 'image' | 'video';
  file: File;
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
