// Upload event types

import type { UploadJob, UploadJobStatus, UploadJobProgress } from './types';

export interface UploadEnqueuedEvent {
  type: 'upload:enqueued';
  jobId: string;
  actorType: 'personal' | 'business';
  actorId: string;
  fileCount: number;
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
  postId: string;
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
}

export interface FileUploadCompleteEvent {
  type: 'file:upload-complete';
  jobId: string;
  fileId: string;
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
