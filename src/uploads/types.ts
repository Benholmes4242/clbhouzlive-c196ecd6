// Upload job types

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
  studioEditsByMediaId?: Record<string, { filter?: string }>;

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
  studioEditsByMediaId?: Record<string, { filter?: string }>;
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
