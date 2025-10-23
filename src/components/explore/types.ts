
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
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
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
  };
  media?: {
    id: string;
    media_type: 'video' | 'image';
    media_url: string;
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
