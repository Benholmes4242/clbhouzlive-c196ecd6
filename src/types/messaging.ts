/**
 * Messaging System Types
 * Matches database schema: conversations, conversation_participants, messages
 */

// Enum types matching database constraints
export type ConversationType = 'direct' | 'group' | 'club' | 'travel_company';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system' | 'location' | 'tee_time' | 'course_share' | 'moment_share';

// System event types for group management messages
export type SystemEventType = 
  | 'user_added'
  | 'user_left' 
  | 'user_ejected'
  | 'admin_promoted'
  | 'admin_demoted'
  | 'group_created'
  | 'name_changed'
  | 'photo_changed';

export interface SystemMessageMetadata {
  event_type: SystemEventType;
  user_id: string;
  user_name: string;
  actor_id?: string;
  actor_name?: string;
}

// Golf-specific shareable content types
export interface SharedCourse {
  course_id: string;
  course_name: string;
  course_image_url?: string | null;
  course_slug?: string | null;
  location?: string | null;
  // Rankings
  world_rank?: number | null;
  country_rank?: number | null;
  country_code?: string | null;
  // Ratings
  rating?: number | null;
  review_count?: number | null;
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
  moment_id?: string;
  thumbnail_url?: string;
  creator_name?: string;
  creator_avatar?: string;
  caption?: string;
  // For native media picker shares
  media_urls?: string[];
  media_count?: number;
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
  description?: string | null;
  group_settings?: {
    allow_member_edit_info?: boolean;
    allow_member_send_messages?: boolean;
  } | null;
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
  archived_at?: string | null;
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
  eg_handicap_index: number | null;
  home_club: string | null;
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
