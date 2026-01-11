import { LongFormVideo } from './LongFormVideoTile';

// Cloudflare Stream test videos with real poster URLs
const MOCK_VIDEO_SOURCES = [
  {
    streamId: '5d5bc37ffcf54c9b82e996823bffbb81',
    poster: 'https://customer-wbomqb2gc2n1uslf.cloudflarestream.com/5d5bc37ffcf54c9b82e996823bffbb81/thumbnails/thumbnail.jpg',
  },
  {
    streamId: 'b236bde30eb07b9d01318940e5fc3eda',
    poster: 'https://customer-wbomqb2gc2n1uslf.cloudflarestream.com/b236bde30eb07b9d01318940e5fc3eda/thumbnails/thumbnail.jpg',
  },
  {
    streamId: '4e57a7a6e8f1c7c0f3df5e5c8c8e8e8e',
    poster: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&q=80',
  },
  {
    streamId: '3a47b7b7d9e2b8b1e4cf6f6d9d9f9f9f',
    poster: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  },
  {
    streamId: '2c38c8c8c0d3c9c2f5dg7g7e0e0g0g0g',
    poster: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  },
];

// Creator pool
const MOCK_CREATORS = [
  { name: 'Rick Shiels Golf', avatar: 'https://i.pravatar.cc/150?u=rickshiels' },
  { name: 'Peter Finch Golf', avatar: 'https://i.pravatar.cc/150?u=peterfinch' },
  { name: 'Golf Sidekick', avatar: 'https://i.pravatar.cc/150?u=golfsidekick' },
  { name: 'Micah Morris', avatar: 'https://i.pravatar.cc/150?u=micahmorris' },
  { name: 'EAL Golf', avatar: 'https://i.pravatar.cc/150?u=ealgolf' },
  { name: 'Club Champion', avatar: 'https://i.pravatar.cc/150?u=clubchampion' },
  { name: 'Me and My Golf', avatar: 'https://i.pravatar.cc/150?u=meandmygolf' },
  { name: 'Danny Maude', avatar: 'https://i.pravatar.cc/150?u=dannymaude' },
  { name: 'Chris Ryan Golf', avatar: 'https://i.pravatar.cc/150?u=chrisryangolf' },
  { name: 'Padraig Harrington', avatar: 'https://i.pravatar.cc/150?u=padraig' },
];

// Video titles
const VIDEO_TITLES = [
  'The BEST Driver Tip That Will Transform Your Game',
  'I Played 36 Holes at St Andrews - Every Shot',
  'This Simple Drill Fixed My Slice FOREVER',
  'Breaking 80 at Augusta National Simulator',
  'Full Course Vlog: Pebble Beach Links',
  'Why Your Irons Aren\'t Going Straight',
  'Complete Golf Fitness Routine for More Power',
  'How to Hit a Draw vs Fade - Full Tutorial',
  'Playing with a 5 Handicapper - Strategy Tips',
  'My Callaway Fitting Experience - Full Video',
  'Winter Golf Tips: Playing in the Cold',
  'Course Management That Will Lower Your Scores',
  'The Mental Game: How to Stay Focused',
  'Putting Masterclass: Read Any Green',
  'Bunker Play Made Simple - Full Guide',
  'I Bought the NEW TaylorMade Qi35 Driver',
  'Playing the Hardest Par 3 Course in the World',
  'Golf Trip to Scotland - Day 1',
  'How I Dropped 10 Strokes in 3 Months',
  'The Secret to Effortless Power in Your Swing',
  'Every Club in My Bag Explained',
  'Playing with Random Partners - What I Learned',
  'Course Vlog: Whistling Straits',
  'Short Game Secrets from a Tour Pro',
  'Why Your Wedges Are Letting You Down',
  'The Perfect Pre-Round Warmup Routine',
  'Analyzing My Swing with TrackMan',
  'Best Budget Golf Balls Tested',
  'How to Practice Like a Pro',
  'Full Round at Pinehurst No. 2',
];

// Golf courses
const GOLF_COURSES = [
  'St Andrews Old Course',
  'Pebble Beach Golf Links',
  'Augusta National',
  'Pinehurst No. 2',
  'Whistling Straits',
  'Royal Birkdale',
  'Carnoustie',
  'Bethpage Black',
  'TPC Sawgrass',
  'Torrey Pines',
];

/**
 * Generate 30 mock long-form videos with realistic data
 */
export const generateMockVideos = (count: number = 30): LongFormVideo[] => {
  const videos: LongFormVideo[] = [];
  
  for (let i = 0; i < count; i++) {
    const source = MOCK_VIDEO_SOURCES[i % MOCK_VIDEO_SOURCES.length];
    const creator = MOCK_CREATORS[i % MOCK_CREATORS.length];
    const title = VIDEO_TITLES[i % VIDEO_TITLES.length];
    const course = GOLF_COURSES[i % GOLF_COURSES.length];
    
    // Duration between 4-45 minutes
    const durationSeconds = 240 + Math.floor(Math.random() * 2460);
    const mins = Math.floor(durationSeconds / 60);
    const secs = Math.floor(durationSeconds % 60);
    const duration = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    // Random dates within last 30 days
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    videos.push({
      id: `mock-video-${i + 1}`,
      title: title,
      creatorUserId: `mock-creator-${i % 10}`,
      creatorName: creator.name,
      creatorAvatarUrl: creator.avatar,
      thumbnailUrl: source.poster,
      mediaUrl: `https://customer-wbomqb2gc2n1uslf.cloudflarestream.com/${source.streamId}/manifest/video.m3u8`,
      duration,
      durationSeconds,
      views: Math.floor(Math.random() * 500000) + 1000,
      likes: Math.floor(Math.random() * 25000) + 100,
      createdAt,
      golfCourseId: `course-${i % 10}`,
      golfCourseName: course,
      isTrending: i < 5, // First 5 are trending
    });
  }
  
  return videos;
};

// Pre-generated mock videos for consistent usage
export const MOCK_LONG_FORM_VIDEOS = generateMockVideos(30);

// Get mock videos for a specific section
export const getMockVideosForSection = (
  section: 'recommended' | 'trending' | 'following' | 'courses' | 'all',
  limit: number = 10
): LongFormVideo[] => {
  const shuffled = [...MOCK_LONG_FORM_VIDEOS].sort(() => Math.random() - 0.5);
  
  switch (section) {
    case 'trending':
      // Return videos marked as trending first
      return shuffled
        .sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0))
        .slice(0, limit)
        .map(v => ({ ...v, isTrending: true }));
    case 'courses':
      // All have course data in mock
      return shuffled.slice(0, limit);
    case 'following':
      // Simulate followed creators (first 5 creators)
      return shuffled
        .filter((_, idx) => idx % 2 === 0)
        .slice(0, limit);
    case 'recommended':
    case 'all':
    default:
      return shuffled.slice(0, limit);
  }
};

// Get infinite scroll pages of mock videos
export const getMockVideosPage = (
  section: 'recommended' | 'trending' | 'following' | 'courses',
  page: number,
  pageSize: number = 10
): { items: LongFormVideo[]; hasMore: boolean } => {
  const allVideos = getMockVideosForSection(section, 30);
  const start = page * pageSize;
  const end = start + pageSize;
  const items = allVideos.slice(start, end);
  
  return {
    items,
    hasMore: end < allVideos.length,
  };
};
