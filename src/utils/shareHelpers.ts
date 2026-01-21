import type { SharedCourse, SharedMoment, SharedTeeTime } from '@/types/messaging';

interface CourseInput {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  thumbnail_image?: string | null;
  community_rating?: number | null;
}

interface MomentInput {
  id: string;
  content?: string | null;
  user_profile?: {
    display_name?: string | null;
    profile_photo_url?: string | null;
  } | null;
  post_media?: {
    media_url: string;
    poster_url?: string | null;
  }[] | null;
}

interface TeeTimeInput {
  id: string;
  course_name: string;
  course_image_url?: string | null;
  start_time: string;
  spots_available?: number;
  price?: number | null;
}

/**
 * Creates course share metadata from a course object
 */
export function createCourseShareMetadata(course: CourseInput): SharedCourse {
  const locationParts = [course.region, course.country].filter(Boolean);
  
  return {
    course_id: course.id,
    course_name: course.name,
    course_image_url: course.thumbnail_image || undefined,
    location: locationParts.length > 0 ? locationParts.join(', ') : undefined,
    rating: course.community_rating || undefined,
  };
}

/**
 * Creates moment share metadata from a post/moment object
 */
export function createMomentShareMetadata(moment: MomentInput): SharedMoment {
  const thumbnail = moment.post_media?.[0]?.poster_url || moment.post_media?.[0]?.media_url;
  
  return {
    moment_id: moment.id,
    thumbnail_url: thumbnail || undefined,
    creator_name: moment.user_profile?.display_name || 'Unknown',
    creator_avatar: moment.user_profile?.profile_photo_url || undefined,
    caption: moment.content || undefined,
  };
}

/**
 * Creates tee time share metadata from a game/tee time object
 */
export function createTeeTimeShareMetadata(teeTime: TeeTimeInput): SharedTeeTime {
  const date = new Date(teeTime.start_time);
  
  return {
    tee_time_id: teeTime.id,
    course_name: teeTime.course_name,
    course_image_url: teeTime.course_image_url || undefined,
    date: date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    spots_available: teeTime.spots_available,
    price: teeTime.price ? `$${teeTime.price}` : undefined,
  };
}
