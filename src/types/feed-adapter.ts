/**
 * Feed Adapter System - Unified Fullscreen Player
 * 
 * Defines the adapter interface for normalizing different feed data structures
 * into a consistent format for the unified fullscreen viewer.
 */

// ============ Media Types ============

export interface MediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  poster_url?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  studio_edits?: StudioEdits;
  duration?: number;
  filter_id?: string | null;
}

export interface StudioEdits {
  filter_id?: string | null;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text_overlays?: TextOverlay[];
  rotation?: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  rotation?: number;
}

// ============ Creator Types ============

export interface CreatorInfo {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  homeClub?: string;
  handicap?: number | string;
  type?: 'personal' | 'business';
}

// ============ Context Types ============

export interface GolfCourseInfo {
  id: string;
  name: string;
  country?: string;
  sub_country?: string | null;
  region?: string | null;
}

export interface MusicTrackInfo {
  title: string;
  artist?: string;
  isOriginal?: boolean;
  audioUrl?: string;
}

export interface ExtractedReviewData {
  courseId: string;
  courseName: string;
  courseLocation?: string;
  rating: number;
  tierLabel: string;
  sourceReviewId: string;
  reviewDate?: string;
  conditionScore?: number;
  designScore?: number;
  facilitiesScore?: number;
  clubhouseScore?: number;
}

// ============ Normalized Item ============

export interface NormalizedItem<T = unknown> {
  id: string;
  media: MediaItem[];
  creator: CreatorInfo;
  likes: number;
  comments: number;
  caption: string | null;
  course: GolfCourseInfo | null;
  musicTrack: MusicTrackInfo | null;
  badges: string[];
  reviewData: ExtractedReviewData | null;
  isReview: boolean;
  categories?: string[];
  createdAt?: string | Date;
  originalItem: T;
}

// ============ Feed Adapter Interface ============

export interface FeedAdapter<T> {
  // Core identification
  getId: (item: T) => string;
  
  // Media
  getMedia: (item: T) => MediaItem[];
  
  // Creator/User
  getCreator: (item: T) => CreatorInfo;
  
  // Engagement
  getLikes: (item: T) => number;
  getComments: (item: T) => number;
  
  // Content
  getCaption: (item: T) => string | null;
  
  // Context
  getCourse: (item: T) => GolfCourseInfo | null;
  getMusicTrack: (item: T) => MusicTrackInfo | null;
  
  // Metadata
  getBadges: (item: T) => string[];
  getReviewData: (item: T) => ExtractedReviewData | null;
  getCategories?: (item: T) => string[];
  getCreatedAt?: (item: T) => string | Date | undefined;
  
  // Optional: Achievement post detection
  getAchievementId?: (item: T) => string | null | undefined;
  
  // Optional: Type checking
  getType?: (item: T) => 'video' | 'image';
  getDuration?: (item: T) => number | undefined;
}
