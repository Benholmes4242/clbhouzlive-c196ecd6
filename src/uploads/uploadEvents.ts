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

export interface UploadFailedEvent {
  type: 'upload:failed';
  jobId: string;
  error: string;
  postId?: string;
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

export type UploadEvent =
  | UploadEnqueuedEvent
  | UploadStatusEvent
  | UploadProgressEvent
  | UploadCompleteEvent
  | UploadFailedEvent
  | FileUploadStartEvent
  | FileUploadProgressEvent
  | FileUploadCompleteEvent
  | FileUploadFailedEvent;
