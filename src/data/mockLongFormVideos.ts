/**
 * Mock long-form videos for testing the Videos tab with realistic volume.
 * 
 * Feature Flag: ENABLE_MOCK_LONGFORM_VIDEOS
 * When enabled, these 25 mock videos are injected into the Videos tab.
 * 
 * To enable: Set ENABLE_MOCK_LONGFORM_VIDEOS = true below
 * To disable: Set ENABLE_MOCK_LONGFORM_VIDEOS = false (default for production)
 */

import type { LongFormVideo } from '@/components/videos/LongFormVideoTile';

// ============ FEATURE FLAG ============
// Set to true to enable mock videos in the Videos tab
export const ENABLE_MOCK_LONGFORM_VIDEOS = false;
// ======================================

// Placeholder thumbnail URLs (using Unsplash golf images)
const THUMBNAILS = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=450&fit=crop', // Golf course aerial
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=450&fit=crop', // Golf swing
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&h=450&fit=crop', // Golf ball
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=450&fit=crop', // Golf green
  'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800&h=450&fit=crop', // Golfer
  'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=800&h=450&fit=crop', // Golf course sunset
  'https://images.unsplash.com/photo-1580754641977-b34ee4ab0e26?w=800&h=450&fit=crop', // Golf club
  'https://images.unsplash.com/photo-1576014131795-8c5c5a578c35?w=800&h=450&fit=crop', // Golf fairway
];

// Mock creator profiles
const MOCK_CREATORS = [
  { id: 'mock-creator-1', name: 'Rick Shiels Golf', avatar: 'https://i.pravatar.cc/150?u=rick' },
  { id: 'mock-creator-2', name: 'Peter Finch Golf', avatar: 'https://i.pravatar.cc/150?u=peter' },
  { id: 'mock-creator-3', name: 'Good Good Golf', avatar: 'https://i.pravatar.cc/150?u=goodgood' },
  { id: 'mock-creator-4', name: 'Bryson DeChambeau', avatar: 'https://i.pravatar.cc/150?u=bryson' },
  { id: 'mock-creator-5', name: 'Erik Anders Lang', avatar: 'https://i.pravatar.cc/150?u=erik' },
  { id: 'mock-creator-6', name: 'Golf Sidekick', avatar: 'https://i.pravatar.cc/150?u=sidekick' },
  { id: 'mock-creator-7', name: 'Me and My Golf', avatar: 'https://i.pravatar.cc/150?u=meandmygolf' },
  { id: 'mock-creator-8', name: 'No Laying Up', avatar: 'https://i.pravatar.cc/150?u=nolayingup' },
];

// Golf courses for tagging (5-8 for "Courses & destinations" section)
const COURSE_TAGS = [
  { id: 'course-1', name: 'Pebble Beach Golf Links' },
  { id: 'course-2', name: 'St Andrews Old Course' },
  { id: 'course-3', name: 'Augusta National' },
  { id: 'course-4', name: 'Cypress Point Club' },
  { id: 'course-5', name: 'Royal Melbourne' },
  { id: 'course-6', name: 'Pinehurst No. 2' },
  { id: 'course-7', name: 'Whistling Straits' },
  { id: 'course-8', name: 'Torrey Pines South' },
];

// Video titles for variety
const VIDEO_TITLES = [
  'I Played the Most Beautiful Golf Course in the World',
  'Can I Break 80 with ONE Club?',
  'Golf Swing Basics - Complete Beginner Guide',
  'Pro vs Amateur: Course Management Challenge',
  'Every Shot Explained: Round at Pebble Beach',
  'The Secret to Hitting Driver 300+ Yards',
  'I Spent 24 Hours at a Golf Resort',
  'Breaking Down Tiger Woods\' Swing',
  'We Played Golf in Scotland - Bucket List Trip',
  'How to Fix Your Slice in 10 Minutes',
  'Course Vlog: Walking St Andrews Old Course',
  '18 Holes with a Tour Pro',
  'The Most Underrated Golf Courses in America',
  'Driver vs 3 Wood - Which is Better Off the Tee?',
  'Golf Fitness: 5 Exercises for More Power',
  'Links Golf Explained: How to Play in the Wind',
  'I Tried Every Club in My Bag for 1 Hole',
  'The Ultimate Putting Drill',
  'Playing Golf in Iceland - Midnight Sun Round',
  'Why Your Irons Are Going Right',
  'Best Budget Golf Gear 2024',
  'A Day in the Life of a Club Pro',
  'We Built a Golf Hole in My Backyard',
  'Augusta National: Everything You Need to Know',
  'The Shot That Changed Golf Forever',
];

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

// Generate a random number in range
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate 25 mock videos with varied data
export const generateMockLongFormVideos = (): LongFormVideo[] => {
  const videos: LongFormVideo[] = [];
  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const creator = MOCK_CREATORS[i % MOCK_CREATORS.length];
    const thumbnail = THUMBNAILS[i % THUMBNAILS.length];
    const title = VIDEO_TITLES[i];
    
    // Vary duration between 181-900 seconds (3-15 minutes)
    const durationSeconds = randomInRange(181, 900);
    
    // Vary views and likes for realistic sorting
    const views = randomInRange(500, 250000);
    const likes = randomInRange(50, 15000);
    
    // Random date within last 30 days
    const daysAgo = randomInRange(0, 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    // First 8 videos tagged with courses for "Courses & destinations" section
    const courseTag = i < 8 ? COURSE_TAGS[i] : undefined;
    
    // Mark some as trending (videos from last 7 days with high engagement)
    const isTrending = daysAgo < 7 && views > 50000;

    videos.push({
      id: `mock-video-${i + 1}`,
      title,
      creatorUserId: creator.id,
      creatorName: creator.name,
      creatorAvatarUrl: creator.avatar,
      thumbnailUrl: thumbnail,
      duration: formatDuration(durationSeconds),
      durationSeconds,
      views,
      likes,
      createdAt,
      golfCourseId: courseTag?.id,
      golfCourseName: courseTag?.name,
      isTrending,
    });
  }

  return videos;
};

// Pre-generated mock videos (stable for consistent rendering)
// Using seeded "random" values for reproducibility
export const MOCK_LONGFORM_VIDEOS: LongFormVideo[] = [
  {
    id: 'mock-video-1',
    title: 'I Played the Most Beautiful Golf Course in the World',
    creatorUserId: 'mock-creator-1',
    creatorName: 'Rick Shiels Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=rick',
    thumbnailUrl: THUMBNAILS[0],
    duration: '14:32',
    durationSeconds: 872,
    views: 185000,
    likes: 12500,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-1',
    golfCourseName: 'Pebble Beach Golf Links',
    isTrending: true,
  },
  {
    id: 'mock-video-2',
    title: 'Can I Break 80 with ONE Club?',
    creatorUserId: 'mock-creator-3',
    creatorName: 'Good Good Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=goodgood',
    thumbnailUrl: THUMBNAILS[1],
    duration: '18:45',
    durationSeconds: 1125,
    views: 245000,
    likes: 18000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
  {
    id: 'mock-video-3',
    title: 'Golf Swing Basics - Complete Beginner Guide',
    creatorUserId: 'mock-creator-7',
    creatorName: 'Me and My Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=meandmygolf',
    thumbnailUrl: THUMBNAILS[2],
    duration: '22:10',
    durationSeconds: 1330,
    views: 520000,
    likes: 35000,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-4',
    title: 'Pro vs Amateur: Course Management Challenge',
    creatorUserId: 'mock-creator-2',
    creatorName: 'Peter Finch Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=peter',
    thumbnailUrl: THUMBNAILS[3],
    duration: '25:30',
    durationSeconds: 1530,
    views: 89000,
    likes: 7200,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-2',
    golfCourseName: 'St Andrews Old Course',
    isTrending: true,
  },
  {
    id: 'mock-video-5',
    title: 'Every Shot Explained: Round at Pebble Beach',
    creatorUserId: 'mock-creator-5',
    creatorName: 'Erik Anders Lang',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=erik',
    thumbnailUrl: THUMBNAILS[4],
    duration: '45:20',
    durationSeconds: 2720,
    views: 156000,
    likes: 14000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-1',
    golfCourseName: 'Pebble Beach Golf Links',
    isTrending: true,
  },
  {
    id: 'mock-video-6',
    title: 'The Secret to Hitting Driver 300+ Yards',
    creatorUserId: 'mock-creator-4',
    creatorName: 'Bryson DeChambeau',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=bryson',
    thumbnailUrl: THUMBNAILS[5],
    duration: '12:15',
    durationSeconds: 735,
    views: 890000,
    likes: 65000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-7',
    title: 'I Spent 24 Hours at a Golf Resort',
    creatorUserId: 'mock-creator-6',
    creatorName: 'Golf Sidekick',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=sidekick',
    thumbnailUrl: THUMBNAILS[6],
    duration: '32:45',
    durationSeconds: 1965,
    views: 78000,
    likes: 5400,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-3',
    golfCourseName: 'Augusta National',
    isTrending: false,
  },
  {
    id: 'mock-video-8',
    title: 'Breaking Down Tiger Woods\' Swing',
    creatorUserId: 'mock-creator-1',
    creatorName: 'Rick Shiels Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=rick',
    thumbnailUrl: THUMBNAILS[7],
    duration: '16:50',
    durationSeconds: 1010,
    views: 1250000,
    likes: 92000,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-9',
    title: 'We Played Golf in Scotland - Bucket List Trip',
    creatorUserId: 'mock-creator-8',
    creatorName: 'No Laying Up',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=nolayingup',
    thumbnailUrl: THUMBNAILS[0],
    duration: '38:20',
    durationSeconds: 2300,
    views: 210000,
    likes: 18500,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-2',
    golfCourseName: 'St Andrews Old Course',
    isTrending: true,
  },
  {
    id: 'mock-video-10',
    title: 'How to Fix Your Slice in 10 Minutes',
    creatorUserId: 'mock-creator-2',
    creatorName: 'Peter Finch Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=peter',
    thumbnailUrl: THUMBNAILS[1],
    duration: '10:15',
    durationSeconds: 615,
    views: 445000,
    likes: 28000,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-11',
    title: 'Course Vlog: Walking St Andrews Old Course',
    creatorUserId: 'mock-creator-5',
    creatorName: 'Erik Anders Lang',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=erik',
    thumbnailUrl: THUMBNAILS[2],
    duration: '28:40',
    durationSeconds: 1720,
    views: 134000,
    likes: 11200,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-2',
    golfCourseName: 'St Andrews Old Course',
    isTrending: true,
  },
  {
    id: 'mock-video-12',
    title: '18 Holes with a Tour Pro',
    creatorUserId: 'mock-creator-3',
    creatorName: 'Good Good Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=goodgood',
    thumbnailUrl: THUMBNAILS[3],
    duration: '42:30',
    durationSeconds: 2550,
    views: 320000,
    likes: 24000,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-13',
    title: 'The Most Underrated Golf Courses in America',
    creatorUserId: 'mock-creator-6',
    creatorName: 'Golf Sidekick',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=sidekick',
    thumbnailUrl: THUMBNAILS[4],
    duration: '24:15',
    durationSeconds: 1455,
    views: 67000,
    likes: 4800,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-6',
    golfCourseName: 'Pinehurst No. 2',
    isTrending: false,
  },
  {
    id: 'mock-video-14',
    title: 'Driver vs 3 Wood - Which is Better Off the Tee?',
    creatorUserId: 'mock-creator-7',
    creatorName: 'Me and My Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=meandmygolf',
    thumbnailUrl: THUMBNAILS[5],
    duration: '15:40',
    durationSeconds: 940,
    views: 198000,
    likes: 13500,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-15',
    title: 'Golf Fitness: 5 Exercises for More Power',
    creatorUserId: 'mock-creator-4',
    creatorName: 'Bryson DeChambeau',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=bryson',
    thumbnailUrl: THUMBNAILS[6],
    duration: '11:25',
    durationSeconds: 685,
    views: 567000,
    likes: 42000,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-16',
    title: 'Links Golf Explained: How to Play in the Wind',
    creatorUserId: 'mock-creator-1',
    creatorName: 'Rick Shiels Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=rick',
    thumbnailUrl: THUMBNAILS[7],
    duration: '19:55',
    durationSeconds: 1195,
    views: 156000,
    likes: 11000,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-5',
    golfCourseName: 'Royal Melbourne',
    isTrending: false,
  },
  {
    id: 'mock-video-17',
    title: 'I Tried Every Club in My Bag for 1 Hole',
    creatorUserId: 'mock-creator-3',
    creatorName: 'Good Good Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=goodgood',
    thumbnailUrl: THUMBNAILS[0],
    duration: '21:30',
    durationSeconds: 1290,
    views: 289000,
    likes: 21000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
  {
    id: 'mock-video-18',
    title: 'The Ultimate Putting Drill',
    creatorUserId: 'mock-creator-2',
    creatorName: 'Peter Finch Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=peter',
    thumbnailUrl: THUMBNAILS[1],
    duration: '8:45',
    durationSeconds: 525,
    views: 234000,
    likes: 16500,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-19',
    title: 'Playing Golf in Iceland - Midnight Sun Round',
    creatorUserId: 'mock-creator-8',
    creatorName: 'No Laying Up',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=nolayingup',
    thumbnailUrl: THUMBNAILS[2],
    duration: '35:10',
    durationSeconds: 2110,
    views: 178000,
    likes: 15000,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-7',
    golfCourseName: 'Whistling Straits',
    isTrending: false,
  },
  {
    id: 'mock-video-20',
    title: 'Why Your Irons Are Going Right',
    creatorUserId: 'mock-creator-7',
    creatorName: 'Me and My Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=meandmygolf',
    thumbnailUrl: THUMBNAILS[3],
    duration: '13:20',
    durationSeconds: 800,
    views: 312000,
    likes: 22000,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
  {
    id: 'mock-video-21',
    title: 'Best Budget Golf Gear 2024',
    creatorUserId: 'mock-creator-1',
    creatorName: 'Rick Shiels Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=rick',
    thumbnailUrl: THUMBNAILS[4],
    duration: '26:40',
    durationSeconds: 1600,
    views: 423000,
    likes: 31000,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-22',
    title: 'A Day in the Life of a Club Pro',
    creatorUserId: 'mock-creator-5',
    creatorName: 'Erik Anders Lang',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=erik',
    thumbnailUrl: THUMBNAILS[5],
    duration: '29:15',
    durationSeconds: 1755,
    views: 89000,
    likes: 7800,
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-23',
    title: 'We Built a Golf Hole in My Backyard',
    creatorUserId: 'mock-creator-3',
    creatorName: 'Good Good Golf',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=goodgood',
    thumbnailUrl: THUMBNAILS[6],
    duration: '18:50',
    durationSeconds: 1130,
    views: 567000,
    likes: 48000,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 'mock-video-24',
    title: 'Augusta National: Everything You Need to Know',
    creatorUserId: 'mock-creator-6',
    creatorName: 'Golf Sidekick',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=sidekick',
    thumbnailUrl: THUMBNAILS[7],
    duration: '31:25',
    durationSeconds: 1885,
    views: 234000,
    likes: 19000,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    golfCourseId: 'course-3',
    golfCourseName: 'Augusta National',
    isTrending: false,
  },
  {
    id: 'mock-video-25',
    title: 'The Shot That Changed Golf Forever',
    creatorUserId: 'mock-creator-8',
    creatorName: 'No Laying Up',
    creatorAvatarUrl: 'https://i.pravatar.cc/150?u=nolayingup',
    thumbnailUrl: THUMBNAILS[0],
    duration: '14:10',
    durationSeconds: 850,
    views: 892000,
    likes: 67000,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
];

/**
 * Filter mock videos by section type
 */
export const getMockVideosBySection = (
  section: 'recommended' | 'trending' | 'following' | 'courses' | 'all'
): LongFormVideo[] => {
  if (!ENABLE_MOCK_LONGFORM_VIDEOS) return [];

  switch (section) {
    case 'trending':
      // Return videos marked as trending (within last 7 days, high engagement)
      return MOCK_LONGFORM_VIDEOS.filter(v => v.isTrending);
    
    case 'courses':
      // Return videos tagged with golf courses
      return MOCK_LONGFORM_VIDEOS.filter(v => v.golfCourseId);
    
    case 'following':
      // Return empty for following (these are mock creators, not followed)
      return [];
    
    case 'recommended':
    case 'all':
    default:
      // Return all mock videos sorted by engagement
      return [...MOCK_LONGFORM_VIDEOS].sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0) * 25;
        const scoreB = (b.views || 0) + (b.likes || 0) * 25;
        return scoreB - scoreA;
      });
  }
};
