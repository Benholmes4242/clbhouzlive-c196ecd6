// Shared media types used across review wizard and post studio

export interface OrderedMediaItem {
  id: string;
  type: 'image' | 'video';
  previewUrl: string;
  thumbnailUrl?: string;
  file?: File;
  order: number;
  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'failed';
  uploadProgress?: number;
}
