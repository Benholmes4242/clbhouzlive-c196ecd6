// Upload job types

// Audio mode for posts - music_only mutes original video audio
export type AudioModePayload = 'original' | 'music_only';

// Per-media studio edits payload (stored on post_media)
export interface StudioEditsPayload {
  filter?: string;
  textOverlays?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    scale: number;
    style: string;
    color?: string;
  }>;
  crop?: { ratio: string };
  rotate?: number;
  // LEGACY: music/audioMode - kept for backwards compat read, don't write
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    startAt?: number;
    volume?: number;
  } | null;
  audioMode?: AudioModePayload;
}

// Post-level studio edits payload (stored on posts table)
export interface PostStudioEditsPayload {
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    r2Key?: string;
    startAt?: number;
    volume?: number;
  } | null;
  audioMode?: AudioModePayload;
  achievementBadgeId?: string | null;
}

export type UploadJobStatus =
  | 'queued'
  | 'creating_post'
  | 'uploading_media'
  | 'finalizing'
  | 'complete'
  | 'failed';

export type ActorType = 'personal' | 'business';

export interface UploadJobProgress {
  totalFiles: number;
  uploadedFiles: number;
}

export interface UploadJob {
  jobId: string;
  postId?: string;
  actorType: ActorType;
  actorId: string;
  userId: string;

  caption: string;
  achievementId?: string | null;
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  selectedTags?: any[];
  mediaItems?: Array<{ id: string; file: File }>;
  studioEditsByMediaId?: Record<string, StudioEditsPayload>;
  postStudioEdits?: PostStudioEditsPayload;
  
  // v2 fields
  categories?: string[];
  visibility?: 'anyone' | 'followers' | 'private';

  files: File[];
  createdAt: string;

  status: UploadJobStatus;
  progress: UploadJobProgress;

  error?: string;
}

export interface UploadJobInput {
  actorType: ActorType;
  actorId: string;
  userId: string;
  caption: string;
  achievementId?: string | null;
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  selectedTags?: any[];
  files: File[];
  mediaItems?: Array<{ id: string; file: File }>;
  studioEditsByMediaId?: Record<string, StudioEditsPayload>;
  postStudioEdits?: PostStudioEditsPayload;
  // New v2 fields
  categories?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
}

// Serializable job for localStorage (no File objects)
export interface SerializedUploadJob {
  jobId: string;
  postId?: string;
  actorType: ActorType;
  actorId: string;
  userId: string;
  caption: string;
  achievementId?: string | null;
  createdAt: string;
  status: UploadJobStatus;
  progress: UploadJobProgress;
  error?: string;
  // Files cannot be serialized - job will be marked failed on restore
  fileCount: number;
}
