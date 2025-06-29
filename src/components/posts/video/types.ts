
export interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  videoId: string;
  isGridThumbnail?: boolean;
}

export interface GridVideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  videoId: string;
}

export interface StandardVideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  videoId: string;
}

export interface ThumbnailState {
  thumbnailSrc: string;
  thumbnailReady: boolean;
  thumbnailError: boolean;
}
