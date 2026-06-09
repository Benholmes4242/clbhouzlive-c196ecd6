// Minimal shared types preserved from the retired post-studio module.
// These are referenced by services (drafts, capacitor bridge, recent-media, mediaUtils)
// that haven't been refactored yet.

export type StudioActorType = 'personal' | 'business';
export type ComposerMediaType = 'image' | 'video';
export type MediaUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export interface ComposerMediaItem {
  id: string;
  type: ComposerMediaType;
  file?: File;
  previewUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  compiledVideo?: {
    streamId: string;
    playbackUrl: string;
    posterUrl: string;
    duration: number;
  };
  isRestored?: boolean;
  restoredMediaUrl?: string;
  restoredStreamId?: string;
  uploadStatus?: MediaUploadStatus;
  uploadProgress?: number;
  trimStart?: number | null;
  trimEnd?: number | null;
  posterTimestamp?: number | null;
}

export interface TaggedCourse {
  courseId: string;
  courseName: string;
  country?: string;
  region?: string;
  globalRank?: number | null;
}
