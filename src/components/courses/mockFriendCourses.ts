import { FriendsCoursesResult, FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';

// Mock friend course hits
const mockFriendHits: FriendCourseHit[] = [
  // Andrew Yetzis - Pine Valley
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_yetzis',
      display_name: 'Andrew Yetzis',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
    course_id: 'pine-valley',
    course_name: 'Pine Valley Golf Club',
    course_country: 'USA',
    course_sub_country: 'New Jersey',
    global_rank: 1,
    regional_rank: null,
    usa_rank: 1,
    played_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    rating: 10,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // Andrew Yetzis - Cypress Point
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_yetzis',
      display_name: 'Andrew Yetzis',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
    course_id: 'cypress-point',
    course_name: 'Cypress Point Club',
    course_country: 'USA',
    course_sub_country: 'California',
    global_rank: 2,
    regional_rank: null,
    usa_rank: 2,
    played_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    rating: 9.5,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // Andrew Yetzis - Kingsbarns
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_yetzis',
      display_name: 'Andrew Yetzis',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
    course_id: 'kingsbarns',
    course_name: 'Kingsbarns Golf Links',
    course_country: 'Scotland',
    course_sub_country: 'Fife',
    global_rank: 42,
    regional_rank: 15,
    usa_rank: null,
    played_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    rating: 9,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // Sarah Miles - Royal County Down
  {
    friend_id: 'mock-sarah',
    friend_profile: {
      id: 'mock-sarah',
      username: 'sarah_miles',
      display_name: 'Sarah Miles',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    course_id: 'royal-county-down',
    course_name: 'Royal County Down (Championship)',
    course_country: 'Northern Ireland',
    course_sub_country: 'Down',
    global_rank: 3,
    regional_rank: 1,
    usa_rank: null,
    played_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    rating: 10,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // Sarah Miles - Royal Dornoch
  {
    friend_id: 'mock-sarah',
    friend_profile: {
      id: 'mock-sarah',
      username: 'sarah_miles',
      display_name: 'Sarah Miles',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    course_id: 'royal-dornoch',
    course_name: 'Royal Dornoch',
    course_country: 'Scotland',
    course_sub_country: 'Highlands',
    global_rank: 5,
    regional_rank: 2,
    usa_rank: null,
    played_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    rating: 9.5,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // James Porter - Pebble Beach
  {
    friend_id: 'mock-james',
    friend_profile: {
      id: 'mock-james',
      username: 'james_porter',
      display_name: 'James Porter',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    course_id: 'pebble-beach',
    course_name: 'Pebble Beach Golf Links',
    course_country: 'USA',
    course_sub_country: 'California',
    global_rank: 7,
    regional_rank: null,
    usa_rank: 5,
    played_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    rating: 9,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
  // James Porter - Ballybunion
  {
    friend_id: 'mock-james',
    friend_profile: {
      id: 'mock-james',
      username: 'james_porter',
      display_name: 'James Porter',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    course_id: 'ballybunion',
    course_name: 'Ballybunion (Old)',
    course_country: 'Ireland',
    course_sub_country: 'Kerry',
    global_rank: 15,
    regional_rank: 5,
    usa_rank: null,
    played_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    rating: 9.5,
    thumbnail_url: null, // Use real course thumbnail from database
    is_top100: true,
  },
];

// Aggregate courses with friends
const mockCoursesWithFriends: CourseWithFriends[] = [
  {
    course_id: 'royal-county-down',
    course_name: 'Royal County Down (Championship)',
    country: 'Northern Ireland',
    sub_country: 'Down',
    global_rank: 3,
    regional_rank: 1,
    usa_rank: null,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.8,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'royal-county-down'),
    most_recent_play: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'pine-valley',
    course_name: 'Pine Valley Golf Club',
    country: 'USA',
    sub_country: 'New Jersey',
    global_rank: 1,
    regional_rank: null,
    usa_rank: 1,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.9,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'pine-valley'),
    most_recent_play: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'pebble-beach',
    course_name: 'Pebble Beach Golf Links',
    country: 'USA',
    sub_country: 'California',
    global_rank: 7,
    regional_rank: null,
    usa_rank: 5,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.3,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'pebble-beach'),
    most_recent_play: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'cypress-point',
    course_name: 'Cypress Point Club',
    country: 'USA',
    sub_country: 'California',
    global_rank: 2,
    regional_rank: null,
    usa_rank: 2,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.7,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'cypress-point'),
    most_recent_play: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'royal-dornoch',
    course_name: 'Royal Dornoch',
    country: 'Scotland',
    sub_country: 'Highlands',
    global_rank: 5,
    regional_rank: 2,
    usa_rank: null,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.5,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'royal-dornoch'),
    most_recent_play: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'kingsbarns',
    course_name: 'Kingsbarns Golf Links',
    country: 'Scotland',
    sub_country: 'Fife',
    global_rank: 42,
    regional_rank: 15,
    usa_rank: null,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.1,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'kingsbarns'),
    most_recent_play: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'ballybunion',
    course_name: 'Ballybunion (Old)',
    country: 'Ireland',
    sub_country: 'Kerry',
    global_rank: 15,
    regional_rank: 5,
    usa_rank: null,
    thumbnail_url: null, // Use real course thumbnail from database
    average_rating: 9.4,
    is_top100: true,
    friends: mockFriendHits.filter(hit => hit.course_id === 'ballybunion'),
    most_recent_play: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
];

export const MOCK_FRIEND_COURSES: FriendsCoursesResult = {
  courses: mockCoursesWithFriends,
  recent: mockFriendHits,
  totalCourses: mockCoursesWithFriends.length,
  totalFriendsActive: 3, // Andrew, Sarah, James
};
