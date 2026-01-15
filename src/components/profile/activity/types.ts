// Activity Media Grid Types

export type AspectRatio = 'portrait' | 'square' | 'landscape';
export type MediaStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type ViewMode = 'compact' | 'immersive';

export interface ActivityMediaItem {
  id: string;
  postId: string;
  type: string; // 'image' | 'video'
  url: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  mp4FallbackUrl?: string; // AUDIT FIX #2: MP4 fallback when HLS fails
  aspectRatio?: AspectRatio;
  courseName?: string;
  roundDate?: string;
  additionalMediaCount?: number;
  isMilestone?: boolean;
  isAutoplayCandidate?: boolean; // Every 3rd video is a candidate
  durationSeconds?: number | null;
  sortIndex?: number; // Used for stable ordering in autoplay logic
}

export interface ActivityMediaGridProps {
  posts: ActivityPost[];
  isLoading?: boolean;
  onPostPress?: (postId: string) => void;
  viewMode?: ViewMode;
}

export interface ActivityMediaCardProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
  aspectRatio: AspectRatio;
}

// Re-export for convenience
export interface ActivityPost {
  id: string;
  type: 'post' | 'share' | 'comment';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  created_at: string;
  course_id?: string | null;
  badges?: string[] | null;
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    filter_id?: string | null;
    studio_edits?: any | null;
    aspect_ratio?: number | null;
    poster_url?: string | null;
    duration_seconds?: number | null;
  }>;
  post_tags: Array<{
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
    tagged_entity?: {
      id: string;
      entity_type: 'user' | 'golf_club' | 'business';
      entity_id: string;
      name: string;
      username: string | null;
    };
  }>;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}
