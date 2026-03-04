export interface MediaItem {
  id: string;
  type: 'video' | 'image';
  hlsUrl?: string;
  mp4Url?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
  displayOrder?: number;
}

/** Feed tab modes */
export type FeedTab = 'suggested' | 'friends';

/** Review data attached to a post */
export interface ReviewData {
  reviewId: string;
  courseId: string;
  courseName: string;
  courseImageUrl: string | null;
  rating: number;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseSubCountry?: string | null;
}

/** Creator relationship to current user */
export type CreatorRelation = 'friend' | 'following' | 'none';

export interface FeedPost {
  id: string;
  userId: string;
  actorType: 'personal' | 'business';
  actorId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  creatorRelation: CreatorRelation;
  caption: string;
  mediaItems: MediaItem[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  review: ReviewData | null;
  isReview: boolean;
  isLikedByMe: boolean;
  isFollowedByMe: boolean;
}

export interface VideoSessionState {
  currentTime: number;
  wasMuted: boolean;
  duration: number;
}

export interface PoolElement {
  video: HTMLVideoElement;
  assignedUrl: string | null;
  assignedIndex: number | null;
  lastUsedAt: number;
}

/** Pool configuration constants */
export const POOL_CONFIG = {
  MAX_POOL_SIZE: 5,
  PRELOAD_AHEAD: 2,
  PRELOAD_BEHIND: 2,
  RECYCLE_THRESHOLD: 3,
} as const;

/** Preloader configuration */
export const PRELOAD_CONFIG = {
  MANIFEST_CACHE_MAX: 20,
  SEGMENT_CACHE_MAX_MB: 50,
  PRE_CREATED_MAX: 2,
  MAX_CONCURRENT_FETCHES: 3,
} as const;

/** Timing constants */
export const TIMING = {
  LOAD_TIMEOUT_MS: 10_000,
  CROSSFADE_DURATION_MS: 200,
  AUDIO_FADE_MS: 150,
  AUDIO_FADE_STEPS: 10,
  RAPID_SCROLL_THRESHOLD_MS: 300,
  LOOP_THRESHOLD_S: 0.15,
  LOOP_THRESHOLD_SHORT_S: 0.08,
  SHORT_VIDEO_S: 3,
  STALL_TIMEOUT_MS: 10_000,
  BUFFER_TIMEOUT_MS: 8_000,
  ERROR_AUTO_RETRY_MS: 8_000,
  HLS_RECOVER_WAIT_MS: 3_000,
  HLS_REBUILD_WAIT_MS: 5_000,
} as const;
