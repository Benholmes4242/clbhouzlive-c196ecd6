
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
    images?: string[];
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
    golfCourse?: {
      id: string;
      name: string;
      country: string;
      region?: string;
    };
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeAgo: string;
  golfClubTags?: {
    id: string;
    entity_type: 'golf_club';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
}

export interface UserPostWithType {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    filter_id?: string | null;
    studio_edits?: any | null;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
    start_index?: number;
    end_index?: number;
  }[];
  type: 'user_post';
}
