/**
 * Extended progress types for real-time upload feedback
 */

export interface DetailedUploadProgress {
  jobId: string;
  status: 'preparing' | 'compressing' | 'uploading' | 'processing' | 'complete' | 'failed' | 'paused';
  
  // Overall progress
  overallPercentage: number;
  currentFileIndex: number;
  totalFiles: number;
  
  // Current file progress
  currentFileName: string;
  currentFilePercentage: number;
  bytesUploaded: number;
  bytesTotal: number;
  
  // Speed & ETA
  uploadSpeed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  
  // Status message for UI
  statusMessage?: string;
  
  // Error info
  error?: string;
  canRetry?: boolean;
  
  // Timestamps
  startedAt: number;
  lastUpdateAt: number;
}

export interface UploadProgressStore {
  activeUploads: Map<string, DetailedUploadProgress>;
  addUpload: (progress: DetailedUploadProgress) => void;
  updateUpload: (jobId: string, updates: Partial<DetailedUploadProgress>) => void;
  removeUpload: (jobId: string) => void;
  getUpload: (jobId: string) => DetailedUploadProgress | undefined;
  getAllUploads: () => DetailedUploadProgress[];
}

/**
 * Create a new progress object for a job
 */
export function createInitialProgress(
  jobId: string,
  totalFiles: number,
  totalBytes: number,
  firstFileName: string
): DetailedUploadProgress {
  return {
    jobId,
    status: 'preparing',
    overallPercentage: 0,
    currentFileIndex: 0,
    totalFiles,
    currentFileName: firstFileName,
    currentFilePercentage: 0,
    bytesUploaded: 0,
    bytesTotal: totalBytes,
    uploadSpeed: 0,
    estimatedTimeRemaining: 0,
    startedAt: Date.now(),
    lastUpdateAt: Date.now(),
  };
}

/**
 * Calculate overall percentage from file progress
 */
export function calculateOverallPercentage(
  completedFiles: number,
  totalFiles: number,
  currentFilePercentage: number
): number {
  if (totalFiles === 0) return 0;
  
  const completedWeight = (completedFiles / totalFiles) * 100;
  const currentWeight = (currentFilePercentage / totalFiles);
  
  return Math.min(Math.round(completedWeight + currentWeight), 100);
}
