import { FriendsCoursesResult, FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';

// Mock friend course hits
const mockFriendHits: FriendCourseHit[] = [
  // Andrew Y. - Pine Valley
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_y',
      display_name: 'Andrew Y.',
      profile_photo_url: null,
    },
    course_id: 'pine-valley',
    course_name: 'Pine Valley Golf Club',
    course_country: 'USA',
    course_sub_country: 'New Jersey',
    global_rank: 1,
    played_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    rating: 10,
  },
  // Andrew Y. - Cypress Point
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_y',
      display_name: 'Andrew Y.',
      profile_photo_url: null,
    },
    course_id: 'cypress-point',
    course_name: 'Cypress Point Club',
    course_country: 'USA',
    course_sub_country: 'California',
    global_rank: 2,
    played_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    rating: 9.5,
  },
  // Andrew Y. - Kingsbarns
  {
    friend_id: 'mock-andrew',
    friend_profile: {
      id: 'mock-andrew',
      username: 'andrew_y',
      display_name: 'Andrew Y.',
      profile_photo_url: null,
    },
    course_id: 'kingsbarns',
    course_name: 'Kingsbarns Golf Links',
    course_country: 'Scotland',
    course_sub_country: 'Fife',
    global_rank: 42,
    played_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    rating: 9,
  },
  // Sarah M. - Royal County Down
  {
    friend_id: 'mock-sarah',
    friend_profile: {
      id: 'mock-sarah',
      username: 'sarah_m',
      display_name: 'Sarah M.',
      profile_photo_url: null,
    },
    course_id: 'royal-county-down',
    course_name: 'Royal County Down (Championship)',
    course_country: 'Northern Ireland',
    course_sub_country: 'Down',
    global_rank: 3,
    played_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    rating: 10,
  },
  // Sarah M. - Royal Dornoch
  {
    friend_id: 'mock-sarah',
    friend_profile: {
      id: 'mock-sarah',
      username: 'sarah_m',
      display_name: 'Sarah M.',
      profile_photo_url: null,
    },
    course_id: 'royal-dornoch',
    course_name: 'Royal Dornoch',
    course_country: 'Scotland',
    course_sub_country: 'Highlands',
    global_rank: 5,
    played_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    rating: 9.5,
  },
  // James P. - Pebble Beach
  {
    friend_id: 'mock-james',
    friend_profile: {
      id: 'mock-james',
      username: 'james_p',
      display_name: 'James P.',
      profile_photo_url: null,
    },
    course_id: 'pebble-beach',
    course_name: 'Pebble Beach Golf Links',
    course_country: 'USA',
    course_sub_country: 'California',
    global_rank: 7,
    played_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    rating: 9,
  },
  // James P. - Ballybunion
  {
    friend_id: 'mock-james',
    friend_profile: {
      id: 'mock-james',
      username: 'james_p',
      display_name: 'James P.',
      profile_photo_url: null,
    },
    course_id: 'ballybunion',
    course_name: 'Ballybunion (Old)',
    course_country: 'Ireland',
    course_sub_country: 'Kerry',
    global_rank: 15,
    played_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    rating: 9.5,
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
