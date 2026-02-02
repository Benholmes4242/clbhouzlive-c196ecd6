import type { ExploreContentItem } from '@/components/explore/types';
import type { RawPostData, RawMediaData, HydrationContext, GolfCourseData } from '../types';
import { DEFAULT_AVATAR, RANDOM_AUDIO_TRACKS, RANDOM_LABELS } from '../constants';
import { getStreamPoster } from '@/utils/stream';
import { isValidImageUrl } from '../../urlValidation';

interface FormatOptions {
  isFollowing?: boolean;
  isFriend?: boolean;
  includeAudioTrack?: boolean;
}

/**
 * Normalize numeric values that may come as strings from DB
 */
function toNum(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

/**
 * Get primary media from a post (prefers video)
 */
export function getPrimaryMedia(post: RawPostData): RawMediaData | null {
  const allMedia = post.post_media || [];
  if (allMedia.length === 0) return null;
  
  // Prefer video as primary
  return allMedia.find(m => m.media_type === 'video') || allMedia[0];
}

/**
 * Resolve golf course from post using tags or direct FK
 */
function resolveGolfCourse(
  post: RawPostData,
  courseMap: Map<string, GolfCourseData>
): ExploreContentItem['golfCourse'] | undefined {
  // Priority 1: post_tags with golf_club entity type
  const golfCourseTag = (post.post_tags || []).find(
    tag => tag.taggable_entities?.entity_type === 'golf_club'
  );
  
  if (golfCourseTag?.taggable_entities) {
    const courseId = golfCourseTag.taggable_entities.entity_id;
    const fullCourse = courseMap.get(courseId);
    
    return fullCourse ? {
      id: fullCourse.id,
      name: fullCourse.name,
      country: fullCourse.country || '',
      sub_country: fullCourse.sub_country,
      region: fullCourse.region,
    } : {
      id: courseId,
      name: golfCourseTag.taggable_entities.name,
      country: '',
    };
  }
  
  // Priority 2: Direct course_id FK
  if (post.course_id) {
    const fullCourse = courseMap.get(post.course_id);
    if (fullCourse) {
      return {
        id: fullCourse.id,
        name: fullCourse.name,
        country: fullCourse.country || '',
        sub_country: fullCourse.sub_country,
        region: fullCourse.region,
      };
    }
  }
  
  return undefined;
}

/**
 * Build polymorphic creator object
 */
function buildCreator(
  post: RawPostData,
  context: HydrationContext
): ExploreContentItem['creator'] {
  const isBusinessPost = post.actor_type === 'business';
  
  if (isBusinessPost && post.actor_id) {
    const businessAccount = context.businessAccounts.get(post.actor_id);
    return {
      type: 'business' as const,
      id: businessAccount?.id || post.actor_id,
      name: businessAccount?.name || 'Business',
      avatarUrl: businessAccount?.logo_url || undefined,
      verified: businessAccount?.is_verified || false,
      subtitle: businessAccount?.location || businessAccount?.category || undefined,
    };
  }
  
  const userProfile = context.userProfiles.get(post.user_id);
  return {
    type: 'personal' as const,
    id: post.user_id,
    name: userProfile?.display_name || userProfile?.username || 'User',
    username: userProfile?.username || undefined,
    avatarUrl: userProfile?.profile_photo_url || undefined,
    verified: Math.random() > 0.7, // TODO: use real verified status
    subtitle: userProfile?.home_club || undefined,
    handicap: userProfile?.show_handicap !== false && userProfile?.eg_handicap_index != null
      ? userProfile.eg_handicap_index
      : undefined,
  };
}

/**
 * Build legacy user object for backward compatibility
 */
function buildLegacyUser(
  post: RawPostData,
  context: HydrationContext
): ExploreContentItem['user'] {
  const isBusinessPost = post.actor_type === 'business';
  
  if (isBusinessPost && post.actor_id) {
    const businessAccount = context.businessAccounts.get(post.actor_id);
    return {
      id: businessAccount?.id || post.actor_id,
      name: businessAccount?.name || 'Business',
      avatar: businessAccount?.logo_url || DEFAULT_AVATAR,
      verified: businessAccount?.is_verified || false,
    };
  }
  
  const userProfile = context.userProfiles.get(post.user_id);
  return {
    id: post.user_id,
    name: userProfile?.display_name || userProfile?.username || 'User',
    username: userProfile?.username,
    avatar: userProfile?.profile_photo_url || DEFAULT_AVATAR,
    verified: Math.random() > 0.7,
    homeClub: userProfile?.home_club || undefined,
    handicap: userProfile?.show_handicap !== false && userProfile?.eg_handicap_index != null
      ? userProfile.eg_handicap_index
      : undefined,
  };
}

/**
 * Build business object for business posts
 */
function buildBusinessObject(
  post: RawPostData,
  context: HydrationContext
): ExploreContentItem['business'] | undefined {
  if (post.actor_type !== 'business' || !post.actor_id) return undefined;
  
  const businessAccount = context.businessAccounts.get(post.actor_id);
  if (!businessAccount) return undefined;
  
  return {
    id: businessAccount.id,
    name: businessAccount.name || '',
    logoUrl: businessAccount.logo_url || undefined,
    isVerified: businessAccount.is_verified || false,
    category: businessAccount.category || undefined,
    location: businessAccount.location || undefined,
  };
}

/**
 * Generate random audio track for video posts
 */
function generateAudioTrack(isVideo: boolean): ExploreContentItem['audioTrack'] | undefined {
  if (!isVideo || Math.random() > 0.4) return undefined;
  
  const track = RANDOM_AUDIO_TRACKS[Math.floor(Math.random() * RANDOM_AUDIO_TRACKS.length)];
  return {
    title: track.title,
    artist: 'artist' in track ? track.artist : undefined,
    isOriginal: 'isOriginal' in track ? track.isOriginal : undefined,
  };
}

/**
 * Format a single raw post into an ExploreContentItem
 * This is the SINGLE source of truth for post formatting
 */
export function formatPost(
  post: RawPostData,
  context: HydrationContext,
  options: FormatOptions = {}
): ExploreContentItem | null {
  const primaryMedia = getPrimaryMedia(post);
  if (!primaryMedia) return null;
  
  // Validate media URL
  const isValid =
    (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
    (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
  
  if (!isValid) return null;
  
  const isVideo = primaryMedia.media_type === 'video';
  const durationSeconds = isVideo ? primaryMedia.duration_seconds : undefined;
  
  // Normalize dimensions and aspect ratio
  let width = toNum(primaryMedia.width) ?? toNum(primaryMedia.media_width);
  let height = toNum(primaryMedia.height) ?? toNum(primaryMedia.media_height);
  let aspectRatio = toNum(primaryMedia.aspect_ratio);
  
  // Handle rotated videos
  const rotation = toNum(primaryMedia.rotation);
  if (rotation && (rotation % 180) !== 0 && width && height) {
    [width, height] = [height, width];
    aspectRatio = width / height;
  } else if (!aspectRatio && width && height && height > 0) {
    aspectRatio = width / height;
  }
  
  // Resolve golf course
  const golfCourse = resolveGolfCourse(post, context.golfCourses);
  
  // Build creator and user objects
  const creator = buildCreator(post, context);
  const user = buildLegacyUser(post, context);
  const business = buildBusinessObject(post, context);
  
  // Review post fields
  const isReviewPost = !!post.source_review_id;
  const reviewRating = post.source_review_id && context.ratings
    ? context.ratings.get(post.source_review_id) ?? null
    : null;
  
  // Build media array
  const allMedia = (post.post_media || []);
  const media = allMedia
    .filter(m => isValidImageUrl(m.media_url))
    .map(m => ({
      id: m.id,
      media_type: m.media_type,
      media_url: m.media_url,
      poster_url: m.poster_url,
      width: m.width,
      height: m.height,
      aspect_ratio: m.aspect_ratio,
      filter_id: m.filter_id,
      studio_edits: m.studio_edits,
      display_order: m.display_order,
    }));
  
  return {
    id: post.id,
    type: primaryMedia.media_type,
    src: primaryMedia.media_url,
    thumbnailSrc: isVideo
      ? primaryMedia.poster_url || getStreamPoster(primaryMedia.media_url, '1s') || undefined
      : undefined,
    title: post.content || 'Post',
    likes: post.post_likes?.[0]?.count ?? post.like_count ?? Math.floor(Math.random() * 500) + 50,
    comments: post.post_comments?.[0]?.count ?? post.comment_count ?? Math.floor(Math.random() * 100) + 5,
    shares: Math.floor(Math.random() * 50) + 1,
    duration: durationSeconds != null ? `${durationSeconds}s` : undefined,
    durationSeconds: durationSeconds ?? undefined,
    aspectRatio,
    width,
    height,
    createdAt: post.created_at,
    actorType: (post.actor_type || 'personal') as 'personal' | 'business',
    actorId: post.actor_id || post.user_id,
    creator,
    user,
    business,
    golfCourse,
    categories: post.categories || [],
    badges: post.badges || undefined,
    isReview: isReviewPost,
    sourceReviewId: post.source_review_id || null,
    reviewRating,
    label: Math.random() > 0.6 ? RANDOM_LABELS[Math.floor(Math.random() * RANDOM_LABELS.length)] : undefined,
    isFollowing: options.isFollowing ?? options.isFriend ?? Math.random() > 0.5,
    media,
    audioTrack: options.includeAudioTrack !== false && !isReviewPost
      ? generateAudioTrack(isVideo)
      : undefined,
  } as ExploreContentItem;
}

/**
 * Format a batch of posts using shared hydration context
 */
export function formatPosts(
  posts: RawPostData[],
  context: HydrationContext,
  options: FormatOptions = {}
): ExploreContentItem[] {
  return posts
    .map(post => formatPost(post, context, options))
    .filter((item): item is ExploreContentItem => item !== null);
}

/**
 * Deduplicate posts by ID
 */
export function deduplicatePosts(posts: ExploreContentItem[]): ExploreContentItem[] {
  const seenIds = new Set<string>();
  return posts.filter(post => {
    if (seenIds.has(post.id)) return false;
    seenIds.add(post.id);
    return true;
  });
}
