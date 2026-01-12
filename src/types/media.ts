/**
 * Shared media types across the application
 */

export type MediaKind = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaKind;          // 'image' | 'video'
  url: string;              // file/stream URL
  posterUrl?: string | null;
  streamId?: string | null;
  alt?: string | null;
}

/** Extra fields some renderers want per-item */
export type ExtendedMediaItem = MediaItem & {
  aspectRatio?: number | null;
  poster?: string | null;   // legacy alias; prefer posterUrl
};

/** Post-level context used by posts & fullscreen hooks */
export interface PostMediaContext {
  items: MediaItem[];                 // atomic media items for thumbs/carousels
  mediaUrls: string[];                // convenience arrays for legacy code
  mediaTypes: MediaKind[];
  golfCourse?: { id: string; name: string; country: string; sub_country?: string | null; region?: string | null };
  user?: { id: string; displayName?: string; profile_photo_url?: string | null };
  displayName?: string;
  content?: string;
  postTags?: any[];
  initialIndex?: number;
  videoPosition?: number;
  videoMuted?: boolean;
  studioEdits?: (any | null)[];       // studio edits per media item (filter, music, etc.)
  filterIds?: (string | null)[];      // filter IDs per media item
}

/** Processing status for media with studio edits */
export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'failed' | null;

/** Raw DB row shape(s). Extend if needed. */
export interface DbMediaRow {
  id: string;
  media_type: MediaKind;
  media_url: string;
  poster_url?: string | null;
  file_name?: string | null;
  original_media_url?: string | null;
  processing_status?: ProcessingStatus;
  // optional extras
  display_order?: number | null;
  duration?: number | null;
}