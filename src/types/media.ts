// types/media.ts
export type MediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  posterUrl?: string;   // filled at mapping time for videos
  streamId?: string;    // optional, derived
};