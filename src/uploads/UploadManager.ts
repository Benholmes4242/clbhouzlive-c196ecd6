// Upload Manager - Framework-agnostic singleton for managing upload jobs

import { nanoid } from 'nanoid';
import type { UploadJob, UploadJobInput, SerializedUploadJob, UploadJobStatus, PartialFailureDetails } from './types';
import { uploadEventBus } from './uploadEventBus';

const STORAGE_KEY = 'clbhouz_upload_jobs';

class UploadManager {
  private jobs: Map<string, UploadJob> = new Map();
  private processing: Set<string> = new Set();

  constructor() {
    this.restoreFromStorage();
  }

  /**
   * Enqueue a new upload job. Returns the jobId immediately.
   * The upload will be processed asynchronously.
   * If input.jobId is provided, it will be used; otherwise generates a new one.
   */
  enqueue(input: UploadJobInput): string {
    const jobId = input.jobId || nanoid(12);
    
    const job: UploadJob = {
      jobId,
      type: input.type || 'post', // ✅ Store job type for routing
      actorType: input.actorType,
      actorId: input.actorId,
      userId: input.userId,
      caption: input.caption,
      achievementId: input.achievementId,
      courseInfo: input.courseInfo,
      selectedTags: input.selectedTags,
      files: input.files,
      mediaItems: input.mediaItems,
      studioEditsByMediaId: input.studioEditsByMediaId,
      
      // Review-specific fields (stored for processReviewJob)
      reviewData: input.reviewData,

      visibility: input.visibility,
      
      // Scheduling
      scheduledAt: input.scheduledAt,

      createdAt: new Date().toISOString(),
      status: 'queued',
      progress: {
        totalFiles: input.files.length,
        uploadedFiles: 0,
      },
    };

    this.jobs.set(jobId, job);
    this.persistToStorage();

    // Emit enqueued event
    uploadEventBus.emit('upload:enqueued', {
      type: 'upload:enqueued',
      jobId,
      actorType: input.actorType,
      actorId: input.actorId,
      fileCount: input.files.length,
    });

    console.log(`[UploadManager] Enqueued job ${jobId} with ${input.files.length} files`);

    return jobId;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): UploadJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): UploadJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get pending jobs (queued or in-progress, including partial_failure)
   */
  getPendingJobs(): UploadJob[] {
    return this.getAllJobs().filter(
      j => j.status === 'queued' || j.status === 'creating_post' || j.status === 'uploading_media' || j.status === 'finalizing' || j.status === 'partial_failure'
    );
  }

  /**
   * Check if a job is currently being processed
   */
  isProcessing(jobId: string): boolean {
    return this.processing.has(jobId);
  }

  /**
   * Mark a job as being processed (to prevent double-processing)
   */
  markProcessing(jobId: string): boolean {
    if (this.processing.has(jobId)) return false;
    this.processing.add(jobId);
    return true;
  }

  /**
   * Clear processing flag
   */
  clearProcessing(jobId: string): void {
    this.processing.delete(jobId);
  }

  /**
   * Update job status
   */
  updateStatus(jobId: string, status: UploadJobStatus, postId?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (postId) job.postId = postId;
    
    this.persistToStorage();

    uploadEventBus.emit('upload:status', {
      type: 'upload:status',
      jobId,
      status,
      postId,
    });
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, uploadedFiles: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.progress.uploadedFiles = uploadedFiles;
    this.persistToStorage();

    uploadEventBus.emit('upload:progress', {
      type: 'upload:progress',
      jobId,
      progress: { ...job.progress },
    });
  }

  /**
   * Mark job as complete
   */
  markComplete(jobId: string, postId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'complete';
    job.postId = postId;
    job.progress.uploadedFiles = job.progress.totalFiles;
    
    this.clearProcessing(jobId);
    this.persistToStorage();

    const isScheduled = !!job.scheduledAt;
    
    uploadEventBus.emit('upload:complete', {
      type: 'upload:complete',
      jobId,
      postId,
      actorType: job.actorType,
      actorId: job.actorId,
      isScheduled,
      scheduledAt: job.scheduledAt?.toISOString(),
    });

    console.log(`[UploadManager] Job ${jobId} complete${isScheduled ? ' (scheduled)' : ''}`);
  }

  /**
   * Mark job as failed
   */
  markFailed(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    
    this.clearProcessing(jobId);
    this.persistToStorage();

    uploadEventBus.emit('upload:failed', {
      type: 'upload:failed',
      jobId,
      error,
      postId: job.postId,
    });

    console.error(`[UploadManager] Job ${jobId} failed:`, error);
  }

  /**
   * Dismiss (remove) a completed or failed job
   */
  dismiss(jobId: string): void {
    this.jobs.delete(jobId);
    this.processing.delete(jobId);
    this.persistToStorage();
  }

  /**
   * Reset a failed job for retry
   */
  resetForRetry(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || (job.status !== 'failed' && job.status !== 'partial_failure')) return;

    job.status = 'queued';
    job.error = undefined;
    job.progress.uploadedFiles = 0;
    job.partialFailure = undefined;
    
    this.persistToStorage();

    uploadEventBus.emit('upload:status', {
      type: 'upload:status',
      jobId,
      status: 'queued',
    });
  }

  /**
   * Mark job as partial failure (some files uploaded, some failed)
   */
  markPartialFailure(jobId: string, details: PartialFailureDetails): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'partial_failure';
    job.partialFailure = details;
    job.postId = details.postId;
    
    this.clearProcessing(jobId);
    this.persistToStorage();

    console.log(`[UploadManager] Job ${jobId} partial failure: ${details.completedFiles}/${details.totalFiles} completed`);
  }

  /**
   * Persist jobs to localStorage (metadata only, not files)
   */
  private persistToStorage(): void {
    try {
      const serialized: SerializedUploadJob[] = Array.from(this.jobs.values()).map(job => ({
        jobId: job.jobId,
        postId: job.postId,
        actorType: job.actorType,
        actorId: job.actorId,
        userId: job.userId,
        caption: job.caption,
        achievementId: job.achievementId,
        createdAt: job.createdAt,
        status: job.status,
        progress: job.progress,
        error: job.error,
        fileCount: job.files.length,
        visibility: job.visibility,
        partialFailure: job.partialFailure,
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.warn('[UploadManager] Failed to persist to storage:', e);
    }
  }

  /**
   * Restore jobs from localStorage
   * Jobs that were mid-upload are marked as failed (files can't be restored)
   */
  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const serialized: SerializedUploadJob[] = JSON.parse(stored);
      
      for (const s of serialized) {
        // Skip completed jobs older than 1 hour
        const age = Date.now() - new Date(s.createdAt).getTime();
        if (s.status === 'complete' && age > 60 * 60 * 1000) continue;

        // Mark in-progress jobs as failed (files can't be restored)
        const wasMidUpload = ['queued', 'creating_post', 'uploading_media', 'finalizing'].includes(s.status);
        // Partial failures survive restore — they have a postId but need retry or cleanup
        const isPartialFailure = s.status === 'partial_failure';
        
        const job: UploadJob = {
          jobId: s.jobId,
          postId: s.postId,
          actorType: s.actorType,
          actorId: s.actorId,
          userId: s.userId,
          caption: s.caption,
          achievementId: s.achievementId,
          createdAt: s.createdAt,
          status: wasMidUpload ? 'failed' : s.status,
          progress: s.progress,
          error: wasMidUpload ? 'Upload interrupted - page was refreshed' : s.error,
          files: [],
          visibility: s.visibility,
          partialFailure: isPartialFailure ? s.partialFailure : undefined,
        };

        this.jobs.set(s.jobId, job);
      }

      // Clean up storage after restore
      this.persistToStorage();
    } catch (e) {
      console.warn('[UploadManager] Failed to restore from storage:', e);
    }
  }
}

// Export singleton instance
export const uploadManager = new UploadManager();
