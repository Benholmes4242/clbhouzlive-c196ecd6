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