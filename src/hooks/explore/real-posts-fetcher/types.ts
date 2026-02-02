import type { ExploreContentItem } from '@/components/explore/types';

// Raw post data from Supabase query
export interface RawPostData {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  actor_type: 'personal' | 'business' | null;
  actor_id: string | null;
  course_id: string | null;
  categories: string[] | null;
  badges?: string[] | null;
  source_review_id?: string | null;
  like_count?: number;
  comment_count?: number;
  post_media: RawMediaData[];
  post_tags?: RawPostTag[];
  post_likes?: { count: number }[];
  post_comments?: { count: number }[];
}

export interface RawMediaData {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  poster_url?: string | null;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: number | null;
  orientation?: string | null;
  duration_seconds?: number | null;
  filter_id?: string | null;
  studio_edits?: any | null;
  display_order?: number | null;
  created_at?: string;
  media_width?: number | null;
  media_height?: number | null;
  image_orientation?: string | null;
  rotation?: number | null;
}

export interface RawPostTag {
  id: string;
  tagged_entity_id?: string;
  taggable_entities?: {
    id: string;
    entity_type: string;
    entity_id: string;
    name: string;
  } | null;
}

// Hydration data structures
export interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  show_handicap?: boolean | null;
}

export interface BusinessAccount {
  id: string;
  name: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
  category: string | null;
  location: string | null;
}

export interface GolfCourseData {
  id: string;
  name: string;
  country: string | null;
  sub_country?: string | null;
  region?: string | null;
}

export interface HydrationContext {
  userProfiles: Map<string, UserProfile>;
  businessAccounts: Map<string, BusinessAccount>;
  golfCourses: Map<string, GolfCourseData>;
  ratings?: Map<string, number>;
}

// Curation algorithm types
export interface CurationBuckets {
  friendPosts: RawPostData[];
  friendReviews: RawPostData[];
  followedPosts: RawPostData[];
  followedReviews: RawPostData[];
  globalPosts: RawPostData[];
  globalReviews: RawPostData[];
}

// Fetch options
export interface FetchOptions {
  limit?: number;
  offset?: number;
  mediaFilter?: string;
  subFilter?: string;
  durationFilter?: { from: number; to: number | null };
  sortOption?: string;
  currentUserId?: string | null;
}

export interface ClubhouseFetchOptions {
  limit?: number;
  cursor?: string | null;
}

// Filter result for vertical checks
export interface VerticalFilterResult {
  passes: boolean;
  reason?: string;
}

// Re-export ExploreContentItem for convenience
export type { ExploreContentItem };
