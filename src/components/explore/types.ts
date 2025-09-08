
export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  comments?: number;
  shares?: number;
  duration?: string;
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
  FRIENDS: 'Friends',
  VIDEOS: 'Videos',
  PHOTOS: 'Photos',
  TRENDING: 'Trending',
  VERIFIED_PROS: 'Verified Pros',
  CHANNELS: 'Channels',
  HACK_SHACK: 'Hack Shack',
  BRAIN_GAME: 'Brain Game'
} as const;

export const MEDIA_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image'
} as const;

export const filterOptions = [
  FILTER_TYPES.FRIENDS,
  FILTER_TYPES.VIDEOS,
  FILTER_TYPES.PHOTOS,
  FILTER_TYPES.TRENDING,
  FILTER_TYPES.VERIFIED_PROS,
  FILTER_TYPES.CHANNELS,
  FILTER_TYPES.HACK_SHACK
];
