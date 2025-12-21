/**
 * Mock data for Videos tab stress testing
 * 
 * Contains 25 mock videos (3+ minutes each) with mock users
 * Only enabled when DISCOVER_VIDEOS_MOCK_DATA feature flag is true
 * 
 * Videos are real HLS streams from public test sources for autoplay testing
 */

import { LongFormVideo } from './LongFormVideoTile';

// Mock user data - realistic but fictional
export interface MockUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}

// Generate 25 unique mock users
export const MOCK_USERS: MockUser[] = [
  { id: 'mock-user-001', displayName: 'James Thompson', username: 'james_t_golf', avatarUrl: 'https://i.pravatar.cc/150?u=james_t_golf' },
  { id: 'mock-user-002', displayName: 'Sarah Mitchell', username: 'sarah_swings', avatarUrl: 'https://i.pravatar.cc/150?u=sarah_swings' },
  { id: 'mock-user-003', displayName: 'Michael Chen', username: 'mike_on_the_green', avatarUrl: 'https://i.pravatar.cc/150?u=mike_green' },
  { id: 'mock-user-004', displayName: 'Emma Rodriguez', username: 'emma_r_golf', avatarUrl: 'https://i.pravatar.cc/150?u=emma_r_golf' },
  { id: 'mock-user-005', displayName: 'David Williams', username: 'dwill_golf', avatarUrl: 'https://i.pravatar.cc/150?u=dwill_golf' },
  { id: 'mock-user-006', displayName: 'Olivia Johnson', username: 'olivia_drives', avatarUrl: 'https://i.pravatar.cc/150?u=olivia_drives' },
  { id: 'mock-user-007', displayName: 'Robert Taylor', username: 'rob_taylor_golf', avatarUrl: 'https://i.pravatar.cc/150?u=rob_taylor' },
  { id: 'mock-user-008', displayName: 'Sophie Brown', username: 'sophie_b_golf', avatarUrl: 'https://i.pravatar.cc/150?u=sophie_b' },
  { id: 'mock-user-009', displayName: 'Alexander Lee', username: 'alex_fairway', avatarUrl: 'https://i.pravatar.cc/150?u=alex_fairway' },
  { id: 'mock-user-010', displayName: 'Isabella Martinez', username: 'bella_golf', avatarUrl: 'https://i.pravatar.cc/150?u=bella_golf' },
  { id: 'mock-user-011', displayName: 'William Davis', username: 'will_d_swings', avatarUrl: 'https://i.pravatar.cc/150?u=will_d' },
  { id: 'mock-user-012', displayName: 'Charlotte Wilson', username: 'charlie_golf', avatarUrl: 'https://i.pravatar.cc/150?u=charlie_golf' },
  { id: 'mock-user-013', displayName: 'Benjamin Moore', username: 'ben_moore_golf', avatarUrl: 'https://i.pravatar.cc/150?u=ben_moore' },
  { id: 'mock-user-014', displayName: 'Amelia Anderson', username: 'amelia_a_golf', avatarUrl: 'https://i.pravatar.cc/150?u=amelia_a' },
  { id: 'mock-user-015', displayName: 'Henry Thomas', username: 'henry_t_golf', avatarUrl: 'https://i.pravatar.cc/150?u=henry_t' },
  { id: 'mock-user-016', displayName: 'Mia Jackson', username: 'mia_drives', avatarUrl: 'https://i.pravatar.cc/150?u=mia_drives' },
  { id: 'mock-user-017', displayName: 'Lucas White', username: 'lucas_fairway', avatarUrl: 'https://i.pravatar.cc/150?u=lucas_fw' },
  { id: 'mock-user-018', displayName: 'Harper Harris', username: 'harper_golf', avatarUrl: 'https://i.pravatar.cc/150?u=harper_golf' },
  { id: 'mock-user-019', displayName: 'Ethan Clark', username: 'ethan_c_golf', avatarUrl: 'https://i.pravatar.cc/150?u=ethan_c' },
  { id: 'mock-user-020', displayName: 'Ava Lewis', username: 'ava_swings', avatarUrl: 'https://i.pravatar.cc/150?u=ava_swings' },
  { id: 'mock-user-021', displayName: 'Mason Walker', username: 'mason_w_golf', avatarUrl: 'https://i.pravatar.cc/150?u=mason_w' },
  { id: 'mock-user-022', displayName: 'Evelyn Young', username: 'evelyn_golf', avatarUrl: 'https://i.pravatar.cc/150?u=evelyn_golf' },
  { id: 'mock-user-023', displayName: 'Logan King', username: 'logan_k_golf', avatarUrl: 'https://i.pravatar.cc/150?u=logan_k' },
  { id: 'mock-user-024', displayName: 'Abigail Scott', username: 'abigail_drives', avatarUrl: 'https://i.pravatar.cc/150?u=abigail_d' },
  { id: 'mock-user-025', displayName: 'Jacob Green', username: 'jacob_g_golf', avatarUrl: 'https://i.pravatar.cc/150?u=jacob_g' },
];

// Public HLS test streams - all are 3+ minutes
// Using a mix of reliable public test streams
const HLS_TEST_STREAMS = [
  // Big Buck Bunny - 10+ minutes
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  // Sintel trailer - ~4 minutes
  'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  // Tears of Steel - ~12 minutes
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  // Apple test stream - long duration
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
  // Akamai test stream
  'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
];

// Poster images - using picsum for variety
const generatePoster = (seed: number) => 
  `https://picsum.photos/seed/mockv${seed}/640/360`;

// Video titles - varied content
const VIDEO_TITLES = [
  'Complete guide to the perfect golf swing - From setup to follow through',
  'My first time playing Pebble Beach - Full round vlog and course review',
  'How I dropped 10 strokes in 3 months - Training diary and tips',
  'Augusta National bucket list trip - Every hole walkthrough',
  'Driver distance secrets the pros use - Physics of the golf swing explained',
  'Putting masterclass with tour coach - Read greens like a pro',
  'Scotland links golf adventure - St Andrews, Carnoustie, and more',
  'Building the perfect practice routine - 30 minutes to lower scores',
  'Chip shot techniques for every lie - Sand, rough, and tight lies',
  'Course management that saves strokes - Think your way to better golf',
  'Winter golf survival guide - How to play in cold weather',
  'Titleist vs Callaway driver test - Which performs better for you?',
  'My caddie experience at Royal Troon - Behind the scenes',
  'Fixing the dreaded slice forever - Drills that actually work',
  'Golf fitness routine for more power - No gym required',
  'Reading wind conditions on the course - Advanced weather play',
  'The mental game of golf - Sports psychology for amateurs',
  'Japan golf trip highlights - Top 5 courses you must play',
  'Club fitting changed my game - What to expect and why it matters',
  'Bunker play made simple - Get out every time guaranteed',
  'Playing in a club championship - Competition vlog and tips',
  'Golf technology review 2024 - Best gadgets and apps tested',
  'Improving ball striking consistency - The key fundamentals',
  'Desert golf in Arizona - Scottsdale course reviews',
  'From beginner to scratch - My 5 year golf journey',
];

// Generate dates within the last 30 days
const generateCreatedAt = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Generate view counts (realistic distribution)
const generateViews = (index: number) => {
  const base = Math.floor(Math.random() * 5000) + 500;
  // First few videos get more views (trending simulation)
  return index < 5 ? base * 3 : base;
};

// Generate duration between 3-15 minutes
const generateDuration = () => {
  const minutes = Math.floor(Math.random() * 12) + 3; // 3-15 minutes
  const seconds = Math.floor(Math.random() * 60);
  return {
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    seconds: minutes * 60 + seconds,
  };
};

/**
 * Generate 25 mock videos for stress testing
 */
export const generateMockVideos = (): LongFormVideo[] => {
  return Array.from({ length: 25 }, (_, index) => {
    const user = MOCK_USERS[index];
    const duration = generateDuration();
    const streamIndex = index % HLS_TEST_STREAMS.length;
    
    return {
      id: `mock-video-${String(index + 1).padStart(3, '0')}`,
      title: VIDEO_TITLES[index],
      creatorUserId: user.id,
      creatorName: user.displayName,
      creatorAvatarUrl: user.avatarUrl,
      thumbnailUrl: generatePoster(index + 1),
      mediaUrl: HLS_TEST_STREAMS[streamIndex],
      duration: duration.formatted,
      durationSeconds: duration.seconds,
      views: generateViews(index),
      createdAt: generateCreatedAt(Math.floor(Math.random() * 30)),
      isTrending: index < 3, // First 3 are trending
      likes: Math.floor(Math.random() * 500) + 50,
    };
  });
};

// Pre-generated mock videos for consistent testing
export const MOCK_VIDEOS = generateMockVideos();

/**
 * Get mock videos by section
 * Simulates the section-based fetching of real data
 */
export const getMockVideosBySection = (
  section: 'recommended' | 'trending' | 'following' | 'courses' | 'all',
  limit: number = 10
): LongFormVideo[] => {
  switch (section) {
    case 'recommended':
      // Videos 0-9
      return MOCK_VIDEOS.slice(0, Math.min(limit, 10));
    case 'trending':
      // Videos 10-14 (marked as trending)
      return MOCK_VIDEOS.slice(10, 10 + Math.min(limit, 5)).map(v => ({ ...v, isTrending: true }));
    case 'following':
      // Videos 15-19
      return MOCK_VIDEOS.slice(15, 15 + Math.min(limit, 5));
    case 'courses':
      // Videos 20-24 (with golf course names)
      return MOCK_VIDEOS.slice(20, 20 + Math.min(limit, 5)).map(v => ({
        ...v,
        golfCourseName: ['Pebble Beach', 'St Andrews', 'Augusta National', 'Royal Troon', 'Pinehurst'][
          Math.floor(Math.random() * 5)
        ],
      }));
    case 'all':
    default:
      return MOCK_VIDEOS.slice(0, limit);
  }
};
