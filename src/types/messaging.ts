// Messaging System Types
// Aligned with database schema: conversations, conversation_participants, messages

export type ConversationType = 'direct' | 'group' | 'club' | 'travel_company';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'tee_time' | 'course_share' | 'moment_share';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string | null;
  user_id: string | null;
  role: ParticipantRole | null;
  joined_at: string | null;
  last_read_at: string | null;
  is_muted: boolean | null;
  is_archived: boolean | null;
}

export interface Message {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  content: string | null;
  message_type: MessageType;
  media_url: string | null;
  media_metadata: Record<string, unknown> | null;
  reply_to_id: string | null;
  is_edited: boolean | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

// Profile info for participants/senders
// Maps to public_profiles view columns
export interface ParticipantProfile {
  id: string;
  username: string | null;
  profile_photo_url: string | null;
  display_name: string | null;
}

// Extended types with joined data
export interface ParticipantWithProfile extends ConversationParticipant {
  profile: ParticipantProfile | null;
}

export interface ConversationWithDetails extends Conversation {
  participants: ParticipantWithProfile[];
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: ParticipantProfile | null;
}

// Input types for creating conversations/messages
export interface CreateGroupChatInput {
  name: string;
  participant_ids: string[];
}

export interface SendMessageInput {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
  media_url?: string;
  media_metadata?: Record<string, unknown>;
  reply_to_id?: string;
}
