/**
 * Shared media types across the application
 */

export type MediaKind = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaKind;          // display type
  url: string;              // display URL (image or video stream URL)
  posterUrl?: string | null;
  streamId?: string | null;
  alt?: string | null;
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