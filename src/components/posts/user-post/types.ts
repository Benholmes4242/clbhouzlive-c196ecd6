export interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  studio_edits?: {
    filter?: string;
  } | null;
  filter_id?: string | null;
  processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'skipped' | null;
  original_media_url?: string | null;
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
  actor_type?: 'personal' | 'business' | null;
  actor_id?: string | null;
  course_id?: string | null;
  badges?: string[];
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  // Business info when actor_type is 'business'
  business?: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
  } | null;
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
  region?: string;
  sub_country?: string;
}