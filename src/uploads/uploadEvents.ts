// Upload event types

import type { UploadJob, UploadJobStatus, UploadJobProgress } from './types';

export interface UploadEnqueuedEvent {
  type: 'upload:enqueued';
  jobId: string;
  uploadType?: 'post' | 'review'; // Type of upload
  actorType: 'personal' | 'business';
  actorId: string;
  fileCount: number;
  metadata?: {
    courseName?: string; // For review uploads
  };
}

export interface UploadStatusEvent {
  type: 'upload:status';
  jobId: string;
  status: UploadJobStatus;
  postId?: string;
}

export interface UploadProgressEvent {
  type: 'upload:progress';
  jobId: string;
  progress: UploadJobProgress;
}

export interface UploadCompleteEvent {
  type: 'upload:complete';
  jobId: string;
  uploadType?: 'post' | 'review'; // Type of upload
  postId?: string; // For post uploads
  ratingId?: string; // For review uploads
  courseId?: string; // For review uploads
  actorType: 'personal' | 'business';
  actorId: string;
  isScheduled?: boolean;
  scheduledAt?: string;
}

/**
 * Event emitted immediately after a review rating record is created
 * This allows the UI to navigate immediately while media uploads continue in background
 */
export interface ReviewRatingCreatedEvent {
  type: 'review:rating-created';
  jobId: string;
  ratingId: string;
  courseId: string;
  hasMedia: boolean; // True if media uploads are pending
}

export interface UploadFailedEvent {
  type: 'upload:failed';
  jobId: string;
  error: string;
  postId?: string;
}

export interface UploadPartialFailureEvent {
  type: 'upload:partial-failure';
  jobId: string;
  completedFiles: number;
  failedFiles: number;
  totalFiles: number;
}

// Per-file upload events for progress tracking
export interface FileUploadStartEvent {
  type: 'file:upload-start';
  jobId: string;
  fileId: string;
  fileIndex: number;
  totalFiles: number;
}

export interface FileUploadProgressEvent {
  type: 'file:upload-progress';
  jobId: string;
  fileId: string;
  fileName?: string;
  progress: number; // 0-100
  bytesUploaded?: number;
  bytesTotal?: number;
  speed?: number; // bytes per second
  eta?: number; // seconds remaining
  status?: 'preparing' | 'uploading' | 'paused' | 'complete' | 'failed'; // Optional status indicator
}

export interface FileUploadCompleteEvent {
  type: 'file:upload-complete';
  jobId: string;
  fileId: string;
  fileIndex?: number;
  totalFiles?: number;
}

export interface FileUploadFailedEvent {
  type: 'file:upload-failed';
  jobId: string;
  fileId: string;
  error: string;
}

// Visibility / background events
export interface UploadBackgroundedEvent {
  type: 'upload:backgrounded';
  timestamp: number;
}

export interface UploadForegroundedEvent {
  type: 'upload:foregrounded';
  backgroundDurationSeconds: number;
  connectionMayBeStale: boolean;
}

export interface UploadPageHidingEvent {
  type: 'upload:page-hiding';
}

export type UploadEvent =
  | UploadEnqueuedEvent
  | UploadStatusEvent
  | UploadProgressEvent
  | UploadCompleteEvent
  | UploadFailedEvent
  | UploadPartialFailureEvent
  | ReviewRatingCreatedEvent
  | FileUploadStartEvent
  | FileUploadProgressEvent
  | FileUploadCompleteEvent
  | FileUploadFailedEvent
  | UploadBackgroundedEvent
  | UploadForegroundedEvent
  | UploadPageHidingEvent;
