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
  post_media: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    filter_id?: string | null;
    studio_edits?: any | null;
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
