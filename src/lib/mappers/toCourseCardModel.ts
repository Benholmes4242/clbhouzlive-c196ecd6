import { CourseCardModel } from '@/types/courseCard';

/**
 * Maps raw course data from various sources to the unified CourseCardModel.
 * 
 * This is the ADAPTER LAYER that ensures all course cards receive
 * consistently shaped data regardless of the source.
 * 
 * Explore is the reference implementation for data sourcing:
 * - imageUrl: thumbnail_image
 * - communityRating: average_rating
 * - ranks: global_rank, regional_rank, usa_rank
 */

// Generic course shape from golf_courses table or search RPC (Explore, GlobalTop100, VirtualizedCourseList)
// This is the CANONICAL raw course type - all course sources should align to this shape
export interface GolfCourseRaw {
  id: string;
  name: string;
  country: string;
  sub_country?: string | null;
  region?: string | null;
  thumbnail_image?: string | null;
  average_rating?: number | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
}

// Leaderboard course shape
interface LeaderboardCourseRaw {
  course_id: string;
  course_name: string;
  country: string;
  sub_country?: string | null;
  thumbnail_url?: string | null;
  avg_rating?: number | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  times_played?: number;
  friends_count?: number;
}

// Top 100 round shape
interface Top100RoundRaw {
  course_id: string;
  course_name: string;
  country?: string | null;
  sub_country?: string | null;
  image_url?: string | null;
  rating?: number | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  played_at?: string | null;
}

// Friends course shape
interface FriendsCourseRaw {
  course_id: string;
  course_name: string;
  country?: string | null;
  sub_country?: string | null;
  thumbnail_url?: string | null;
  total_friends_played?: number;
  top100_memberships?: Array<{ list_id: string; rank: number }>;
}

/**
 * Build location text from country and sub_country
 */
function buildLocationText(country?: string | null, subCountry?: string | null): string {
  if (subCountry && country) {
    return `${subCountry}, ${country}`;
  }
  return country || 'Unknown location';
}

/**
 * Map from golf_courses table (Explore, GlobalTop100, VirtualizedCourseList)
 */
export function fromGolfCourse(course: GolfCourseRaw, context?: Partial<CourseCardModel['context']>): CourseCardModel {
  return {
    id: course.id,
    name: course.name,
    locationText: buildLocationText(course.country, course.sub_country),
    imageUrl: course.thumbnail_image,
    communityRating: course.average_rating,
    ranks: {
      global: course.global_rank,
      regional: course.regional_rank,
      usa: course.usa_rank,
    },
    context,
    country: course.country,
  };
}

/**
 * Map from leaderboard course data
 */
export function fromLeaderboardCourse(course: LeaderboardCourseRaw): CourseCardModel {
  return {
    id: course.course_id,
    name: course.course_name,
    locationText: buildLocationText(course.country, course.sub_country),
    imageUrl: course.thumbnail_url,
    communityRating: course.avg_rating,
    ratingCount: course.times_played,
    ranks: {
      global: course.global_rank,
      regional: course.regional_rank,
      usa: course.usa_rank,
    },
    context: {
      playedByCount: course.times_played,
      friendsPlayedCount: course.friends_count,
    },
    country: course.country,
  };
}

/**
 * Map from Top 100 recent round data
 */
export function fromTop100Round(round: Top100RoundRaw): CourseCardModel {
  return {
    id: round.course_id,
    name: round.course_name,
    locationText: buildLocationText(round.country, round.sub_country),
    imageUrl: round.image_url,
    communityRating: round.rating,
    ranks: {
      global: round.global_rank,
      regional: round.regional_rank,
      usa: round.usa_rank,
    },
    context: {
      lastPlayedAt: round.played_at,
    },
    country: round.country || undefined,
  };
}

/**
 * Map from friends course data
 */
export function fromFriendsCourse(course: FriendsCourseRaw): CourseCardModel {
  // Extract ranks from top100_memberships
  const globalMembership = course.top100_memberships?.find(m => m.list_id.includes('global'));
  const usaMembership = course.top100_memberships?.find(m => m.list_id.includes('usa'));
  const regionalMembership = course.top100_memberships?.find(m => 
    m.list_id.includes('gb-i') || m.list_id.includes('europe')
  );

  return {
    id: course.course_id,
    name: course.course_name,
    locationText: buildLocationText(course.country, course.sub_country),
    imageUrl: course.thumbnail_url,
    ranks: {
      global: globalMembership?.rank,
      regional: regionalMembership?.rank,
      usa: usaMembership?.rank,
    },
    context: {
      friendsPlayedCount: course.total_friends_played,
    },
    country: course.country || undefined,
  };
}

/**
 * Generic mapper for any course-like object
 * Falls back gracefully for missing fields
 */
export function toCourseCardModel(course: Record<string, any>, context?: Partial<CourseCardModel['context']>): CourseCardModel {
  const id = course.id || course.course_id;
  const name = course.name || course.course_name;
  const country = course.country;
  const subCountry = course.sub_country || course.subCountry;
  const imageUrl = course.thumbnail_image || course.thumbnail_url || course.image_url || course.imageUrl;
  const rating = course.average_rating || course.avg_rating || course.rating || course.communityRating;

  return {
    id,
    name,
    locationText: buildLocationText(country, subCountry),
    imageUrl,
    communityRating: rating,
    ratingCount: course.times_played || course.ratingCount,
    ranks: {
      global: course.global_rank || course.ranks?.global,
      regional: course.regional_rank || course.ranks?.regional,
      usa: course.usa_rank || course.ranks?.usa,
    },
    context: {
      ...context,
      playedByCount: course.times_played || course.playedByCount,
      friendsPlayedCount: course.friends_count || course.friendsPlayedCount,
      isPlayedByViewer: course.isPlayedByViewer ?? context?.isPlayedByViewer,
      lastPlayedAt: course.last_played_at || course.played_at || context?.lastPlayedAt,
      userRating: course.user_rating || course.userRating || context?.userRating,
    },
    country,
    displayRank: course.displayRank ?? course.display_rank,
  };
}
