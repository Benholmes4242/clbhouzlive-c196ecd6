
export interface VideoPost {
  id: string;
  type: 'youtube' | 'friend' | 'post';
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
}

export interface UserPostWithType {
  id: string;
  type: 'user_post';
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }>;
}
