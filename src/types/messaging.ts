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
