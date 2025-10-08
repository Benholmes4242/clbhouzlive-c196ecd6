import { ChannelVideo } from '@/hooks/channels/useChannelsFeed';

const MOCK_CREATORS = [
  { id: 'c1', name: 'Golf with Aimee', avatar: '/images/mocks/avatars/avatar-01.png', verified: true },
  { id: 'c2', name: 'Rick Shiels Golf', avatar: '/images/mocks/avatars/avatar-02.png', verified: true },
  { id: 'c3', name: 'Peter Finch Golf', avatar: '/images/mocks/avatars/avatar-03.png', verified: true },
  { id: 'c4', name: 'Mark Crossfield', avatar: '/images/mocks/avatars/avatar-04.png', verified: false },
  { id: 'c5', name: 'Good Good Golf', avatar: '/images/mocks/avatars/avatar-05.png', verified: true },
  { id: 'c6', name: 'Me And My Golf', avatar: '/images/mocks/avatars/avatar-06.png', verified: true },
  { id: 'c7', name: 'Golfholics', avatar: '/images/mocks/avatars/avatar-07.png', verified: false },
  { id: 'c8', name: 'The Golf Mates', avatar: '/images/mocks/avatars/avatar-08.png', verified: false },
];

const THUMBNAIL_POOL = [
  '/images/mocks/thumbnails/golf-01.jpg',
  '/images/mocks/thumbnails/golf-02.jpg',
  '/images/mocks/thumbnails/golf-03.jpg',
  '/images/mocks/thumbnails/golf-04.jpg',
  '/images/mocks/thumbnails/golf-05.jpg',
  '/images/mocks/thumbnails/golf-06.jpg',
  '/images/mocks/thumbnails/golf-07.jpg',
  '/images/mocks/thumbnails/golf-08.jpg',
  '/images/mocks/thumbnails/golf-09.jpg',
  '/images/mocks/thumbnails/golf-10.jpg',
  '/images/mocks/thumbnails/golf-11.jpg',
  '/images/mocks/thumbnails/golf-12.jpg',
  '/images/mocks/thumbnails/golf-13.jpg',
  '/images/mocks/thumbnails/golf-14.jpg',
  '/images/mocks/thumbnails/golf-15.jpg',
];

const MOCK_VIDEOS = [
  {
    id: 'mock-1',
    content: 'Royal County Down – Front 9 w/ Caddie Tips',
    duration_seconds: 1080, // 18 min
    views_count: 480000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    thumbnail_url: THUMBNAIL_POOL[0],
    creator: MOCK_CREATORS[0],
    course: { id: 'course-1', name: 'Royal County Down' },
    categories: ['on-course', 'travel'],
    mock: true,
  },
  {
    id: 'mock-2',
    content: 'Fix Your Over-the-Top in 10 Minutes',
    duration_seconds: 600, // 10 min
    views_count: 276000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    thumbnail_url: THUMBNAIL_POOL[1],
    creator: MOCK_CREATORS[1],
    categories: ['golf-tips'],
    mock: true,
  },
  {
    id: 'mock-3',
    content: 'Blade vs. Mallet: Which Putts Better?',
    duration_seconds: 840, // 14 min
    views_count: 185000,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    thumbnail_url: THUMBNAIL_POOL[2],
    creator: MOCK_CREATORS[2],
    categories: ['equipment'],
    mock: true,
  },
  {
    id: 'mock-4',
    content: '3-Club Challenge at St Andrews Practice',
    duration_seconds: 720, // 12 min
    views_count: 342000,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    thumbnail_url: THUMBNAIL_POOL[3],
    creator: MOCK_CREATORS[4],
    course: { id: 'course-2', name: 'St Andrews Old Course' },
    categories: ['on-course'],
    mock: true,
  },
  {
    id: 'mock-5',
    content: 'Pro Q&A: Handling Wind on Links',
    duration_seconds: 900, // 15 min
    views_count: 128000,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    thumbnail_url: THUMBNAIL_POOL[4],
    creator: MOCK_CREATORS[5],
    categories: ['interviews', 'golf-tips'],
    mock: true,
  },
  {
    id: 'mock-6',
    content: 'How Rory Flights a 6-Iron (Slow-Mo)',
    duration_seconds: 480, // 8 min
    views_count: 420000,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
    thumbnail_url: THUMBNAIL_POOL[5],
    creator: MOCK_CREATORS[1],
    categories: ['golf-tips'],
    mock: true,
  },
  {
    id: 'mock-7',
    content: 'Hidden Gems: Links in the Dunes',
    duration_seconds: 1020, // 17 min
    views_count: 95000,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    thumbnail_url: THUMBNAIL_POOL[6],
    creator: MOCK_CREATORS[6],
    categories: ['on-course', 'travel'],
    mock: true,
  },
  {
    id: 'mock-8',
    content: 'Mobility for More Shoulder Turn',
    duration_seconds: 540, // 9 min
    views_count: 156000,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months ago
    thumbnail_url: THUMBNAIL_POOL[7],
    creator: MOCK_CREATORS[5],
    categories: ['golf-tips'],
    mock: true,
  },
  {
    id: 'mock-9',
    content: 'Course Management: Stop Short-Siding',
    duration_seconds: 660, // 11 min
    views_count: 203000,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    thumbnail_url: THUMBNAIL_POOL[8],
    creator: MOCK_CREATORS[3],
    categories: ['golf-tips'],
    mock: true,
  },
  {
    id: 'mock-10',
    content: 'Testing the New TaylorMade Driver',
    duration_seconds: 780, // 13 min
    views_count: 312000,
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 2.5 months ago
    thumbnail_url: THUMBNAIL_POOL[9],
    creator: MOCK_CREATORS[2],
    categories: ['equipment'],
    mock: true,
  },
  {
    id: 'mock-11',
    content: 'Playing Pebble Beach in the Wind',
    duration_seconds: 960, // 16 min
    views_count: 267000,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
    thumbnail_url: THUMBNAIL_POOL[10],
    creator: MOCK_CREATORS[4],
    course: { id: 'course-3', name: 'Pebble Beach Golf Links' },
    categories: ['on-course', 'travel'],
    mock: true,
  },
  {
    id: 'mock-12',
    content: 'Interview: Tour Pro Putting Secrets',
    duration_seconds: 840, // 14 min
    views_count: 189000,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months ago
    thumbnail_url: THUMBNAIL_POOL[11],
    creator: MOCK_CREATORS[0],
    categories: ['interviews', 'golf-tips'],
    mock: true,
  },
  {
    id: 'mock-13',
    content: 'Best Value Golf Balls 2024',
    duration_seconds: 720, // 12 min
    views_count: 145000,
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
    thumbnail_url: THUMBNAIL_POOL[12],
    creator: MOCK_CREATORS[3],
    categories: ['equipment'],
    mock: true,
  },
  {
    id: 'mock-14',
    content: 'Augusta National: Every Hole Strategy',
    duration_seconds: 1200, // 20 min
    views_count: 385000,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
    thumbnail_url: THUMBNAIL_POOL[13],
    creator: MOCK_CREATORS[7],
    course: { id: 'course-4', name: 'Augusta National Golf Club' },
    categories: ['on-course'],
    mock: true,
  },
  {
    id: 'mock-15',
    content: 'Breaking Down the Perfect Swing Plane',
    duration_seconds: 900, // 15 min
    views_count: 221000,
    created_at: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months ago
    thumbnail_url: THUMBNAIL_POOL[14],
    creator: MOCK_CREATORS[5],
    categories: ['golf-tips'],
    mock: true,
  },
];

export const isMockEnabled = (): boolean => {
  return import.meta.env.VITE_CHANNELS_USE_MOCKS === 'true' || import.meta.env.DEV;
};

export const getMockChannels = (
  page: number = 0, 
  pageSize: number = 15,
  subFilter?: string
): any[] => {
  // Return empty for pages beyond 1 to simulate end of infinite scroll
  if (page > 1) return [];

  let videos = [...MOCK_VIDEOS];

  // Apply subfilter
  if (subFilter && subFilter !== 'all') {
    if (subFilter === 'popular') {
      videos.sort((a, b) => b.views_count - a.views_count);
    } else if (subFilter === 'new') {
      videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Category filters
      videos = videos.filter(v => v.categories.includes(subFilter));
    }
  }

  // Map to ChannelVideo format - expose both top-level and primaryMedia fields
  return videos.map((video, index) => ({
    id: video.id,
    user_id: video.creator.id,
    content: video.content,
    created_at: video.created_at,
    views_count: video.views_count,
    // Top-level mock fields (for tolerant card rendering)
    thumbnail_url: video.thumbnail_url,
    poster_url: video.thumbnail_url,
    user_profiles: {
      id: video.creator.id,
      display_name: video.creator.name,
      username: video.creator.name.toLowerCase().replace(/\s+/g, ''),
      profile_photo_url: video.creator.avatar,
      is_verified: video.creator.verified,
    },
    post_media: [{
      id: `${video.id}-media`,
      media_type: 'video' as const,
      media_url: video.thumbnail_url,
      poster_url: video.thumbnail_url,
      thumbnail_url: video.thumbnail_url,
      duration_seconds: video.duration_seconds,
      stream_id: null,
      width: null,
      height: null,
    }],
    post_tags: video.course ? [{
      id: `${video.id}-tag`,
      tagged_entity_id: video.course.id,
      taggable_entities: {
        id: video.course.id,
        entity_type: 'golf_club' as const,
        entity_id: video.course.id,
        name: video.course.name,
      }
    }] : [],
    mock: video.mock,
    mockIndex: index,
  }));
};
