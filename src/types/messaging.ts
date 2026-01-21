// Types matching the actual database schema for messaging

export type ConversationType = 'direct' | 'group' | 'club' | 'travel_company';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'tee_time' | 'course_share' | 'moment_share';

// Matches conversations table
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
}

// Matches conversation_participants table
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  is_archived: boolean;
}

// Matches messages table
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  media_url: string | null;
  media_metadata: Record<string, unknown> | null;
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

// Extended types with joined data
export interface ParticipantWithProfile extends ConversationParticipant {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

export interface ConversationWithParticipants extends Conversation {
  participants: ParticipantWithProfile[];
  unread_count?: number;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  reply_to?: Message | null;
}

// UI-friendly conversation list item
export interface ConversationListItem {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  participants: ParticipantWithProfile[];
  // For DMs, the other user's info
  other_user?: {
    id: string;
    username: string;
    display_name: string | null;
    profile_photo_url: string | null;
  };
}

// Send message params
export interface SendMessageParams {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
  media_url?: string | null;
  media_metadata?: Record<string, unknown> | null;
  reply_to_id?: string | null;
}
