import type { Json } from '@/integrations/supabase/types';

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
  | 'moment_share'
  /**
   * SERVER-AUTHORED ONLY (msg_send rejects it). Prose in `body` plus a single
   * relative in-app route in metadata.action. Nothing in the client writes it.
   */
  | 'action';

/** metadata.action on a type='action' message. */
export interface MessageAction {
  label: string;
  /** Relative, internal route only. Absolute URLs are rendered inert. */
  route: string;
}

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

export interface ConversationMember {
  actor_type: ActorType;
  actor_id: string;
  role: MemberRole;
  joined_at: string;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
  verified: boolean | null;
}

export interface ConversationDetail {
  conversation_id: string;
  type: ConversationType;
  title: string | null;
  avatar_url: string | null;
  created_by_user: string;
  created_at: string;
  members: ConversationMember[];
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
  attachments: Json | null;
  metadata: Json | null;
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

export type AttachmentKind = 'image' | 'video' | 'voice' | 'file';

export interface MessageAttachment {
  /** Durable storage path in the private message-media bucket. */
  path: string;
  kind: AttachmentKind;
  /** Pixel width (images/video) for no-layout-shift rendering. */
  w?: number | null;
  /** Pixel height (images/video) for no-layout-shift rendering. */
  h?: number | null;
  /** Seconds (video/voice). */
  duration?: number | null;
  /** Optional poster path for video. */
  poster?: string | null;
  /** Bytes. */
  size?: number | null;
  /** Client-only during optimistic send; never persisted. */
  localUrl?: string | null;
  /** Client-only upload state; never persisted. */
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
}

