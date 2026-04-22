// Mock course leaderboard data for dev/demo testing
// Toggle this to enable mock data in development
export const USE_MOCK_COURSE_LEADERBOARD_DATA = false;

// Regions and countries
const REGIONS = ['GB&I', 'USA', 'Europe', 'Global'] as const;
type Region = typeof REGIONS[number];

const REGION_COUNTRIES: Record<Region, string[]> = {
  'GB&I': ['GB', 'IE'],
  'USA': ['US'],
  'Europe': ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'SE', 'DK'],
  'Global': ['AU', 'NZ', 'ZA', 'JP', 'KR', 'AE', 'SG', 'CA', 'MX', 'AR'],
};

// Placeholder images
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600783245777-080fd7ff9253?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=400&h=300&fit=crop',
];

// Generate rating clustered around 6.5-9.5
function generateRating(): number {
  const base = 6.5 + Math.random() * 3; // 6.5-9.5
  const variance = (Math.random() - 0.5) * 0.4;
  return Math.min(10, Math.max(0, Math.round((base + variance) * 10) / 10));
}

// Generate heavy-tailed plays count
function generatePlaysCount(): { total: number; last30d: number } {
  const rand = Math.random();
  let total: number;
  if (rand < 0.5) total = Math.floor(Math.random() * 50) + 5; // 50% have 5-54
  else if (rand < 0.8) total = Math.floor(Math.random() * 100) + 55; // 30% have 55-154
  else if (rand < 0.95) total = Math.floor(Math.random() * 200) + 155; // 15% have 155-354
  else total = Math.floor(Math.random() * 500) + 355; // 5% have 355-854
  
  const last30d = Math.floor(total * (0.05 + Math.random() * 0.15)); // 5-20% of total
  return { total, last30d };
}

// Generate rating delta (mostly near 0, some movers)
function generateRatingDelta(): number {
  const rand = Math.random();
  if (rand < 0.7) return Math.round((Math.random() - 0.5) * 0.4 * 10) / 10; // 70% small change
  if (rand < 0.9) return Math.round((Math.random() - 0.5) * 1.0 * 10) / 10; // 20% medium change
  return Math.round((Math.random() - 0.5) * 2.0 * 10) / 10; // 10% big change
}

// Generate recent date
function generateRecentDate(): string {
  const daysAgo = Math.floor(Math.random() * 60);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export interface MockLeaderboardCourse {
  id: string;
  course_id: string;
  course_name: string;
  hero_image_url: string;
  region: Region;
  country_code: string;
  global_rank: number;
  regional_rank: number | null;
  avg_rating: number;
  ratings_count: number;
  plays_count_30d: number;
  plays_count_total: number;
  trending_score: number;
  rating_delta_30d: number;
  friends_played_count_30d: number;
  last_activity_date: string;
}

// Generate 300 mock courses
function generateMockCourses(): MockLeaderboardCourse[] {
  const courses: MockLeaderboardCourse[] = [];
  
  for (let i = 0; i < 300; i++) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const countries = REGION_COUNTRIES[region];
    const countryCode = countries[Math.floor(Math.random() * countries.length)];
    const plays = generatePlaysCount();
    const avgRating = generateRating();
    const ratingDelta = generateRatingDelta();
    
    // Trending score based on 30d activity + rating velocity
    const trendingScore = plays.last30d * 0.6 + Math.abs(ratingDelta) * 100 + avgRating * 5;
    
    // Friends played (0-12, mostly 0)
    const friendsPlayed = Math.random() < 0.3 
      ? Math.floor(Math.random() * 12) + 1 
      : 0;
    
    courses.push({
      id: `mock-course-${String(i + 1).padStart(3, '0')}`,
      course_id: `mock-course-${String(i + 1).padStart(3, '0')}`,
      course_name: `Course ${String(i + 1).padStart(3, '0')}`,
      hero_image_url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
      region,
      country_code: countryCode,
      global_rank: i + 1,
      regional_rank: i < 100 ? Math.floor(Math.random() * 100) + 1 : null,
      avg_rating: avgRating,
      ratings_count: Math.floor(plays.total * (0.3 + Math.random() * 0.4)),
      plays_count_30d: plays.last30d,
      plays_count_total: plays.total,
      trending_score: Math.round(trendingScore * 10) / 10,
      rating_delta_30d: ratingDelta,
      friends_played_count_30d: friendsPlayed,
      last_activity_date: generateRecentDate(),
    });
  }
  
  return courses;
}

// Cache
let cachedCourses: MockLeaderboardCourse[] | null = null;

export function getMockCourses(): MockLeaderboardCourse[] {
  if (!cachedCourses) {
    cachedCourses = generateMockCourses();
  }
  return cachedCourses;
}

// Sorting functions
export function sortMostPlayed(courses: MockLeaderboardCourse[]): MockLeaderboardCourse[] {
  return [...courses].sort((a, b) => {
    if (b.plays_count_30d !== a.plays_count_30d) return b.plays_count_30d - a.plays_count_30d;
    if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
    return a.course_name.localeCompare(b.course_name);
  });
}

export function sortHighestRated(courses: MockLeaderboardCourse[]): MockLeaderboardCourse[] {
  // Aligned with canonical community-rating tiebreaker chain:
  //   rating DESC → ratings_count DESC → breakdown sum DESC → name ASC.
  // Mock courses don't carry breakdown data, so the third tier collapses
  // to zero on both sides and effectively no-ops; name ASC stays stable.
  return [...courses].sort((a, b) => {
    if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
    if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count;
    return a.course_name.localeCompare(b.course_name);
  });
}

export function sortTrending(courses: MockLeaderboardCourse[]): MockLeaderboardCourse[] {
  return [...courses].sort((a, b) => {
    if (b.trending_score !== a.trending_score) return b.trending_score - a.trending_score;
    if (b.plays_count_30d !== a.plays_count_30d) return b.plays_count_30d - a.plays_count_30d;
    return b.avg_rating - a.avg_rating;
  });
}

export function sortFriendsPlaying(courses: MockLeaderboardCourse[]): MockLeaderboardCourse[] {
  return [...courses]
    .filter(c => c.friends_played_count_30d > 0)
    .sort((a, b) => {
      if (b.friends_played_count_30d !== a.friends_played_count_30d) {
        return b.friends_played_count_30d - a.friends_played_count_30d;
      }
      if (b.plays_count_30d !== a.plays_count_30d) return b.plays_count_30d - a.plays_count_30d;
      return b.avg_rating - a.avg_rating;
    });
}

export type CourseSortKey = 'most_played' | 'highest_rated' | 'trending' | 'friends';

export function getSortedMockCourses(
  sortKey: CourseSortKey,
  audienceFilter: 'all' | 'friends' = 'all'
): MockLeaderboardCourse[] {
  let courses = getMockCourses();
  
  // Apply audience filter
  if (audienceFilter === 'friends') {
    courses = courses.filter(c => c.friends_played_count_30d > 0);
  }
  
  switch (sortKey) {
    case 'highest_rated':
      return sortHighestRated(courses);
    case 'trending':
      return sortTrending(courses);
    case 'friends':
      return sortFriendsPlaying(courses);
    case 'most_played':
    default:
      return sortMostPlayed(courses);
  }
}

// Paginated results
export function getMockCoursesPaginated(
  sortKey: CourseSortKey,
  page: number,
  pageSize: number = 10,
  audienceFilter: 'all' | 'friends' = 'all',
  maxCourses: number = 100
): {
  courses: MockLeaderboardCourse[];
  total: number;
  hasMore: boolean;
} {
  const sorted = getSortedMockCourses(sortKey, audienceFilter);
  const capped = sorted.slice(0, maxCourses);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    courses: capped.slice(start, end),
    total: capped.length,
    hasMore: end < capped.length,
  };
}

// ============================================
// DISCOVERY MODULES
// ============================================

// Mock friend names
const MOCK_FRIEND_NAMES = [
  'James Wilson', 'Emma Thompson', 'Oliver Brown', 'Sophie Davis',
  'William Taylor', 'Charlotte Moore', 'Henry Jackson', 'Amelia White',
  'George Harris', 'Isla Martin', 'Jack Robinson', 'Mia Clark',
  'Thomas Lewis', 'Grace Walker', 'Charlie Hall', 'Poppy Young',
  'Oscar King', 'Lily Wright', 'Harry Green', 'Ruby Baker',
  'Freddie Adams', 'Evie Nelson', 'Archie Hill', 'Florence Scott',
  'Alfie Mitchell', 'Ella Roberts', 'Noah Carter', 'Rosie Phillips',
  'Leo Evans', 'Daisy Collins', 'Jacob Stewart', 'Freya Morris',
];

export interface MockCircleRecentRound {
  id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  course_id: string;
  course_name: string;
  course_image_url: string;
  time_ago: string;
  rating_given: number;
}

// Generate 30 recent rounds by friends
function generateCircleRecentRounds(): MockCircleRecentRound[] {
  const rounds: MockCircleRecentRound[] = [];
  const courses = getMockCourses().slice(0, 50); // Use first 50 courses
  
  for (let i = 0; i < 30; i++) {
    const course = courses[Math.floor(Math.random() * courses.length)];
    const daysAgo = Math.floor(Math.random() * 14) + 1;
    
    rounds.push({
      id: `mock-round-${i + 1}`,
      friend_name: MOCK_FRIEND_NAMES[Math.floor(Math.random() * MOCK_FRIEND_NAMES.length)],
      friend_avatar_url: null, // Will use fallback
      course_id: course.course_id,
      course_name: course.course_name,
      course_image_url: course.hero_image_url,
      time_ago: `${daysAgo}d`,
      rating_given: generateRating(),
    });
  }
  
  // Sort by time ago (most recent first)
  return rounds.sort((a, b) => {
    const aDays = parseInt(a.time_ago);
    const bDays = parseInt(b.time_ago);
    return aDays - bDays;
  });
}

let cachedCircleRounds: MockCircleRecentRound[] | null = null;

export function getMockCircleRecentRounds(): MockCircleRecentRound[] {
  if (!cachedCircleRounds) {
    cachedCircleRounds = generateCircleRecentRounds();
  }
  return cachedCircleRounds;
}

export interface MockCourseOnTheMove {
  id: string;
  course_id: string;
  course_name: string;
  region: Region;
  rating_delta_30d: number;
  trend_label: string;
}

// Generate 20 courses on the move
function generateCoursesOnTheMove(): MockCourseOnTheMove[] {
  const courses = getMockCourses()
    .filter(c => Math.abs(c.rating_delta_30d) >= 0.3)
    .sort((a, b) => Math.abs(b.rating_delta_30d) - Math.abs(a.rating_delta_30d))
    .slice(0, 20);
  
  return courses.map((c, i) => ({
    id: `mock-move-${i + 1}`,
    course_id: c.course_id,
    course_name: c.course_name,
    region: c.region,
    rating_delta_30d: c.rating_delta_30d,
    trend_label: c.rating_delta_30d > 0 
      ? `Rating up +${c.rating_delta_30d.toFixed(1)}`
      : `Rating down ${c.rating_delta_30d.toFixed(1)}`,
  }));
}

let cachedCoursesOnTheMove: MockCourseOnTheMove[] | null = null;

export function getMockCoursesOnTheMove(): MockCourseOnTheMove[] {
  if (!cachedCoursesOnTheMove) {
    cachedCoursesOnTheMove = generateCoursesOnTheMove();
  }
  return cachedCoursesOnTheMove;
}
