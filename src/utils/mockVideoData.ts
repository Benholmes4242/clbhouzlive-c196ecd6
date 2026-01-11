/**
 * Mock Video Data Generator for Visual Testing
 * 
 * TEMPORARY: This file is for visual testing of the Videos tab.
 * Set SHOW_MOCK_DATA = false or delete this file when testing is complete.
 */

import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

// Feature flag - set to false to disable mock data
export const SHOW_MOCK_DATA = false;

// Golf courses for realistic tagging
const GOLF_COURSES = [
  { id: 'course-1', name: 'St Andrews Old Course' },
  { id: 'course-2', name: 'Augusta National' },
  { id: 'course-3', name: 'Pebble Beach' },
  { id: 'course-4', name: 'Royal Melbourne' },
  { id: 'course-5', name: 'Pinehurst No. 2' },
  { id: 'course-6', name: 'Cypress Point' },
  { id: 'course-7', name: 'Torrey Pines' },
  { id: 'course-8', name: 'Bethpage Black' },
  { id: 'course-9', name: 'TPC Sawgrass' },
  { id: 'course-10', name: 'Muirfield' },
  { id: 'course-11', name: 'Royal County Down' },
  { id: 'course-12', name: 'Carnoustie' },
  { id: 'course-13', name: 'Whistling Straits' },
  { id: 'course-14', name: 'Oakmont' },
  { id: 'course-15', name: 'Shinnecock Hills' },
];

// Realistic creator data
const CREATORS = [
  { id: 'creator-1', name: 'Mike Reynolds', username: 'golfpro_mike' },
  { id: 'creator-2', name: 'Sarah Chen', username: 'sarahswings' },
  { id: 'creator-3', name: 'Tommy Fleetwood', username: 'tommylinks' },
  { id: 'creator-4', name: 'Jessica Palmer', username: 'jessicaongolf' },
  { id: 'creator-5', name: 'David Kim', username: 'davidk_golf' },
  { id: 'creator-6', name: 'Emily Watson', username: 'em_fairways' },
  { id: 'creator-7', name: 'Chris Morgan', username: 'chrismorgan' },
  { id: 'creator-8', name: 'Lisa Thompson', username: 'lisatgolf' },
  { id: 'creator-9', name: 'James Wilson', username: 'jameswilson_pga' },
  { id: 'creator-10', name: 'Anna Martinez', username: 'anna_golf' },
  { id: 'creator-11', name: 'Mark Johnson', username: 'markj_links' },
  { id: 'creator-12', name: 'Rachel Adams', username: 'rachel_birdies' },
];

// Video titles for variety
const VIDEO_TITLES = [
  'Beautiful morning round at the links',
  'Breaking 80 for the first time!',
  'Driver tips that changed my game',
  'Course vlog: bucket list round',
  'How I fixed my slice in one lesson',
  'Playing in 40mph winds - chaos',
  'My honest review after 18 holes',
  'First time on a championship course',
  'Sunrise tee time - worth the wake up',
  'The shot that saved my round',
  'Why this hole is the toughest in golf',
  'Behind the scenes: tournament prep',
  'Playing with a 25 handicapper',
  'Equipment test: does it really help?',
  'Links golf vs parkland - my take',
  'The putt that won the match',
  'Walking 36 holes in one day',
  'How to handle pressure on the course',
  'My favorite hidden gem course',
  'The perfect golf trip itinerary',
  'Biggest mistakes amateur golfers make',
  'One club challenge - can I break 100?',
  'Bunker shots made simple',
  'Playing in the rain - survival guide',
  'My swing transformation journey',
  'Best golf apps every golfer needs',
  'Course management 101',
  'The mental game breakthrough',
  'Playing matchplay vs stroke',
  'Golf fitness routine that works',
];

// Aspect ratios for thumbnails (width x height)
const ASPECT_RATIOS = [
  { width: 400, height: 225 },  // 16:9 landscape
  { width: 400, height: 600 },  // 9:16 vertical
  { width: 400, height: 400 },  // 1:1 square
  { width: 400, height: 225 },  // 16:9 (more common)
  { width: 400, height: 225 },  // 16:9 (more common)
];

// Duration range for long-form videos (4-20 minutes)
const MIN_DURATION_SECONDS = 240; // 4 minutes
const MAX_DURATION_SECONDS = 1200; // 20 minutes

/**
 * Format seconds to display duration (e.g., "12:34")
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate a random date within the last 30 days
 */
const generateRecentDate = (daysAgo: number = 30): string => {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const randomHours = Math.floor(Math.random() * 24);
  now.setDate(now.getDate() - randomDays);
  now.setHours(now.getHours() - randomHours);
  return now.toISOString();
};

/**
 * Generate mock video data for visual testing
 * @param count Number of mock videos to generate
 * @param section Optional section identifier for unique seeds
 */
export function generateMockVideos(count: number, section: string = 'default'): LongFormVideo[] {
  const videos: LongFormVideo[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = `${section}-${i}`;
    const creator = CREATORS[i % CREATORS.length];
    const course = GOLF_COURSES[i % GOLF_COURSES.length];
    const title = VIDEO_TITLES[i % VIDEO_TITLES.length];
    const aspectRatio = ASPECT_RATIOS[i % ASPECT_RATIOS.length];
    
    // Generate realistic engagement numbers
    const views = Math.floor(Math.random() * 50000) + 100;
    const likes = Math.floor(views * (Math.random() * 0.15 + 0.02)); // 2-17% like rate
    
    // Generate duration (4-20 minutes)
    const durationSeconds = Math.floor(
      Math.random() * (MAX_DURATION_SECONDS - MIN_DURATION_SECONDS) + MIN_DURATION_SECONDS
    );
    
    videos.push({
      id: `mock-${section}-${i}`,
      title: title,
      creatorUserId: creator.id,
      creatorName: creator.name,
      creatorAvatarUrl: `https://picsum.photos/seed/avatar-${creator.id}/100/100`,
      thumbnailUrl: `https://picsum.photos/seed/golf-${seed}/${aspectRatio.width}/${aspectRatio.height}`,
      mediaUrl: undefined, // Mock videos don't have actual media URLs
      duration: formatDuration(durationSeconds),
      durationSeconds: durationSeconds,
      views: views,
      likes: likes,
      createdAt: generateRecentDate(),
      golfCourseId: Math.random() > 0.3 ? course.id : undefined, // 70% have course tag
      golfCourseName: Math.random() > 0.3 ? course.name : undefined,
      isTrending: section === 'trending' || Math.random() > 0.8,
    });
  }
  
  return videos;
}

/**
 * Merge mock data with real data when feature flag is enabled
 */
export function withMockVideos(
  realVideos: LongFormVideo[],
  mockCount: number,
  section: string
): LongFormVideo[] {
  if (!SHOW_MOCK_DATA) {
    return realVideos;
  }
  
  const mockVideos = generateMockVideos(mockCount, section);
  
  // If we have real videos, intersperse mock videos
  if (realVideos.length > 0) {
    // Add mock videos after real ones
    return [...realVideos, ...mockVideos];
  }
  
  // If no real videos, show only mock
  return mockVideos;
}
