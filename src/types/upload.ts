export interface UploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
}

export interface ChunkedUploadResult {
  filePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}