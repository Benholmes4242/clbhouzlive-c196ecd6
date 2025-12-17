// Post event bus singleton

import { SimpleEventBus } from './eventBus';
import type { PostCreatedEvent, PostDeletedEvent } from './postEvents';

type PostEventMap = {
  'post:created': PostCreatedEvent;
  'post:deleted': PostDeletedEvent;
};

export const postEventBus = new SimpleEventBus<PostEventMap>();
