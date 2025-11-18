export interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  studio_edits?: {
    filter?: string;
  } | null;
  filter_id?: string | null;
}

export interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index?: number;
  end_index?: number;
}

export interface UserPostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags: PostTag[];
}

export interface UserPostProps {
  post: UserPostData;
  allUserPosts?: UserPostData[];
  source?: 'profile' | 'index';
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region: string;
}