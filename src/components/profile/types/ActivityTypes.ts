export interface PostTag {
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
}

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
  categories?: string[] | null;
  source_review_id?: string | null;
  achievement_id?: string | null;
  isReview?: boolean;
  rating?: number;
  course?: {
    id: string;
    name: string;
    country?: string;
    sub_country?: string;
    region?: string;
  };
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    filter_id?: string | null;
    studio_edits?: any | null;
    aspect_ratio?: number | null;
    width?: number | null;
    height?: number | null;
    poster_url?: string | null;
    duration_seconds?: number | null;
  }>;
  post_tags: PostTag[];
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

export interface SocialActivityProps {
  userId?: string;
  isOwnProfile?: boolean;
  activityVisible?: boolean;
  onVisibilityToggle?: (checked: boolean) => void;
  profileDisplayName?: string;
  userType?: string;  // Add userType to check if it's a business account
}
