/**
 * Mock long-form videos for UI testing
 * Generates 25 realistic mock videos per section
 */

import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

const MOCK_CREATORS = [
  { id: 'mock-1', name: 'Rick Shiels', username: 'rickshiels', avatar: 'https://i.pravatar.cc/150?u=rickshiels' },
  { id: 'mock-2', name: 'Peter Finch', username: 'peterfinch', avatar: 'https://i.pravatar.cc/150?u=peterfinch' },
  { id: 'mock-3', name: 'Good Good', username: 'goodgood', avatar: 'https://i.pravatar.cc/150?u=goodgood' },
  { id: 'mock-4', name: 'Bryson DeChambeau', username: 'brysondechambeau', avatar: 'https://i.pravatar.cc/150?u=bryson' },
  { id: 'mock-5', name: 'Paige Spiranac', username: 'paige', avatar: 'https://i.pravatar.cc/150?u=paige' },
  { id: 'mock-6', name: 'Bob Does Sports', username: 'bobdoes', avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: 'mock-7', name: 'Erik Anders Lang', username: 'erikanders', avatar: 'https://i.pravatar.cc/150?u=erik' },
  { id: 'mock-8', name: 'No Laying Up', username: 'nolayingup', avatar: 'https://i.pravatar.cc/150?u=nlu' },
];

const MOCK_COURSES = [
  { id: 'course-1', name: 'St Andrews Old Course' },
  { id: 'course-2', name: 'Augusta National' },
  { id: 'course-3', name: 'Pebble Beach' },
  { id: 'course-4', name: 'Sawgrass TPC' },
  { id: 'course-5', name: 'Royal Melbourne' },
  { id: 'course-6', name: 'Pinehurst No. 2' },
  { id: 'course-7', name: 'Bethpage Black' },
  { id: 'course-8', name: 'Torrey Pines South' },
];

const RECOMMENDED_TITLES = [
  'How I Finally Broke 80 (Complete Strategy)',
  'Driver Swing Speed Secrets Revealed',
  'My Best Golf Tips After 20 Years',
  'Fixing Your Slice Forever - Full Guide',
  'Course Management That Actually Works',
  'The Perfect Pre-Shot Routine',
  'Short Game Masterclass - Full Lesson',
  'How To Read Greens Like a Pro',
  'Building a Repeatable Golf Swing',
  'My Favorite Drill for Consistency',
  'The Mental Game Nobody Talks About',
  'Fairway Wood vs Hybrid - Complete Guide',
  'Bunker Play Made Simple',
  'Chipping Technique Breakdown',
  'How To Practice Effectively',
  'Club Fitting Changed My Game',
  'Best Putting Drills for Lower Scores',
  'Wind Play Strategies Explained',
  'Uphill vs Downhill Lies Tutorial',
  'My Complete Warm-Up Routine',
  'Golf Fitness for More Distance',
  'Understanding Ball Flight Laws',
  'Trouble Shots Every Golfer Needs',
  'Lag in the Golf Swing Explained',
  'Why Your Irons Are Inconsistent',
];

const TRENDING_TITLES = [
  '🔥 This Shot Went VIRAL | Full Round',
  'Breaking 70 for the First Time EVER',
  'I Played Against a Tour Pro...',
  'The Luckiest Golf Shot of My Life',
  'We Played the HARDEST Course in UK',
  'Hitting Driver 350 Yards (How I Did It)',
  'The Match That Changed Everything',
  'Playing Golf With 1 Club Challenge',
  'My Hole-in-One on Camera!',
  'When Golf Goes Wrong Compilation',
  'Pro Caddie Secrets Revealed',
  'I Tried Left-Handed Golf For a Week',
  '$10 vs $500 Driver Test',
  'Playing St Andrews at 6AM',
  'The Most Expensive Round of Golf',
  'Celebrity Golf Match Highlights',
  'Night Golf Experience Full Video',
  'Playing With Random Subscribers',
  'Golf Course Speed Run Challenge',
  'Every Shot of My Best Round Ever',
  'I Let My Caddie Make Every Decision',
  'Playing the Scariest Hole in Golf',
  'Winter Golf Survival Guide',
  'Augusta National Flyover Tour',
  'Pro Golfer Tries My Course',
];

const FOLLOWING_TITLES = [
  'Sunday Vlog: Working on My Game',
  'Practice Session + Q&A',
  'Behind the Scenes at the Shoot',
  'Answering Your Golf Questions',
  'My New Club Setup Explained',
  'Morning Routine Before a Round',
  'Honest Equipment Reviews',
  'What I Learned This Week',
  'Playing With a Subscriber',
  'Travel Day to Scotland',
  'New Video Setup Tour',
  'Golf Trip Planning Tips',
  'Responding to Your Comments',
  'My Favorite Local Course',
  'Weekly Swing Update',
  'Testing New Equipment',
  'Playing Solo Round Thoughts',
  'Fitness Routine for Golf',
  'What is in My Bag 2025',
  'End of Year Recap',
  'New Year Golf Goals',
  'Podcast Recording Session',
  'Tournament Prep Day',
  'Range Session Breakdown',
  'Life Update + Golf Chat',
];

const COURSES_TITLES = [
  'St Andrews Old Course - Every Shot',
  'Playing Pebble Beach in the Rain',
  'My Augusta National Experience',
  'Scotland Links Golf Trip',
  'Royal Melbourne Championship Course',
  'Sawgrass TPC Island Green Hole',
  'Pinehurst No. 2 Course Vlog',
  'Bethpage Black - Is It Worth It?',
  'Torrey Pines US Open Course',
  'Carnoustie Full Round Review',
  'Whistling Straits Experience',
  'Bandon Dunes Dream Trip',
  'Royal County Down Vlog',
  'Kiawah Island Ocean Course',
  'Kapalua Plantation Course',
  'Shadow Creek Las Vegas',
  'Harbour Town Golf Links',
  'Shinnecock Hills Member Guest',
  'Pacific Dunes First Impressions',
  'Old Head Ireland Cliff Golf',
  'Royal Birkdale Open Venue',
  'Muirfield Scotland Experience',
  'Turnberry Ailsa Course',
  'Royal Portrush Northern Ireland',
  'Chambers Bay US Open Venue',
];

const MOCK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1535132011086-b8818f016104?w=640&h=360&fit=crop',
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&h=360&fit=crop',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateMockVideo(
  id: string, 
  title: string, 
  section: string,
  index: number
): LongFormVideo {
  const creator = randomItem(MOCK_CREATORS);
  const course = section === 'courses' ? MOCK_COURSES[index % MOCK_COURSES.length] : randomItem(MOCK_COURSES);
  const durationSeconds = 240 + Math.floor(Math.random() * 3600); // 4-64 minutes
  const views = Math.floor(Math.random() * 500000);
  const daysAgo = Math.floor(Math.random() * 30);
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `mock-video-${section}-${id}`,
    title,
    creatorUserId: creator.id,
    creatorName: creator.name,
    creatorAvatarUrl: creator.avatar,
    thumbnailUrl: MOCK_THUMBNAILS[index % MOCK_THUMBNAILS.length],
    duration: formatDuration(durationSeconds),
    durationSeconds,
    views,
    createdAt,
    golfCourseId: section === 'courses' ? course.id : undefined,
    golfCourseName: section === 'courses' ? course.name : undefined,
    isTrending: section === 'trending',
  };
}

export function generateMockVideosForSection(section: string, count: number = 25): LongFormVideo[] {
  let titles: string[];
  
  switch (section) {
    case 'recommended':
      titles = RECOMMENDED_TITLES;
      break;
    case 'trending':
      titles = TRENDING_TITLES;
      break;
    case 'following':
      titles = FOLLOWING_TITLES;
      break;
    case 'courses':
      titles = COURSES_TITLES;
      break;
    default:
      titles = RECOMMENDED_TITLES;
  }

  return Array.from({ length: count }, (_, i) => 
    generateMockVideo(
      `${i + 1}`,
      titles[i % titles.length],
      section,
      i
    )
  );
}

// Pre-generated mock videos for each section
export const MOCK_RECOMMENDED_VIDEOS = generateMockVideosForSection('recommended', 25);
export const MOCK_TRENDING_VIDEOS = generateMockVideosForSection('trending', 25);
export const MOCK_FOLLOWING_VIDEOS = generateMockVideosForSection('following', 25);
export const MOCK_COURSES_VIDEOS = generateMockVideosForSection('courses', 25);
