// Activity Media Grid Types

export type AspectRatio = 'portrait' | 'square' | 'landscape';
export type MediaStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type ViewMode = 'compact' | 'immersive';

export interface ActivityMediaItem {
  id: string;
  postId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  aspectRatio?: AspectRatio;
  courseName?: string;
  roundDate?: string;
  additionalMediaCount?: number;
  isMilestone?: boolean;
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
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    filter_id?: string | null;
    studio_edits?: any | null;
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
