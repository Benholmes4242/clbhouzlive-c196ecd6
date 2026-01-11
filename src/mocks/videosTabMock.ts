/**
 * Mock data for Videos Tab testing
 * Generates 30 mock video items for all sections
 */

import { ExploreContentItem, CreatorInfo } from '@/components/explore/types';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

// No actual video URLs - we just show posters for mock data
// This prevents "video unavailable" errors

const SAMPLE_THUMBNAILS = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591491719565-9bdea9f7e12f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1622397815068-460586e5d220?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600183952972-8910e218e64d?w=600&h=400&fit=crop', // Landscape
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=600&h=400&fit=crop', // Landscape
];

const MOCK_CREATORS: CreatorInfo[] = [
  { type: 'personal', id: 'mock-1', name: 'Tiger Woods', username: 'tigerwoods', avatarUrl: 'https://i.pravatar.cc/150?u=tiger', verified: true, subtitle: 'Augusta National', handicap: '+6' },
  { type: 'personal', id: 'mock-2', name: 'Rory McIlroy', username: 'rorymcilroy', avatarUrl: 'https://i.pravatar.cc/150?u=rory', verified: true, subtitle: 'Royal Portrush', handicap: '+5' },
  { type: 'personal', id: 'mock-3', name: 'Jordan Spieth', username: 'jordanspieth', avatarUrl: 'https://i.pravatar.cc/150?u=jordan', verified: true, subtitle: 'Dallas Country Club', handicap: '+4' },
  { type: 'creator', id: 'mock-4', name: 'Golf Sidekick', username: 'golfsidekick', avatarUrl: 'https://i.pravatar.cc/150?u=sidekick', verified: true, subtitle: 'Golf Content Creator' },
  { type: 'creator', id: 'mock-5', name: 'Rick Shiels', username: 'rickshiels', avatarUrl: 'https://i.pravatar.cc/150?u=rick', verified: true, subtitle: 'Golf Coach & YouTuber' },
  { type: 'business', id: 'mock-6', name: 'TaylorMade Golf', avatarUrl: 'https://i.pravatar.cc/150?u=taylormade', verified: true, subtitle: 'Equipment Manufacturer' },
  { type: 'personal', id: 'mock-7', name: 'Scottie Scheffler', username: 'scottiescheffler', avatarUrl: 'https://i.pravatar.cc/150?u=scottie', verified: true, subtitle: 'Royal Oaks CC', handicap: '+7' },
  { type: 'personal', id: 'mock-8', name: 'Dustin Johnson', username: 'djohnsonpga', avatarUrl: 'https://i.pravatar.cc/150?u=dustin', verified: true, subtitle: 'The Bear\'s Club', handicap: '+5' },
];

const VIDEO_TITLES = [
  'Perfect drive down the 18th 🔥',
  'When the putt drops just right',
  'Morning round at Pebble Beach',
  'Best shot of my life!',
  'Practice makes perfect 💪',
  'Links golf at its finest',
  'Birdie on a par 5 eagle attempt',
  'Course vlog: St Andrews',
  'How to fix your slice',
  'Driver tips for beginners',
  'Bunker escape masterclass',
  'Putting drill that changed my game',
  'Epic approach shot compilation',
  'Sunset round vibes 🌅',
  'First hole-in-one reaction!',
];

const GOLF_COURSES = [
  { id: 'gc-1', name: 'Pebble Beach Golf Links', country: 'USA', sub_country: 'California', region: 'Monterey' },
  { id: 'gc-2', name: 'St Andrews Old Course', country: 'Scotland', sub_country: 'Fife', region: 'St Andrews' },
  { id: 'gc-3', name: 'Augusta National', country: 'USA', sub_country: 'Georgia', region: 'Augusta' },
  { id: 'gc-4', name: 'Royal County Down', country: 'Northern Ireland', sub_country: 'Down', region: 'Newcastle' },
  { id: 'gc-5', name: 'Cypress Point Club', country: 'USA', sub_country: 'California', region: 'Monterey' },
];

const DURATION_RANGES = {
  short: { min: 15, max: 60 },      // Under 1 min
  medium: { min: 61, max: 240 },    // 1-4 min
  long: { min: 241, max: 600 },     // 4-10 min (long-form)
  extended: { min: 601, max: 1800 }, // 10-30 min (long-form)
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a single mock video item (ExploreContentItem format)
 */
function generateMockVideo(index: number, durationRange?: keyof typeof DURATION_RANGES): ExploreContentItem {
  const range = durationRange ? DURATION_RANGES[durationRange] : randomElement(Object.values(DURATION_RANGES));
  const durationSeconds = randomInt(range.min, range.max);
  const creator = randomElement(MOCK_CREATORS);
  const isLandscape = index % 5 === 0; // Every 5th video is landscape
  
  const thumbnailIndex = isLandscape 
    ? randomInt(5, SAMPLE_THUMBNAILS.length - 1) 
    : randomInt(0, 4);
  
  return {
    id: `mock-video-${index}-${Date.now()}`,
    type: 'video',
    src: '', // No video URL - just show poster
    thumbnailSrc: SAMPLE_THUMBNAILS[thumbnailIndex],
    title: randomElement(VIDEO_TITLES),
    likes: randomInt(50, 15000),
    comments: randomInt(5, 500),
    shares: randomInt(0, 200),
    duration: formatDuration(durationSeconds),
    durationSeconds,
    createdAt: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
    creator,
    actorType: creator.type,
    actorId: creator.id,
    golfCourse: randomElement(GOLF_COURSES),
    aspectRatio: isLandscape ? 16 / 9 : 9 / 16,
    width: isLandscape ? 1920 : 1080,
    height: isLandscape ? 1080 : 1920,
    isFeatured: index < 3, // First 3 are featured
    landscapeSuitable: isLandscape,
    categories: [randomElement(['tips-coaching', 'funny', 'course-vlog', 'highlights', 'reviews'])],
    media: [{
      id: `media-${index}`,
      media_type: 'video',
      media_url: '', // No video URL - just show poster
      poster_url: SAMPLE_THUMBNAILS[thumbnailIndex],
      width: isLandscape ? 1920 : 1080,
      height: isLandscape ? 1080 : 1920,
      aspect_ratio: isLandscape ? 16 / 9 : 9 / 16,
    }],
  };
}

/**
 * Generate a single mock LongFormVideo (for VideosTab sections)
 */
function generateMockLongFormVideo(index: number, section: string): LongFormVideo {
  // Long-form videos are 4+ minutes (240+ seconds)
  const durationSeconds = randomInt(240, 1800);
  const creator = randomElement(MOCK_CREATORS);
  const course = randomElement(GOLF_COURSES);
  const thumbnail = randomElement(SAMPLE_THUMBNAILS);
  
  return {
    id: `mock-longform-${section}-${index}-${Date.now()}`,
    title: randomElement(VIDEO_TITLES),
    creatorUserId: creator.id,
    creatorName: creator.name,
    creatorAvatarUrl: creator.avatarUrl,
    thumbnailUrl: thumbnail,
    mediaUrl: undefined, // No video URL - just show poster/thumbnail
    duration: formatDuration(durationSeconds),
    durationSeconds,
    views: randomInt(100, 50000),
    createdAt: new Date(Date.now() - randomInt(0, 14 * 24 * 60 * 60 * 1000)).toISOString(),
    golfCourseId: course.id,
    golfCourseName: course.name,
    isTrending: section === 'trending',
  };
}

/**
 * Generate mock long-form videos for a specific section
 */
export function generateMockLongFormVideos(
  section: 'recommended' | 'trending' | 'following' | 'courses' | 'all' = 'all',
  count: number = 10
): LongFormVideo[] {
  return Array.from({ length: count }, (_, i) => generateMockLongFormVideo(i, section));
}

/**
 * Generate mock videos for Videos tab (ExploreContentItem format)
 * @param count Number of videos to generate (default 30)
 * @param durationRange Optional filter by duration range
 */
export function generateMockVideos(
  count: number = 30, 
  durationRange?: keyof typeof DURATION_RANGES
): ExploreContentItem[] {
  return Array.from({ length: count }, (_, i) => generateMockVideo(i, durationRange));
}

/**
 * Get mock videos filtered by duration
 */
export function getMockVideosByDuration(
  durationFilter?: { from: number; to: number | null },
  count: number = 30
): ExploreContentItem[] {
  const allMocks = generateMockVideos(count * 2); // Generate extra to filter
  
  if (!durationFilter) return allMocks.slice(0, count);
  
  return allMocks
    .filter(video => {
      const seconds = video.durationSeconds || 0;
      const matchesFrom = seconds >= durationFilter.from;
      const matchesTo = durationFilter.to === null || seconds <= durationFilter.to;
      return matchesFrom && matchesTo;
    })
    .slice(0, count);
}

/**
 * Cached mock videos to prevent regeneration on each render
 */
let cachedMockVideos: ExploreContentItem[] | null = null;
let cachedLongFormVideos: Record<string, LongFormVideo[]> = {};

export function getCachedMockVideos(count: number = 30): ExploreContentItem[] {
  if (!cachedMockVideos || cachedMockVideos.length < count) {
    cachedMockVideos = generateMockVideos(count);
  }
  return cachedMockVideos.slice(0, count);
}

export function getCachedMockLongFormVideos(
  section: 'recommended' | 'trending' | 'following' | 'courses' | 'all',
  count: number = 10
): LongFormVideo[] {
  const key = `${section}-${count}`;
  if (!cachedLongFormVideos[key]) {
    cachedLongFormVideos[key] = generateMockLongFormVideos(section, count);
  }
  return cachedLongFormVideos[key];
}

/**
 * Clear mock cache (useful for testing)
 */
export function clearMockVideoCache(): void {
  cachedMockVideos = null;
  cachedLongFormVideos = {};
}
