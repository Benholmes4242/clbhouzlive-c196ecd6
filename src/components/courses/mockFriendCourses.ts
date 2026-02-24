import { FriendsCoursesResult, FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';

// Mock friend course hits - RANKINGS ARE FROM REAL DATABASE, NOT MOCKED
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
    course_id: 'd917f7fb-ca74-4813-bc27-35ba95c04e03',
    course_name: 'Pine Valley Golf Club',
    course_country: 'USA',
    course_sub_country: 'New Jersey',
    played_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 10,
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751276611299-o0zgdrh03f.webp',
    top100_memberships: [], // Will be populated from real database
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
    course_id: 'e69aee30-744d-4089-a127-285a62216e2c',
    course_name: 'Cypress Point Club',
    course_country: 'USA',
    course_sub_country: 'California',
    played_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 9.5,
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751276189835-wrt1zm4sg.jpeg',
    top100_memberships: [], // Will be populated from real database
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
    course_id: '5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96',
    course_name: 'Kingsbarns Golf Links',
    course_country: 'Scotland',
    course_sub_country: 'Fife',
    played_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 9,
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751031782943-po0xpgjl1bj.jpg',
    top100_memberships: [], // Will be populated from real database
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
    course_id: '8df6dde5-49e2-4b1d-bbec-bd5f6e3c2b66',
    course_name: 'Royal County Down (Championship)',
    course_country: 'Northern Ireland',
    course_sub_country: 'Down',
    played_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 10,
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751019826333-fvps9vadl5.jpg',
    top100_memberships: [], // Will be populated from real database
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
    course_id: '47f1f73e-6265-4568-8b39-c7babfa22019',
    course_name: 'Royal Dornoch Golf Club (Championship)',
    course_country: 'Scotland',
    course_sub_country: 'Highlands',
    played_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 9.5,
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751024326684-enjmz2ztth8.jpg',
    top100_memberships: [], // Will be populated from real database
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
    course_id: 'a2426246-5314-42f7-8637-de23bd8d7665',
    course_name: 'Pebble Beach Golf Links',
    course_country: 'USA',
    course_sub_country: 'California',
    played_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 9,
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751281932418-mrfli213o3.jpg',
    top100_memberships: [], // Will be populated from real database
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
    course_id: '3674f9c2-3322-4580-bddb-c1123c92ec42',
    course_name: 'Ballybunion Golf Club (Old)',
    course_country: 'Ireland',
    course_sub_country: 'Kerry',
    played_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 9.5,
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751024716708-ovsjdt1owx9.jpg',
    top100_memberships: [], // Will be populated from real database
  },
];


// Aggregate courses with friends - RANKINGS ARE FROM REAL DATABASE
const mockCoursesWithFriends: CourseWithFriends[] = [
  {
    course_id: '8df6dde5-49e2-4b1d-bbec-bd5f6e3c2b66',
    course_name: 'Royal County Down (Championship)',
    country: 'Northern Ireland',
    sub_country: 'Down',
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751019826333-fvps9vadl5.jpg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === '8df6dde5-49e2-4b1d-bbec-bd5f6e3c2b66'),
    most_recent_play: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'd917f7fb-ca74-4813-bc27-35ba95c04e03',
    course_name: 'Pine Valley Golf Club',
    country: 'USA',
    sub_country: 'New Jersey',
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751276611299-o0zgdrh03f.webp',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === 'd917f7fb-ca74-4813-bc27-35ba95c04e03'),
    most_recent_play: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'a2426246-5314-42f7-8637-de23bd8d7665',
    course_name: 'Pebble Beach Golf Links',
    country: 'USA',
    sub_country: 'California',
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751281932418-mrfli213o3.jpg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === 'a2426246-5314-42f7-8637-de23bd8d7665'),
    most_recent_play: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: 'e69aee30-744d-4089-a127-285a62216e2c',
    course_name: 'Cypress Point Club',
    country: 'USA',
    sub_country: 'California',
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751276189835-wrt1zm4sg.jpeg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === 'e69aee30-744d-4089-a127-285a62216e2c'),
    most_recent_play: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: '47f1f73e-6265-4568-8b39-c7babfa22019',
    course_name: 'Royal Dornoch Golf Club (Championship)',
    country: 'Scotland',
    sub_country: 'Highlands',
    thumbnail_url: 'https://courses.clbhouz.co.uk/courses/1751024326684-enjmz2ztth8.jpg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === '47f1f73e-6265-4568-8b39-c7babfa22019'),
    most_recent_play: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: '5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96',
    course_name: 'Kingsbarns Golf Links',
    country: 'Scotland',
    sub_country: 'Fife',
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751031782943-po0xpgjl1bj.jpg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === '5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96'),
    most_recent_play: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
  {
    course_id: '3674f9c2-3322-4580-bddb-c1123c92ec42',
    course_name: 'Ballybunion Golf Club (Old)',
    country: 'Ireland',
    sub_country: 'Kerry',
    thumbnail_url: 'https://media.clbhouz.co.uk/courses/1751024716708-ovsjdt1owx9.jpg',
    community_rating: null, // Will be populated from real database
    top100_memberships: [], // Will be populated from real database
    friends: mockFriendHits.filter(hit => hit.course_id === '3674f9c2-3322-4580-bddb-c1123c92ec42'),
    most_recent_play: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    total_friends_played: 1,
  },
];

export const MOCK_FRIEND_COURSES: FriendsCoursesResult = {
  courses: mockCoursesWithFriends,
  recent: mockFriendHits,
  totalCourses: mockCoursesWithFriends.length,
  totalFriendsActive: 3, // Andrew, Sarah, James
  hasFriends: true,
};
