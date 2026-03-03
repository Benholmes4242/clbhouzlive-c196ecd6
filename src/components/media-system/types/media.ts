export interface MediaItem {
  id: string;
  type: 'video' | 'image';
  hlsUrl?: string;
  mp4Url?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
}

export interface FeedPost {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  caption: string;
  mediaItems: MediaItem[];
  likeCount: number;
  commentCount: number;
}

export interface VideoSessionState {
  currentTime: number;
  wasMuted: boolean;
  duration: number;
}

export interface PoolElement {
  video: HTMLVideoElement;
  assignedUrl: string | null;
  assignedIndex: number | null;
  lastUsedAt: number;
}
