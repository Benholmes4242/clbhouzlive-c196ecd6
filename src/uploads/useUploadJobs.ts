// React hook for accessing upload jobs state

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { uploadManager } from './UploadManager';
import { uploadEventBus } from './uploadEventBus';
import { retryJob } from './uploadPipeline';
import type { UploadJob } from './types';

// Create a simple store for React sync
let listeners: Set<() => void> = new Set();
let cachedJobs: UploadJob[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cachedJobs;
}

function notifyListeners() {
  cachedJobs = uploadManager.getAllJobs();
  listeners.forEach(l => l());
}

// Subscribe to upload events to trigger re-renders
uploadEventBus.on('upload:enqueued', notifyListeners);
uploadEventBus.on('upload:status', notifyListeners);
uploadEventBus.on('upload:progress', notifyListeners);
uploadEventBus.on('upload:complete', notifyListeners);
uploadEventBus.on('upload:failed', notifyListeners);
uploadEventBus.on('upload:partial-failure', notifyListeners);

// Initialize cache
cachedJobs = uploadManager.getAllJobs();

/**
 * Hook to access all upload jobs with reactive updates
 */
export function useUploadJobs() {
  const jobs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const pendingJobs = jobs.filter(
    j => j.status === 'queued' || j.status === 'creating_post' || j.status === 'uploading_media' || j.status === 'finalizing' || j.status === 'partial_failure'
  );
  
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const completedJobs = jobs.filter(j => j.status === 'complete');
  const partialFailureJobs = jobs.filter(j => j.status === 'partial_failure');

  const retry = useCallback((jobId: string) => {
    return retryJob(jobId);
  }, []);

  const dismiss = useCallback((jobId: string) => {
    uploadManager.dismiss(jobId);
    notifyListeners();
  }, []);

  return {
    jobs,
    pendingJobs,
    failedJobs,
    completedJobs,
    partialFailureJobs,
    hasPending: pendingJobs.length > 0,
    hasFailed: failedJobs.length > 0,
    hasPartialFailure: partialFailureJobs.length > 0,
    retry,
    dismiss,
  };
}

/**
 * Hook to track upload progress for a specific job
 */
export function useUploadJobProgress(jobId: string | null) {
  const { jobs } = useUploadJobs();
  return jobId ? jobs.find(j => j.jobId === jobId) : undefined;
}
