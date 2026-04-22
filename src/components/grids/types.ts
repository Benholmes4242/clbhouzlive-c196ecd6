/**
 * Shared types for the ProfileContentGrid system
 */

export type ContentFilter = 'all' | 'longform' | 'shorts' | 'images';

export interface PostMedia {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  poster_url?: string | null;
  stream_id?: string | null;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: number | null;
  studio_edits?: any;
  filter_id?: string | null;
  /** Phase 4: server-computed format ('clip' | 'video' | 'image') */
  derived_format?: 'clip' | 'video' | 'image' | null;
  /** Phase 4: feed eligibility ('pending' | 'processing' | 'complete' | 'failed' | 'skipped') */
  processing_status?: string | null;
}

export interface GridPost {
  id: string;
  content?: string | null;
  created_at: string;
  user_id?: string;
  post_media?: PostMedia[];
  like_count?: number;
  comment_count?: number;
  course_id?: string | null;
  badges?: string[];
  post_tags?: any[];
  is_pinned?: boolean;
  pinned_until?: string | null;
  [key: string]: any;
}

export interface GridEmptyStateConfig {
  title: string;
  description: string;
  showCTA?: boolean;
  ctaLabel?: string;
}
