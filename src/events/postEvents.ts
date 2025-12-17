// Post event types for unified event system

export type ActorType = 'personal' | 'business';

export interface PostCreatedEvent {
  type: 'post:created';
  postId: string;
  actorType: ActorType;
  actorId: string;        // personal: user_id; business: business_id
  userId: string;         // auth.uid() (audit/debug)
  createdAt: string;      // ISO timestamp
}

export interface PostDeletedEvent {
  type: 'post:deleted';
  postId: string;
  actorType: ActorType;
  actorId: string;
}

export type PostEvent = PostCreatedEvent | PostDeletedEvent;
