// Post event types for unified event system

export type ActorType = 'personal' | 'creator' | 'business';

export interface PostCreatedEvent {
  type: 'post:created';
  postId: string;
  actorType: ActorType;
  actorId: string;        // personal: user_id; business: business_id
  userId: string;         // auth.uid() (audit/debug)
  createdAt: string;      // ISO timestamp
}

export interface PostUpdatedEvent {
  type: 'post:updated';
  postId: string;
  actorType: ActorType;
  actorId: string;
}

export interface PostDeletedEvent {
  type: 'post:deleted';
  postId: string;
  actorType: ActorType;
  actorId: string;
}

export type PostEvent = PostCreatedEvent | PostUpdatedEvent | PostDeletedEvent;
