// Post event bus singleton

import { SimpleEventBus } from './eventBus';
import type { PostCreatedEvent, PostUpdatedEvent, PostDeletedEvent } from './postEvents';

type PostEventMap = {
  'post:created': PostCreatedEvent;
  'post:updated': PostUpdatedEvent;
  'post:deleted': PostDeletedEvent;
};

export const postEventBus = new SimpleEventBus<PostEventMap>();
