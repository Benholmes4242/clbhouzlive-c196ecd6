// Upload event types

import type { UploadJob, UploadJobStatus, UploadJobProgress } from './types';

export interface UploadEnqueuedEvent {
  type: 'upload:enqueued';
  jobId: string;
  actorType: 'personal' | 'creator' | 'business';
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
  actorType: 'personal' | 'creator' | 'business';
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

export type UploadEvent =
  | UploadEnqueuedEvent
  | UploadStatusEvent
  | UploadProgressEvent
  | UploadCompleteEvent
  | UploadFailedEvent;
