/**
 * Shared media types across the application
 */

export type MediaKind = 'image' | 'video';

export type MediaItem = {
  id: string;
  type: MediaKind;
  url: string;
  alt?: string;
  posterUrl?: string;   // filled at mapping time for videos
  streamId?: string;    // optional, derived from Cloudflare Stream URLs
};

// Database-specific interfaces for media tables
export interface PostMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string;
  stream_id?: string;
}

export interface CourseReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string;
  stream_id?: string;
}