// Upload job types

// Audio mode for posts - music_only mutes original video audio
export type AudioModePayload = 'original' | 'music_only';

// Studio edits payload that can be persisted
export interface StudioEditsPayload {
  filter?: string;
  music?: {
    trackId: string;
    title: string;
    artist?: string;
    url: string;
    startAt?: number;
    volume?: number;
  } | null;
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
  audioMode?: AudioModePayload;
}

export type UploadJobStatus =
  | 'queued'
  | 'creating_post'
  | 'uploading_media'
  | 'finalizing'
  | 'complete'
  | 'failed';

export type ActorType = 'personal' | 'creator' | 'business';

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
  mediaItems?: Array<{ 
    id: string; 
    file?: File; 
    type?: 'image' | 'video';
    compiledVideo?: { streamId: string; playbackUrl: string; posterUrl: string; duration: number };
    // For restored drafts - already uploaded media
    isRestored?: boolean;
    restoredMediaUrl?: string;
    restoredStreamId?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    duration?: number;
  }>;
  studioEditsByMediaId?: Record<string, StudioEditsPayload>;
  
  // v2 fields
  categories?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
  badges?: string[];
  
  // Scheduling fields
  scheduledAt?: Date | null;

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
  mediaItems?: Array<{ 
    id: string; 
    file?: File; 
    type?: 'image' | 'video';
    compiledVideo?: { streamId: string; playbackUrl: string; posterUrl: string; duration: number };
    // For restored drafts - already uploaded media
    isRestored?: boolean;
    restoredMediaUrl?: string;
    restoredStreamId?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    duration?: number;
  }>;
  studioEditsByMediaId?: Record<string, StudioEditsPayload>;
  // New v2 fields
  categories?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
  badges?: string[];
  // Scheduling
  scheduledAt?: Date | null;
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
  // v2 fields
  categories?: string[];
  visibility?: 'anyone' | 'followers' | 'private';
  badges?: string[];
}
