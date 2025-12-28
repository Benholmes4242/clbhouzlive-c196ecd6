/**
 * Mock post data for testing meta area unification
 * 
 * Toggle SHOW_META_TEST_POST to true to inject a test post into all meta area surfaces.
 * This allows testing that TaggedText, CourseLocationRow, and PostMeta work consistently.
 * 
 * Set to false for production.
 */

// FEATURE FLAG - Toggle this to enable/disable test post injection
export const SHOW_META_TEST_POST = true;

// Tag type matching TaggedText expectations
export interface MockTag {
  id: string;
  entity_type: 'user' | 'business' | 'golf_club';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

// Golf course type for CourseLocationRow
export interface MockGolfCourse {
  id: string;
  name: string;
  slug?: string;
  country: string;
  region?: string;
  sub_country?: string;
}

// User type
export interface MockUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  display_name?: string;
  profile_photo_url?: string;
}

// Base mock data
export const MOCK_CAPTION = 'Amazing round today with @benjaminholmes and @clbhouz at this incredible course! 🏌️';

export const MOCK_TAGS: MockTag[] = [
  {
    id: 'tag-1',
    entity_type: 'user',
    entity_id: 'user-benjamin',
    name: 'Benjamin Holmes',
    start_index: 24,
    end_index: 39,
  },
  {
    id: 'tag-2',
    entity_type: 'business',
    entity_id: 'business-clbhouz',
    name: 'CLB Houz',
    start_index: 44,
    end_index: 52,
  },
];

export const MOCK_GOLF_COURSE: MockGolfCourse = {
  id: 'course-augusta',
  name: 'Augusta National Golf Club',
  slug: 'augusta-national',
  country: 'United States',
  region: 'Georgia',
  sub_country: 'Georgia',
};

export const MOCK_USER: MockUser = {
  id: 'test-user-meta',
  name: 'Test Golfer',
  username: 'testgolfer',
  display_name: 'Test Golfer',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testgolfer',
  profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testgolfer',
};

export const MOCK_THUMBNAIL = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800';

// Create mock post for DiscoverHero / ExploreContentItem format
export function createMockHeroPost() {
  return {
    id: 'test-meta-hero-001',
    title: MOCK_CAPTION,
    caption: MOCK_CAPTION,
    content: MOCK_CAPTION,
    type: 'video' as const,
    src: MOCK_THUMBNAIL,
    media: [{ media_type: 'video', media_url: MOCK_THUMBNAIL }],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: MOCK_TAGS,
    golfCourse: MOCK_GOLF_COURSE,
    user: MOCK_USER,
    likes: 42,
    like_count: 42,
    comments: 7,
    comment_count: 7,
    durationSeconds: 83,
    duration: '1:23',
    aspectRatio: 1.78, // 16:9 landscape
    width: 1920,
    height: 1080,
    landscapeSuitable: true,
  };
}

// Create mock post for CommunityFeedCard format
export function createMockCommunityPost() {
  return {
    id: 'test-meta-community-001',
    type: 'video' as const,
    src: MOCK_THUMBNAIL,
    title: MOCK_CAPTION,
    duration: '1:23',
    durationSeconds: 83,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: MOCK_USER,
    likes: 42,
    likeCount: 42,
    comments: 7,
    commentCount: 7,
    shares: 0,
    isFollowing: true,
    relationshipType: 'friend' as const,
    tags: MOCK_TAGS,
    golfCourse: MOCK_GOLF_COURSE,
  };
}

// Create mock post for DiscoverVerticalFeed (Clubhouse) format
export function createMockClubhousePost() {
  return {
    id: 'test-meta-clubhouse-001',
    title: 'Test Post',
    content: MOCK_CAPTION,
    type: 'video' as const,
    src: MOCK_THUMBNAIL,
    poster: MOCK_THUMBNAIL,
    media: [{ media_type: 'video', media_url: MOCK_THUMBNAIL }],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: MOCK_TAGS,
    golfCourse: MOCK_GOLF_COURSE,
    user: MOCK_USER,
    likes: 42,
    comments: 7,
    durationSeconds: 83,
  };
}

// Create mock video for VideoCardWide format
export function createMockVideoItem() {
  return {
    id: 'test-meta-video-001',
    title: MOCK_CAPTION,
    poster: MOCK_THUMBNAIL,
    src: MOCK_THUMBNAIL,
    hlsUrl: undefined,
    durationSec: 83,
    views: 1234,
    timeAgo: '2 hours ago',
    user: {
      id: MOCK_USER.id,
      name: MOCK_USER.name,
      avatar: MOCK_USER.avatar || '',
      verified: false,
    },
    echoes: 15,
    tag: 'Course Vlog' as const,
    course: MOCK_GOLF_COURSE.name,
    // Extended fields for CourseTag
    courseSlug: MOCK_GOLF_COURSE.slug,
    courseId: MOCK_GOLF_COURSE.id,
  };
}

/**
 * Helper to prepend mock post to an array if feature flag is enabled
 */
export function withMockPost<T>(items: T[], createMock: () => T): T[] {
  if (!SHOW_META_TEST_POST) return items;
  return [createMock(), ...items];
}
