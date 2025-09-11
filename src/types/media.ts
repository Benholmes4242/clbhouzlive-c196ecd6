/**
 * Shared media types across the application
 */

export type MediaKind = 'image' | 'video';

// Atomic media unit (single image or video)
export interface MediaItem {
  id: string;
  type: MediaKind;          // display type
  url: string;              // display URL (image or video stream URL)
  posterUrl?: string | null;
  streamId?: string | null;
  alt?: string | null;
}

// Post-level bundle extras expected by post components and fullscreen flows
export interface PostMediaBundleExtras {
  mediaUrls: string[];
  mediaTypes: MediaKind[];
  golfCourse?: { id: string; name: string; country: string };
  user?: { id: string; displayName?: string; profile_photo_url?: string | null };
  displayName?: string;
  content?: string | null;
  postTags?: any[];
  initialIndex?: number;
  videoPosition?: number;
  videoMuted?: boolean;
  aspectRatio?: number;
  poster?: string;
}

// Post-level context holding the atomic items plus bundle extras
export interface PostMediaContext extends PostMediaBundleExtras {
  items: MediaItem[];
}

/** Raw DB row shape(s). Extend if needed. */
export interface DbMediaRow {
  id: string;
  media_type: MediaKind;
  media_url: string;
  poster_url?: string | null;
  file_name?: string | null;
  // optional extras
  display_order?: number | null;
  duration?: number | null;
}