export interface StagedMediaItem {
  id: string;
  file?: File;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
  file_name?: string;
  video_method?: string;
  
  // Staging states
  state: 'queued' | 'uploading' | 'uploaded' | 'processing' | 'ready' | 'error' | 'removed';
  uploadProgress?: number;
  error?: string;
  
  // Metadata
  isNew?: boolean;
  isModified?: boolean;
  originalId?: string;
}

export interface BackgroundUploadJob {
  id: string;
  mediaItemId: string;
  file: File;
  type: 'image' | 'video';
  userId: string;
  onProgress?: (progress: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface MediaManagerState {
  stagedItems: StagedMediaItem[];
  hasChanges: boolean;
  isUploading: boolean;
  uploadQueue: BackgroundUploadJob[];
}