
// Polymorphic creator - works for personal and business actors
export interface CreatorInfo {
  type: 'personal' | 'business';
  id: string;
  name: string;
  avatarUrl?: string;
  username?: string;
  verified?: boolean;
  subtitle?: string; // homeClub for personal, location/category for business
  handicap?: number | string; // Only for personal
}

export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  comments?: number;
  shares?: number;
  duration?: string;
  durationSeconds?: number; // Numeric duration for filtering (temporary until DB field added)
  thumbnailSrc?: string;
  createdAt?: string | Date; // Date the content was posted
  
  // Actor/author info (polymorphic)
  actorType?: 'personal' | 'business' | null;
  actorId?: string | null;
  
  // Polymorphic creator (replaces user for unified rendering)
  creator?: CreatorInfo;
  
  // Legacy user field for backward compatibility
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
    homeClub?: string;
    handicap?: number | string;
  };
  
  // Business info when actor is business
  business?: {
    id: string;
    name: string;
    logoUrl?: string;
    isVerified?: boolean;
    category?: string;
    location?: string;
  };
  
  label?: string;
  isFollowing?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButton?: string;
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    sub_country?: string | null;
    region?: string | null;
  };
  media?: {
    id: string;
    media_type: 'video' | 'image';
    media_url: string;
    poster_url?: string | null;
    stream_id?: string | null;
    width?: number | null;
    height?: number | null;
    aspect_ratio?: number | null;
    display_order?: number | null;
    filter_id?: string | null;
    studio_edits?: any | null;
  }[];
  audioTrack?: {
    title: string;
    artist?: string;
    isOriginal?: boolean;
  };
  // Landscape card flags
  isFeatured?: boolean; // Priority 1 for landscape slots
  landscapeSuitable?: boolean; // Priority 2 for landscape slots
  aspectRatio?: number; // Video aspect ratio (width/height) for eligibility checking
  width?: number; // Encoded media width
  height?: number; // Encoded media height
  categories?: string[]; // Category IDs from Create Moment (e.g., 'funny', 'tips-coaching')
  badges?: string[]; // Achievement badges (e.g., 'birdie', 'eagle', 'hio')
  achievementId?: string | null; // Non-null = achievement post (not editable)
  
  // Review post fields
  isReview?: boolean; // True if this is a shared review post
  sourceReviewId?: string | null; // ID of the source course_rating
  reviewRating?: number | null; // Rating from the review (1-10)
  reviewText?: string | null; // Written review caption from course_ratings
}

export interface CTAContentItem {
  id: string;
  type: 'cta';
  title: string;
  description: string;
  src: string;
  likes: number;
}

// Filter constants for type safety
export const FILTER_TYPES = {
  SHORTS: 'Shorts',
  CHANNELS: 'Channels',
  VIDEOS: 'Videos',
  PHOTOS: 'Photos',
  FOLLOWING: 'Following',
  FRIENDS: 'Following', // Back-compat alias
  VERIFIED_PROS: 'Verified Pros',
  HACK_SHACK: 'Hack Shack',
  BRAIN_GAME: 'Brain Game'
} as const;

export const MEDIA_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image'
} as const;

export const filterOptions = [
  FILTER_TYPES.SHORTS,
  FILTER_TYPES.CHANNELS,
  FILTER_TYPES.VIDEOS,
  FILTER_TYPES.PHOTOS,
  FILTER_TYPES.FOLLOWING,
  FILTER_TYPES.VERIFIED_PROS,
  FILTER_TYPES.HACK_SHACK
];
