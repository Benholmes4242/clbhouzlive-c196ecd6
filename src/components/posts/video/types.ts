
export interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
  videoId: string;
  isGridThumbnail?: boolean;
}

export interface ThumbnailState {
  thumbnailSrc: string;
  thumbnailReady: boolean;
  thumbnailError: boolean;
}
