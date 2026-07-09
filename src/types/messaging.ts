export type ActorType = 'personal' | 'business';
export type ConversationType = 'direct' | 'group';
export type MemberRole = 'owner' | 'admin' | 'member';
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'voice'
  | 'system'
  | 'location'
  | 'course_share'
  | 'tee_time_share'
  | 'moment_share';

export interface InboxParticipant {
  actor_type: ActorType;
  actor_id: string;
  role: MemberRole;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
  verified: boolean | null;
}

export interface InboxConversation {
  conversation_id: string;
  type: ConversationType;
  title: string | null;
  avatar_url: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  my_role: MemberRole;
  participants: InboxParticipant[];
}

export interface MessageReaction {
  emoji: string;
  actor_type: ActorType;
  actor_id: string;
  user_id: string;
}

export interface ReplyPreview {
  id: string;
  body: string | null;
  type: MessageType;
  deleted: boolean;
  sender_actor_type: ActorType;
  sender_actor_id: string;
  sender_name: string | null;
}

export interface ThreadMessage {
  id: string;
  conversation_id: string;
  sender_actor_type: ActorType;
  sender_actor_id: string;
  sender_user_id: string;
  sender_name: string | null;
  sender_avatar_url: string | null;
  sender_username: string | null;
  sender_verified: boolean | null;
  type: MessageType;
  body: string | null;
  attachments: unknown | null;
  metadata: unknown | null;
  reply_to_id: string | null;
  reply_preview: ReplyPreview | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  reactions: MessageReaction[];
  /** Client-only: set by the send hook to render sending/failed states. */
  status?: 'sending' | 'sent' | 'failed';
  /** Idempotency key. Server rows include this; optimistic rows set it too. */
  client_id?: string | null;
}
