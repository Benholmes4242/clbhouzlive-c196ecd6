/**
 * Resilient Video Upload Wrapper
 *
 * Wraps uploadVideoWithTus with the platform-wide resilience machinery
 * that must apply to every live video upload path (post-v2, review-v2):
 *
 *   a) Screen wake lock (uploadWakeLock)          — keep the device awake
 *   b) Visibility monitor (uploadVisibilityMonitor)— know when we backgrounded
 *   c) Stall watchdog                              — TUS's socket can freeze
 *      silently when the OS suspends the tab; retries only fire on XHR
 *      errors, so we detect stalls by lack of byte-advance and force a
 *      resume ourselves.
 *   d) Foreground poke                             — when the app returns to
 *      the foreground after a long background stint, proactively resume
 *      every active upload rather than waiting for TUS to notice a dead
 *      socket.
 *   e) Large-file tuning                           — smaller chunks and much
 *      longer retryDelays for files >500MB so a multi-minute network dip
 *      does not exhaust the retry budget.
 *
 * Kept out of tusVideoUpload.ts on purpose — the base module stays
 * strictly about the TUS protocol; resilience is a wrapper concern.
 */

import * as tus from 'tus-js-client';
import {
  uploadVideoWithTus,
  type TusUploadOptions,
  type TusUploadResult,
} from './tusVideoUpload';
import { uploadWakeLock } from './uploadWakeLock';
import { uploadVisibilityMonitor } from './uploadVisibilityMonitor';
import { uploadEventBus } from './uploadEventBus';
import { waitForOnline } from './networkStatus';

const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500MB
const LARGE_FILE_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB
const LARGE_FILE_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000, 30000, 60000, 120000];

const STALL_CHECK_INTERVAL_MS = 10_000;
const STALL_THRESHOLD_MS = 45_000;
const MAX_STALL_RESTARTS = 5;

// ---------------------------------------------------------------------------
// Foreground-poke registry: every in-flight resilient upload registers itself
// here. When the visibility monitor fires 'upload:foregrounded' with
// connectionMayBeStale, we poke every registered upload (abort → resume →
// start) rather than just logging as legacy uploadPipeline does.
// ---------------------------------------------------------------------------

type ActiveEntry = {
  upload: tus.Upload;
  poke: () => Promise<void>;
};

const activeUploads = new Set<ActiveEntry>();
let foregroundListenerAttached = false;

function ensureForegroundListener() {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;

  uploadEventBus.on('upload:foregrounded', (evt) => {
    if (!evt.connectionMayBeStale) return;
    if (activeUploads.size === 0) return;

    console.log(
      `[resilient] Foregrounded after ${evt.backgroundDurationSeconds}s — poking ${activeUploads.size} upload(s)`
    );
    for (const entry of activeUploads) {
      entry.poke().catch((err) => {
        console.warn('[resilient] Foreground poke failed:', err);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

export async function uploadVideoResilient(
  options: TusUploadOptions
): Promise<TusUploadResult> {
  ensureForegroundListener();

  const { file } = options;
  const isLarge = file.size > LARGE_FILE_THRESHOLD;

  // Acquire wake lock + visibility monitor BEFORE the upload starts.
  await uploadWakeLock.acquire();
  uploadVisibilityMonitor.start();

  // Byte-advance tracking for the stall watchdog.
  let lastBytes = 0;
  let lastAdvanceAt = Date.now();
  let stallRestarts = 0;
  let watchdogTimer: ReturnType<typeof setInterval> | null = null;
  let registryEntry: ActiveEntry | null = null;
  let finished = false;

  const cleanup = () => {
    if (finished) return;
    finished = true;
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
    if (registryEntry) {
      activeUploads.delete(registryEntry);
      registryEntry = null;
    }
    try {
      uploadVisibilityMonitor.stop();
    } catch {}
    try {
      uploadWakeLock.release();
    } catch {}
  };

  // Wrap the caller's callbacks so we can drive the watchdog + cleanup.
  const wrappedOptions: TusUploadOptions = {
    ...options,
    chunkSize: options.chunkSize ?? (isLarge ? LARGE_FILE_CHUNK_SIZE : undefined),
    retryDelays: options.retryDelays ?? (isLarge ? LARGE_FILE_RETRY_DELAYS : undefined),
    onProgress: (bytesUploaded, bytesTotal) => {
      if (bytesUploaded > lastBytes) {
        lastBytes = bytesUploaded;
        lastAdvanceAt = Date.now();
      }
      try {
        options.onProgress(bytesUploaded, bytesTotal);
      } catch (err) {
        console.warn('[resilient] onProgress handler threw:', err);
      }
    },
    onSuccess: (streamId) => {
      cleanup();
      options.onSuccess(streamId);
    },
    onError: (err) => {
      cleanup();
      options.onError(err);
    },
  };

  let result: TusUploadResult;
  try {
    result = await uploadVideoWithTus(wrappedOptions);
  } catch (err) {
    cleanup();
    throw err;
  }

  // ---- Resume helper shared by watchdog + foreground poke ----------------
  const pokeUpload = async () => {
    if (finished) return;
    try {
      result.upload.abort();
    } catch (err) {
      console.warn('[resilient] abort during poke failed:', err);
    }
    try {
      const previous = await result.upload.findPreviousUploads();
      if (previous.length > 0) {
        result.upload.resumeFromPreviousUpload(previous[0]);
      }
      result.upload.start();
      // Reset the advance clock so we do not immediately re-trigger the watchdog.
      lastAdvanceAt = Date.now();
    } catch (err) {
      console.warn('[resilient] resume during poke failed:', err);
    }
  };

  // ---- Register for foreground pokes -------------------------------------
  registryEntry = { upload: result.upload, poke: pokeUpload };
  activeUploads.add(registryEntry);

  // ---- Stall watchdog ----------------------------------------------------
  watchdogTimer = setInterval(async () => {
    if (finished) return;

    const stalledFor = Date.now() - lastAdvanceAt;
    if (stalledFor < STALL_THRESHOLD_MS) return;

    if (!navigator.onLine) {
      console.log('[resilient] stall detected while offline — waiting for online');
      try {
        await waitForOnline();
      } catch {}
      if (finished) return;
      console.log('[resilient] back online — poking upload');
      await pokeUpload();
      return;
    }

    if (stallRestarts >= MAX_STALL_RESTARTS) {
      console.warn('[resilient] stall restart cap reached — failing upload');
      const stallErr = new Error(
        `upload stalled: no byte advance for ${Math.round(stalledFor / 1000)}s after ${stallRestarts} restart attempts`
      );
      try {
        result.upload.abort();
      } catch {}
      // Route through the wrapped onError so cleanup + caller both run.
      wrappedOptions.onError(stallErr);
      return;
    }

    stallRestarts += 1;
    console.log(
      `[resilient] stall detected (${Math.round(stalledFor / 1000)}s, restart #${stallRestarts}) — poking upload`
    );
    await pokeUpload();
  }, STALL_CHECK_INTERVAL_MS);

  // ---- Return a control surface that also cleans up on caller abort ------
  return {
    upload: result.upload,
    abort: () => {
      cleanup();
      result.abort();
    },
    pause: () => {
      // pause is not terminal — leave watchdog/wake-lock running so resume works.
      result.pause();
    },
    resume: async () => {
      lastAdvanceAt = Date.now();
      await result.resume();
    },
  };
}
