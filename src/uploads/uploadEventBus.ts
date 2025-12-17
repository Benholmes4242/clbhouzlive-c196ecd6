// Upload event bus singleton

import { SimpleEventBus } from '@/events/eventBus';
import type {
  UploadEnqueuedEvent,
  UploadStatusEvent,
  UploadProgressEvent,
  UploadCompleteEvent,
  UploadFailedEvent,
} from './uploadEvents';

type UploadEventMap = {
  'upload:enqueued': UploadEnqueuedEvent;
  'upload:status': UploadStatusEvent;
  'upload:progress': UploadProgressEvent;
  'upload:complete': UploadCompleteEvent;
  'upload:failed': UploadFailedEvent;
};

export const uploadEventBus = new SimpleEventBus<UploadEventMap>();
