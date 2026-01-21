/**
 * Messaging System Types
 * Matches database schema: conversations, conversation_participants, messages
 */

// Enum types matching database constraints
export type ConversationType = 'direct' | 'group' | 'club' | 'travel_company';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'tee_time' | 'course_share' | 'moment_share';

// Golf-specific shareable content types
export interface SharedCourse {
  course_id: string;
  course_name: string;
  course_image_url?: string;
  location?: string;
  rating?: number;
}

export interface SharedTeeTime {
  tee_time_id: string;
  course_name: string;
  course_image_url?: string;
  date: string;
  time: string;
  spots_available?: number;
  price?: string;
}

export interface SharedMoment {
  moment_id: string;
  thumbnail_url?: string;
  creator_name: string;
  creator_avatar?: string;
  caption?: string;
}

export type ShareableContentType = 'course_share' | 'tee_time' | 'moment_share';

export type SharedContentMetadata = SharedCourse | SharedTeeTime | SharedMoment;

/**
 * Conversation table row
 */
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

/**
 * Conversation participant table row
 */
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

/**
 * Message table row
 */
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

/**
 * Profile info for participants/senders
 * Matches public_profiles view columns
 */
export interface ParticipantProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
}

/**
 * Participant with profile data joined
 */
export interface ParticipantWithProfile extends ConversationParticipant {
  profile: ParticipantProfile | null;
}

/**
 * Conversation with all related data for display
 */
export interface ConversationWithDetails extends Conversation {
  participants: ParticipantWithProfile[];
  unread_count: number;
}

/**
 * Message with sender profile for display
 */
export interface MessageWithSender extends Message {
  sender: ParticipantProfile | null;
}

/**
 * Input for sending a message via RPC
 */
export interface SendMessageInput {
  p_conversation_id: string;
  p_content: string;
  p_message_type?: MessageType;
  p_media_url?: string | null;
  p_media_metadata?: Record<string, unknown> | null;
  p_reply_to_id?: string | null;
}
