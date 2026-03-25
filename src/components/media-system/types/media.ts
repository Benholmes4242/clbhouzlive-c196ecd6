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
  reviewText?: string | null;
}

/** Creator relationship to current user */
export type CreatorRelation = 'friend' | 'following' | 'none' | 'system';

export interface FeedPostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index: number;
  end_index: number;
}

export interface FeedPost {
  id: string;
  userId: string;
  actorType: 'personal' | 'business' | 'system';
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
  tags?: FeedPostTag[];
  courseName?: string;
  courseId?: string;
  postType?: string;
  postType?: string;
}


/** Live tournament player row for feed card */
export interface LiveLeaderboardEntry {
  position:     number;
  positionTied: boolean;
  playerId:     string;
  playerName:   string;
  photoUrl:     string | null;
  country:      string | null;
  scoreDisplay: string;     // '-15', '+2', 'E'
  score:        number;     // raw integer for gap calculation
  thru:         string | null; // '14', 'F', '-'
  today:        string | null; // today's round score '+3', '-2'
}

/** Live tournament metadata for feed card */
export interface TournamentLiveMeta {
  tournamentId:   string;
  tournamentName: string;
  tourSlug:       string;
  tourName:       string;
  venueName:      string | null;
  venueCity:      string | null;
  currentRound:   number;
  totalRounds:    number;
  momentumTags:   string[];
  volatilityIndex:number;
  scoreSpread:    number;
  leader:         LiveLeaderboardEntry | null;
  leaderboard:    LiveLeaderboardEntry[];
  lastUpdated:    string;
  tourPriority:   number;
  leaderStats: {
    totalBirdies: number;
    totalEagles:  number;
    totalBogeys:  number;
    totalPars:    number;
    rounds:       (number | null)[];
    drivingDistance?: number | null;
    drivingAccuracy?: number | null;
    greensInReg?:     number | null;
    puttingAverage?:  number | null;
  } | null;
}

/** Live tournament feed post — client-side synthetic, never stored in DB */
export interface TournamentLiveFeedPost extends Omit<FeedPost, 'mediaItems' | 'review' | 'isReview'> {
  postType:    'tournament_live';
  liveMeta:    TournamentLiveMeta;
  mediaItems:  MediaItem[];
  review:      null;
  isReview:    false;
}

// ── PGA Tournament Card Types ──

export type PGACardState = 'live' | 'result' | 'upcoming';

export interface PGACardScoringStats {
  eagles:       number;
  birdies:      number;
  pars:         number;
  bogeys:       number;
  doubleBogeys: number;
}

export interface PGACardLeader {
  playerId:      string;
  playerName:    string;
  photoUrl:      string | null;
  scoreDisplay:  string;
  score:         number;
  thru:          string | null;
  today:         string | null;
  scoringStats?: PGACardScoringStats | null;
}

export interface PGACardChaser {
  position:      number;
  playerName:    string;
  photoUrl:      string | null;
  scoreDisplay?: string;
  isTied?:       boolean;
  scoringStats?: PGACardScoringStats | null;
}

export interface PGACardStats {
  totalEagles:      number;
  totalBirdies:     number;
  totalPars:        number;
  totalBogeys:      number;
  drivingDistance:   number | null;
  drivingAccuracy:  number | null;
  greensInReg:      number | null;
  puttingAverage:   number | null;
}

export interface PGACardData {
  tournamentId:    string;
  tournamentName:  string;
  purse:           number | null;
  state:           PGACardState;
  venueName:       string | null;
  venueCity:       string | null;
  venuePar:        number | null;
  venueYardage:    number | null;
  courseImageUrl:   string | null;
  currentRound:    number;
  totalRounds:     number;
  roundLabel:      string;
  leader:          PGACardLeader | null;
  chasers:         PGACardChaser[];
  leaderStats:     PGACardStats | null;
  insight:         string | null;
  startDate:       string | null;
  endDate:         string | null;
  postId:          string;
  likeCount:       number;
  commentCount:    number;
  isLikedByMe:     boolean;
  winnerBy?:       string | null;
  championSeasonStats?: {
    drivingDistance:  number | null;
    drivingAccuracy: number | null;
    greensInReg:     number | null;
    puttingAverage:  number | null;
  } | null;
}

export interface PGACardFeedPost extends Omit<FeedPost, 'mediaItems' | 'review' | 'isReview'> {
  postType:     'pga_card';
  cardData:     PGACardData;
  mediaItems:   MediaItem[];
  review:       null;
  isReview:     false;
  isLoading?:   boolean;
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

/** Adaptive pool sizing based on device memory */
function getPoolSize(): number {
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory <= 4) {
    return 3; // Reduced pool on low-memory devices
  }
  return 5; // Full pool on capable devices
}

const _poolSize = getPoolSize();

/** Pool configuration constants */
export const POOL_CONFIG = {
  MAX_POOL_SIZE: _poolSize,
  PRELOAD_AHEAD: _poolSize >= 5 ? 2 : 1,
  PRELOAD_BEHIND: _poolSize >= 5 ? 2 : 1,
  RECYCLE_THRESHOLD: 3,
} as const;

/** Preloader configuration */
export const PRELOAD_CONFIG = {
  MANIFEST_CACHE_MAX: 20,
  SEGMENT_CACHE_MAX_MB: 50,
  PRE_CREATED_MAX: 2,
  MAX_CONCURRENT_FETCHES: 3,
} as const;

/** Raw row shape returned by get_suggested_feed / get_friends_feed RPCs */
export interface FeedRpcRow {
  post_id: string;
  post_content: string | null;
  post_created_at: string;
  post_user_id: string;
  post_actor_type: string;
  post_actor_id: string | null;
  post_status: string;
  source_review_id: string | null;
  media_id: string | null;
  media_type: string | null;
  media_url: string | null;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  display_order: number | null;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  creator_is_verified: boolean;
  business_name: string | null;
  business_logo_url: string | null;
  business_is_verified: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  review_rating: number | null;
  review_course_id: string | null;
  review_course_name: string | null;
  review_course_image: string | null;
  review_course_region?: string | null;
  review_course_country?: string | null;
  review_course_sub_country?: string | null;
  review_text?: string | null;
  course_region?: string | null;
  course_country?: string | null;
  creator_relation: string;
  is_liked_by_me: boolean;
  is_followed_by_me: boolean;
  engagement_score: number;
  post_type?: string | null;
  post_tags?: FeedPostTag[] | null;
  post_tags?: FeedPostTag[] | null;
  course_id?: string | null;
  course_name?: string | null;
}

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
