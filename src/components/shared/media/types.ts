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
  /** BRIEF_HOLE_PANEL_CAROUSEL §5 — optional; callers that omit them render
   * exactly as before. hlsUrl attaches the stream instead of src=previewUrl;
   * caption renders bottom-left over the backdrop. */
  hlsUrl?: string;
  caption?: { kicker: string; title: string; credit?: string };
}
