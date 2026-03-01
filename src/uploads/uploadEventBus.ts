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
  FileUploadStartEvent,
  FileUploadProgressEvent,
  FileUploadCompleteEvent,
  FileUploadFailedEvent,
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
  // Per-file events
  'file:upload-start': FileUploadStartEvent;
  'file:upload-progress': FileUploadProgressEvent;
  'file:upload-complete': FileUploadCompleteEvent;
  'file:upload-failed': FileUploadFailedEvent;
};

export const uploadEventBus = new SimpleEventBus<UploadEventMap>();
