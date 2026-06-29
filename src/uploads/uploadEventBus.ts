// Upload event bus singleton

import { SimpleEventBus } from '@/events/eventBus';
import type {
  UploadEnqueuedEvent,
  UploadStatusEvent,
  UploadProgressEvent,
  UploadCompleteEvent,
  UploadFailedEvent,
  UploadPartialFailureEvent,
  ReviewRatingCreatedEvent,
  PostShellCreatedEvent,
  FileUploadStartEvent,
  FileUploadProgressEvent,
  FileUploadCompleteEvent,
  FileUploadFailedEvent,
  UploadBackgroundedEvent,
  UploadForegroundedEvent,
  UploadPageHidingEvent,
} from './uploadEvents';

type UploadEventMap = {
  'upload:enqueued': UploadEnqueuedEvent;
  'upload:status': UploadStatusEvent;
  'upload:progress': UploadProgressEvent;
  'upload:complete': UploadCompleteEvent;
  'upload:failed': UploadFailedEvent;
  'upload:partial-failure': UploadPartialFailureEvent;
  // Review-specific: emitted immediately when rating record is created
  'review:rating-created': ReviewRatingCreatedEvent;
  // Post-specific: emitted immediately when post row is created
  'post:shell-created': PostShellCreatedEvent;
  // Per-file events
  'file:upload-start': FileUploadStartEvent;
  'file:upload-progress': FileUploadProgressEvent;
  'file:upload-complete': FileUploadCompleteEvent;
  'file:upload-failed': FileUploadFailedEvent;
  // Visibility / background events
  'upload:backgrounded': UploadBackgroundedEvent;
  'upload:foregrounded': UploadForegroundedEvent;
  'upload:page-hiding': UploadPageHidingEvent;
};

export const uploadEventBus = new SimpleEventBus<UploadEventMap>();
