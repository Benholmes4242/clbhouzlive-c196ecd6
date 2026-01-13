/**
 * TEMP: Mock Friends Courses data for UI "busy state" testing
 * ============================================================
 * This file provides 35+ mock entries to stress-test the Friends' Courses tab UI.
 * 
 * To enable: Set FLAGS.FRIEND_COURSES_MOCK_ENABLED = true in src/config/flags.ts
 * To disable: Set FLAGS.FRIEND_COURSES_MOCK_ENABLED = false
 * 
 * Safe to delete entirely once UI stress testing is complete.
 */

import type { FriendsCoursesResult, FriendCourseHit, CourseWithFriends, Top100Membership } from '@/hooks/useFriendsCourses';

// ============================================================================
// MOCK FRIEND PROFILES - 12 unique friends with varied avatars
// ============================================================================
const MOCK_FRIENDS = [
  { id: 'mock-andrew', username: 'andrew_yetzis', display_name: 'Andrew Yetzis', profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  { id: 'mock-sarah', username: 'sarah_miles', display_name: 'Sarah Miles', profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
  { id: 'mock-james', username: 'james_porter', display_name: 'James Porter', profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
  { id: 'mock-emma', username: 'emma_chen', display_name: 'Emma Chen', profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
  { id: 'mock-michael', username: 'mike_golf', display_name: 'Michael Thompson', profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
  { id: 'mock-olivia', username: 'olivia_links', display_name: 'Olivia Martinez', profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop' },
  { id: 'mock-david', username: 'david_fairway', display_name: 'David Kim', profile_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' },
  { id: 'mock-sophie', username: 'sophie_golfer', display_name: 'Sophie Williams', profile_photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop' },
  { id: 'mock-alex', username: 'alex_birdie', display_name: 'Alex Johnson', profile_photo_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop' },
  { id: 'mock-rachel', username: 'rachel_putter', display_name: 'Rachel Green', profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
  { id: 'mock-tom', username: 'tom_eagle', display_name: 'Tom Anderson', profile_photo_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop' },
  { id: 'mock-lisa', username: 'lisa_bogey', display_name: 'Lisa Park', profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop' },
];

// ============================================================================
// MOCK COURSES - 25 unique courses with realistic data
// ============================================================================
const MOCK_COURSES = [
  { id: 'd917f7fb-ca74-4813-bc27-35ba95c04e03', name: 'Pine Valley Golf Club', country: 'USA', sub_country: 'New Jersey', thumbnail: 'https://courses.clbhouz.co.uk/courses/1751276611299-o0zgdrh03f.webp', rating: 9.8, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 1 }] },
  { id: 'e69aee30-744d-4089-a127-285a62216e2c', name: 'Cypress Point Club', country: 'USA', sub_country: 'California', thumbnail: 'https://courses.clbhouz.co.uk/courses/1751276189835-wrt1zm4sg.jpeg', rating: 9.7, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 2 }] },
  { id: '8df6dde5-49e2-4b1d-bbec-bd5f6e3c2b66', name: 'Royal County Down (Championship)', country: 'Northern Ireland', sub_country: 'Down', thumbnail: 'https://media.clbhouz.co.uk/courses/1751019826333-fvps9vadl5.jpg', rating: 9.6, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 3 }] },
  { id: 'a2426246-5314-42f7-8637-de23bd8d7665', name: 'Pebble Beach Golf Links', country: 'USA', sub_country: 'California', thumbnail: 'https://courses.clbhouz.co.uk/courses/1751281932418-mrfli213o3.jpg', rating: 9.5, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 6 }] },
  { id: '47f1f73e-6265-4568-8b39-c7babfa22019', name: 'Royal Dornoch Golf Club (Championship)', country: 'Scotland', sub_country: 'Highlands', thumbnail: 'https://courses.clbhouz.co.uk/courses/1751024326684-enjmz2ztth8.jpg', rating: 9.4, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 7 }] },
  { id: '5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96', name: 'Kingsbarns Golf Links', country: 'Scotland', sub_country: 'Fife', thumbnail: 'https://media.clbhouz.co.uk/courses/1751031782943-po0xpgjl1bj.jpg', rating: 9.3, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 15 }] },
  { id: '3674f9c2-3322-4580-bddb-c1123c92ec42', name: 'Ballybunion Golf Club (Old)', country: 'Ireland', sub_country: 'Kerry', thumbnail: 'https://media.clbhouz.co.uk/courses/1751024716708-ovsjdt1owx9.jpg', rating: 9.4, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 12 }] },
  { id: 'mock-course-08', name: 'Augusta National Golf Club', country: 'USA', sub_country: 'Georgia', thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800', rating: 9.9, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 4 }] },
  { id: 'mock-course-09', name: 'Shinnecock Hills Golf Club', country: 'USA', sub_country: 'New York', thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800', rating: 9.5, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 5 }] },
  { id: 'mock-course-10', name: 'Muirfield', country: 'Scotland', sub_country: 'East Lothian', thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800', rating: 9.4, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 8 }] },
  { id: 'mock-course-11', name: 'Royal Melbourne Golf Club (West)', country: 'Australia', sub_country: 'Victoria', thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800', rating: 9.3, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 9 }] },
  { id: 'mock-course-12', name: 'Oakmont Country Club', country: 'USA', sub_country: 'Pennsylvania', thumbnail: 'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800', rating: 9.2, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 7 }] },
  { id: 'mock-course-13', name: 'Turnberry (Ailsa)', country: 'Scotland', sub_country: 'Ayrshire', thumbnail: 'https://images.unsplash.com/photo-1600783245777-080fd7ff9253?w=800', rating: 9.1, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 12 }] },
  { id: 'mock-course-14', name: 'Merion Golf Club (East)', country: 'USA', sub_country: 'Pennsylvania', thumbnail: 'https://images.unsplash.com/photo-1591491653056-4e9d563a42de?w=800', rating: 9.3, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 8 }] },
  { id: 'mock-course-15', name: 'Carnoustie Golf Links', country: 'Scotland', sub_country: 'Angus', thumbnail: 'https://images.unsplash.com/photo-1632155605925-7dc2384bd90b?w=800', rating: 9.0, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 18 }] },
  { id: 'mock-course-16', name: 'Winged Foot Golf Club (West)', country: 'USA', sub_country: 'New York', thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800', rating: 9.1, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 10 }] },
  { id: 'mock-course-17', name: 'Royal Portrush (Dunluce)', country: 'Northern Ireland', sub_country: 'Antrim', thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800', rating: 9.2, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 15 }] },
  { id: 'mock-course-18', name: 'Whistling Straits', country: 'USA', sub_country: 'Wisconsin', thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800', rating: 8.9, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 22 }] },
  { id: 'mock-course-19', name: 'St Andrews (Old Course)', country: 'Scotland', sub_country: 'Fife', thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800', rating: 9.6, memberships: [{ list_id: 'global', list_slug: 'global', short_label: 'G', rank: 5 }] },
  { id: 'mock-course-20', name: 'Lahinch Golf Club (Old)', country: 'Ireland', sub_country: 'Clare', thumbnail: 'https://images.unsplash.com/photo-1600783245777-080fd7ff9253?w=800', rating: 8.8, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 25 }] },
  { id: 'mock-course-21', name: 'Bandon Dunes', country: 'USA', sub_country: 'Oregon', thumbnail: 'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800', rating: 9.0, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 18 }] },
  { id: 'mock-course-22', name: 'Pacific Dunes', country: 'USA', sub_country: 'Oregon', thumbnail: 'https://images.unsplash.com/photo-1591491653056-4e9d563a42de?w=800', rating: 9.2, memberships: [{ list_id: 'usa', list_slug: 'usa', short_label: 'USA', rank: 12 }] },
  { id: 'mock-course-23', name: 'Royal Birkdale', country: 'England', sub_country: 'Merseyside', thumbnail: 'https://images.unsplash.com/photo-1632155605925-7dc2384bd90b?w=800', rating: 9.0, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 20 }] },
  { id: 'mock-course-24', name: 'Portmarnock Golf Club', country: 'Ireland', sub_country: 'Dublin', thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800', rating: 8.7, memberships: [{ list_id: 'gb-i', list_slug: 'gb-i', short_label: 'GB&I', rank: 28 }] },
  { id: 'mock-course-25', name: 'North Berwick Golf Club (West)', country: 'Scotland', sub_country: 'East Lothian', thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800', rating: 8.5, memberships: [] },
];

// ============================================================================
// HELPER: Generate days ago timestamp
// ============================================================================
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ============================================================================
// MOCK FRIEND COURSE HITS - 40+ entries with varied dates and ratings
// ============================================================================
const mockFriendHits: FriendCourseHit[] = [
  // RECENT (0-3 days ago) - High activity cluster
  { friend_id: MOCK_FRIENDS[0].id, friend_profile: MOCK_FRIENDS[0], course_id: MOCK_COURSES[0].id, course_name: MOCK_COURSES[0].name, course_country: MOCK_COURSES[0].country, course_sub_country: MOCK_COURSES[0].sub_country, played_at: daysAgo(0), rating: 10, thumbnail_url: MOCK_COURSES[0].thumbnail, community_rating: MOCK_COURSES[0].rating, top100_memberships: MOCK_COURSES[0].memberships },
  { friend_id: MOCK_FRIENDS[1].id, friend_profile: MOCK_FRIENDS[1], course_id: MOCK_COURSES[0].id, course_name: MOCK_COURSES[0].name, course_country: MOCK_COURSES[0].country, course_sub_country: MOCK_COURSES[0].sub_country, played_at: daysAgo(1), rating: 9.5, thumbnail_url: MOCK_COURSES[0].thumbnail, community_rating: MOCK_COURSES[0].rating, top100_memberships: MOCK_COURSES[0].memberships },
  { friend_id: MOCK_FRIENDS[2].id, friend_profile: MOCK_FRIENDS[2], course_id: MOCK_COURSES[0].id, course_name: MOCK_COURSES[0].name, course_country: MOCK_COURSES[0].country, course_sub_country: MOCK_COURSES[0].sub_country, played_at: daysAgo(2), rating: 9, thumbnail_url: MOCK_COURSES[0].thumbnail, community_rating: MOCK_COURSES[0].rating, top100_memberships: MOCK_COURSES[0].memberships },
  { friend_id: MOCK_FRIENDS[3].id, friend_profile: MOCK_FRIENDS[3], course_id: MOCK_COURSES[2].id, course_name: MOCK_COURSES[2].name, course_country: MOCK_COURSES[2].country, course_sub_country: MOCK_COURSES[2].sub_country, played_at: daysAgo(0), rating: 10, thumbnail_url: MOCK_COURSES[2].thumbnail, community_rating: MOCK_COURSES[2].rating, top100_memberships: MOCK_COURSES[2].memberships },
  { friend_id: MOCK_FRIENDS[4].id, friend_profile: MOCK_FRIENDS[4], course_id: MOCK_COURSES[2].id, course_name: MOCK_COURSES[2].name, course_country: MOCK_COURSES[2].country, course_sub_country: MOCK_COURSES[2].sub_country, played_at: daysAgo(1), rating: 9.5, thumbnail_url: MOCK_COURSES[2].thumbnail, community_rating: MOCK_COURSES[2].rating, top100_memberships: MOCK_COURSES[2].memberships },
  
  // 3-7 days ago
  { friend_id: MOCK_FRIENDS[5].id, friend_profile: MOCK_FRIENDS[5], course_id: MOCK_COURSES[1].id, course_name: MOCK_COURSES[1].name, course_country: MOCK_COURSES[1].country, course_sub_country: MOCK_COURSES[1].sub_country, played_at: daysAgo(3), rating: 9, thumbnail_url: MOCK_COURSES[1].thumbnail, community_rating: MOCK_COURSES[1].rating, top100_memberships: MOCK_COURSES[1].memberships },
  { friend_id: MOCK_FRIENDS[6].id, friend_profile: MOCK_FRIENDS[6], course_id: MOCK_COURSES[3].id, course_name: MOCK_COURSES[3].name, course_country: MOCK_COURSES[3].country, course_sub_country: MOCK_COURSES[3].sub_country, played_at: daysAgo(4), rating: 8.5, thumbnail_url: MOCK_COURSES[3].thumbnail, community_rating: MOCK_COURSES[3].rating, top100_memberships: MOCK_COURSES[3].memberships },
  { friend_id: MOCK_FRIENDS[7].id, friend_profile: MOCK_FRIENDS[7], course_id: MOCK_COURSES[4].id, course_name: MOCK_COURSES[4].name, course_country: MOCK_COURSES[4].country, course_sub_country: MOCK_COURSES[4].sub_country, played_at: daysAgo(5), rating: 9, thumbnail_url: MOCK_COURSES[4].thumbnail, community_rating: MOCK_COURSES[4].rating, top100_memberships: MOCK_COURSES[4].memberships },
  { friend_id: MOCK_FRIENDS[8].id, friend_profile: MOCK_FRIENDS[8], course_id: MOCK_COURSES[5].id, course_name: MOCK_COURSES[5].name, course_country: MOCK_COURSES[5].country, course_sub_country: MOCK_COURSES[5].sub_country, played_at: daysAgo(6), rating: 8, thumbnail_url: MOCK_COURSES[5].thumbnail, community_rating: MOCK_COURSES[5].rating, top100_memberships: MOCK_COURSES[5].memberships },
  { friend_id: MOCK_FRIENDS[9].id, friend_profile: MOCK_FRIENDS[9], course_id: MOCK_COURSES[6].id, course_name: MOCK_COURSES[6].name, course_country: MOCK_COURSES[6].country, course_sub_country: MOCK_COURSES[6].sub_country, played_at: daysAgo(7), rating: 9.5, thumbnail_url: MOCK_COURSES[6].thumbnail, community_rating: MOCK_COURSES[6].rating, top100_memberships: MOCK_COURSES[6].memberships },
  
  // 8-14 days ago
  { friend_id: MOCK_FRIENDS[10].id, friend_profile: MOCK_FRIENDS[10], course_id: MOCK_COURSES[7].id, course_name: MOCK_COURSES[7].name, course_country: MOCK_COURSES[7].country, course_sub_country: MOCK_COURSES[7].sub_country, played_at: daysAgo(8), rating: 10, thumbnail_url: MOCK_COURSES[7].thumbnail, community_rating: MOCK_COURSES[7].rating, top100_memberships: MOCK_COURSES[7].memberships },
  { friend_id: MOCK_FRIENDS[11].id, friend_profile: MOCK_FRIENDS[11], course_id: MOCK_COURSES[8].id, course_name: MOCK_COURSES[8].name, course_country: MOCK_COURSES[8].country, course_sub_country: MOCK_COURSES[8].sub_country, played_at: daysAgo(9), rating: 8.5, thumbnail_url: MOCK_COURSES[8].thumbnail, community_rating: MOCK_COURSES[8].rating, top100_memberships: MOCK_COURSES[8].memberships },
  { friend_id: MOCK_FRIENDS[0].id, friend_profile: MOCK_FRIENDS[0], course_id: MOCK_COURSES[9].id, course_name: MOCK_COURSES[9].name, course_country: MOCK_COURSES[9].country, course_sub_country: MOCK_COURSES[9].sub_country, played_at: daysAgo(10), rating: 9, thumbnail_url: MOCK_COURSES[9].thumbnail, community_rating: MOCK_COURSES[9].rating, top100_memberships: MOCK_COURSES[9].memberships },
  { friend_id: MOCK_FRIENDS[1].id, friend_profile: MOCK_FRIENDS[1], course_id: MOCK_COURSES[10].id, course_name: MOCK_COURSES[10].name, course_country: MOCK_COURSES[10].country, course_sub_country: MOCK_COURSES[10].sub_country, played_at: daysAgo(11), rating: 9, thumbnail_url: MOCK_COURSES[10].thumbnail, community_rating: MOCK_COURSES[10].rating, top100_memberships: MOCK_COURSES[10].memberships },
  { friend_id: MOCK_FRIENDS[2].id, friend_profile: MOCK_FRIENDS[2], course_id: MOCK_COURSES[11].id, course_name: MOCK_COURSES[11].name, course_country: MOCK_COURSES[11].country, course_sub_country: MOCK_COURSES[11].sub_country, played_at: daysAgo(12), rating: 8, thumbnail_url: MOCK_COURSES[11].thumbnail, community_rating: MOCK_COURSES[11].rating, top100_memberships: MOCK_COURSES[11].memberships },
  { friend_id: MOCK_FRIENDS[3].id, friend_profile: MOCK_FRIENDS[3], course_id: MOCK_COURSES[12].id, course_name: MOCK_COURSES[12].name, course_country: MOCK_COURSES[12].country, course_sub_country: MOCK_COURSES[12].sub_country, played_at: daysAgo(13), rating: 9, thumbnail_url: MOCK_COURSES[12].thumbnail, community_rating: MOCK_COURSES[12].rating, top100_memberships: MOCK_COURSES[12].memberships },
  { friend_id: MOCK_FRIENDS[4].id, friend_profile: MOCK_FRIENDS[4], course_id: MOCK_COURSES[13].id, course_name: MOCK_COURSES[13].name, course_country: MOCK_COURSES[13].country, course_sub_country: MOCK_COURSES[13].sub_country, played_at: daysAgo(14), rating: 9.5, thumbnail_url: MOCK_COURSES[13].thumbnail, community_rating: MOCK_COURSES[13].rating, top100_memberships: MOCK_COURSES[13].memberships },
  
  // 15-30 days ago (more entries for "last 30 days" filter)
  { friend_id: MOCK_FRIENDS[5].id, friend_profile: MOCK_FRIENDS[5], course_id: MOCK_COURSES[14].id, course_name: MOCK_COURSES[14].name, course_country: MOCK_COURSES[14].country, course_sub_country: MOCK_COURSES[14].sub_country, played_at: daysAgo(16), rating: 8.5, thumbnail_url: MOCK_COURSES[14].thumbnail, community_rating: MOCK_COURSES[14].rating, top100_memberships: MOCK_COURSES[14].memberships },
  { friend_id: MOCK_FRIENDS[6].id, friend_profile: MOCK_FRIENDS[6], course_id: MOCK_COURSES[15].id, course_name: MOCK_COURSES[15].name, course_country: MOCK_COURSES[15].country, course_sub_country: MOCK_COURSES[15].sub_country, played_at: daysAgo(18), rating: 9, thumbnail_url: MOCK_COURSES[15].thumbnail, community_rating: MOCK_COURSES[15].rating, top100_memberships: MOCK_COURSES[15].memberships },
  { friend_id: MOCK_FRIENDS[7].id, friend_profile: MOCK_FRIENDS[7], course_id: MOCK_COURSES[16].id, course_name: MOCK_COURSES[16].name, course_country: MOCK_COURSES[16].country, course_sub_country: MOCK_COURSES[16].sub_country, played_at: daysAgo(20), rating: 9.5, thumbnail_url: MOCK_COURSES[16].thumbnail, community_rating: MOCK_COURSES[16].rating, top100_memberships: MOCK_COURSES[16].memberships },
  { friend_id: MOCK_FRIENDS[8].id, friend_profile: MOCK_FRIENDS[8], course_id: MOCK_COURSES[17].id, course_name: MOCK_COURSES[17].name, course_country: MOCK_COURSES[17].country, course_sub_country: MOCK_COURSES[17].sub_country, played_at: daysAgo(22), rating: 8, thumbnail_url: MOCK_COURSES[17].thumbnail, community_rating: MOCK_COURSES[17].rating, top100_memberships: MOCK_COURSES[17].memberships },
  { friend_id: MOCK_FRIENDS[9].id, friend_profile: MOCK_FRIENDS[9], course_id: MOCK_COURSES[18].id, course_name: MOCK_COURSES[18].name, course_country: MOCK_COURSES[18].country, course_sub_country: MOCK_COURSES[18].sub_country, played_at: daysAgo(24), rating: 10, thumbnail_url: MOCK_COURSES[18].thumbnail, community_rating: MOCK_COURSES[18].rating, top100_memberships: MOCK_COURSES[18].memberships },
  { friend_id: MOCK_FRIENDS[10].id, friend_profile: MOCK_FRIENDS[10], course_id: MOCK_COURSES[19].id, course_name: MOCK_COURSES[19].name, course_country: MOCK_COURSES[19].country, course_sub_country: MOCK_COURSES[19].sub_country, played_at: daysAgo(26), rating: 8.5, thumbnail_url: MOCK_COURSES[19].thumbnail, community_rating: MOCK_COURSES[19].rating, top100_memberships: MOCK_COURSES[19].memberships },
  { friend_id: MOCK_FRIENDS[11].id, friend_profile: MOCK_FRIENDS[11], course_id: MOCK_COURSES[20].id, course_name: MOCK_COURSES[20].name, course_country: MOCK_COURSES[20].country, course_sub_country: MOCK_COURSES[20].sub_country, played_at: daysAgo(28), rating: 9, thumbnail_url: MOCK_COURSES[20].thumbnail, community_rating: MOCK_COURSES[20].rating, top100_memberships: MOCK_COURSES[20].memberships },
  
  // 30-60 days ago (for "last 90 days" filter)
  { friend_id: MOCK_FRIENDS[0].id, friend_profile: MOCK_FRIENDS[0], course_id: MOCK_COURSES[21].id, course_name: MOCK_COURSES[21].name, course_country: MOCK_COURSES[21].country, course_sub_country: MOCK_COURSES[21].sub_country, played_at: daysAgo(35), rating: 9.5, thumbnail_url: MOCK_COURSES[21].thumbnail, community_rating: MOCK_COURSES[21].rating, top100_memberships: MOCK_COURSES[21].memberships },
  { friend_id: MOCK_FRIENDS[1].id, friend_profile: MOCK_FRIENDS[1], course_id: MOCK_COURSES[22].id, course_name: MOCK_COURSES[22].name, course_country: MOCK_COURSES[22].country, course_sub_country: MOCK_COURSES[22].sub_country, played_at: daysAgo(40), rating: 9, thumbnail_url: MOCK_COURSES[22].thumbnail, community_rating: MOCK_COURSES[22].rating, top100_memberships: MOCK_COURSES[22].memberships },
  { friend_id: MOCK_FRIENDS[2].id, friend_profile: MOCK_FRIENDS[2], course_id: MOCK_COURSES[23].id, course_name: MOCK_COURSES[23].name, course_country: MOCK_COURSES[23].country, course_sub_country: MOCK_COURSES[23].sub_country, played_at: daysAgo(45), rating: 8, thumbnail_url: MOCK_COURSES[23].thumbnail, community_rating: MOCK_COURSES[23].rating, top100_memberships: MOCK_COURSES[23].memberships },
  { friend_id: MOCK_FRIENDS[3].id, friend_profile: MOCK_FRIENDS[3], course_id: MOCK_COURSES[24].id, course_name: MOCK_COURSES[24].name, course_country: MOCK_COURSES[24].country, course_sub_country: MOCK_COURSES[24].sub_country, played_at: daysAgo(50), rating: 8.5, thumbnail_url: MOCK_COURSES[24].thumbnail, community_rating: MOCK_COURSES[24].rating, top100_memberships: MOCK_COURSES[24].memberships },
  
  // Multiple friends visiting same course (for "trending" test)
  { friend_id: MOCK_FRIENDS[4].id, friend_profile: MOCK_FRIENDS[4], course_id: MOCK_COURSES[18].id, course_name: MOCK_COURSES[18].name, course_country: MOCK_COURSES[18].country, course_sub_country: MOCK_COURSES[18].sub_country, played_at: daysAgo(3), rating: 9.5, thumbnail_url: MOCK_COURSES[18].thumbnail, community_rating: MOCK_COURSES[18].rating, top100_memberships: MOCK_COURSES[18].memberships },
  { friend_id: MOCK_FRIENDS[5].id, friend_profile: MOCK_FRIENDS[5], course_id: MOCK_COURSES[18].id, course_name: MOCK_COURSES[18].name, course_country: MOCK_COURSES[18].country, course_sub_country: MOCK_COURSES[18].sub_country, played_at: daysAgo(5), rating: 9, thumbnail_url: MOCK_COURSES[18].thumbnail, community_rating: MOCK_COURSES[18].rating, top100_memberships: MOCK_COURSES[18].memberships },
  { friend_id: MOCK_FRIENDS[6].id, friend_profile: MOCK_FRIENDS[6], course_id: MOCK_COURSES[4].id, course_name: MOCK_COURSES[4].name, course_country: MOCK_COURSES[4].country, course_sub_country: MOCK_COURSES[4].sub_country, played_at: daysAgo(2), rating: 9, thumbnail_url: MOCK_COURSES[4].thumbnail, community_rating: MOCK_COURSES[4].rating, top100_memberships: MOCK_COURSES[4].memberships },
  { friend_id: MOCK_FRIENDS[7].id, friend_profile: MOCK_FRIENDS[7], course_id: MOCK_COURSES[1].id, course_name: MOCK_COURSES[1].name, course_country: MOCK_COURSES[1].country, course_sub_country: MOCK_COURSES[1].sub_country, played_at: daysAgo(4), rating: 10, thumbnail_url: MOCK_COURSES[1].thumbnail, community_rating: MOCK_COURSES[1].rating, top100_memberships: MOCK_COURSES[1].memberships },
  { friend_id: MOCK_FRIENDS[8].id, friend_profile: MOCK_FRIENDS[8], course_id: MOCK_COURSES[1].id, course_name: MOCK_COURSES[1].name, course_country: MOCK_COURSES[1].country, course_sub_country: MOCK_COURSES[1].sub_country, played_at: daysAgo(6), rating: 9.5, thumbnail_url: MOCK_COURSES[1].thumbnail, community_rating: MOCK_COURSES[1].rating, top100_memberships: MOCK_COURSES[1].memberships },
  
  // Extra varied entries
  { friend_id: MOCK_FRIENDS[9].id, friend_profile: MOCK_FRIENDS[9], course_id: MOCK_COURSES[7].id, course_name: MOCK_COURSES[7].name, course_country: MOCK_COURSES[7].country, course_sub_country: MOCK_COURSES[7].sub_country, played_at: daysAgo(5), rating: 9.5, thumbnail_url: MOCK_COURSES[7].thumbnail, community_rating: MOCK_COURSES[7].rating, top100_memberships: MOCK_COURSES[7].memberships },
  { friend_id: MOCK_FRIENDS[10].id, friend_profile: MOCK_FRIENDS[10], course_id: MOCK_COURSES[3].id, course_name: MOCK_COURSES[3].name, course_country: MOCK_COURSES[3].country, course_sub_country: MOCK_COURSES[3].sub_country, played_at: daysAgo(2), rating: 9, thumbnail_url: MOCK_COURSES[3].thumbnail, community_rating: MOCK_COURSES[3].rating, top100_memberships: MOCK_COURSES[3].memberships },
  { friend_id: MOCK_FRIENDS[11].id, friend_profile: MOCK_FRIENDS[11], course_id: MOCK_COURSES[6].id, course_name: MOCK_COURSES[6].name, course_country: MOCK_COURSES[6].country, course_sub_country: MOCK_COURSES[6].sub_country, played_at: daysAgo(4), rating: 9, thumbnail_url: MOCK_COURSES[6].thumbnail, community_rating: MOCK_COURSES[6].rating, top100_memberships: MOCK_COURSES[6].memberships },
];

// ============================================================================
// AGGREGATE INTO CourseWithFriends
// ============================================================================
function buildCoursesWithFriends(hits: FriendCourseHit[]): CourseWithFriends[] {
  const courseMap = new Map<string, CourseWithFriends>();
  
  for (const hit of hits) {
    const existing = courseMap.get(hit.course_id);
    if (!existing) {
      courseMap.set(hit.course_id, {
        course_id: hit.course_id,
        course_name: hit.course_name,
        country: hit.course_country,
        sub_country: hit.course_sub_country,
        thumbnail_url: hit.thumbnail_url,
        community_rating: hit.community_rating ?? null,
        top100_memberships: hit.top100_memberships,
        friends: [hit],
        most_recent_play: hit.played_at,
        total_friends_played: 1,
      });
    } else {
      existing.friends.push(hit);
      existing.total_friends_played = existing.friends.length;
      if (new Date(hit.played_at) > new Date(existing.most_recent_play)) {
        existing.most_recent_play = hit.played_at;
      }
    }
  }
  
  return Array.from(courseMap.values()).sort((a, b) => {
    if (b.total_friends_played !== a.total_friends_played) {
      return b.total_friends_played - a.total_friends_played;
    }
    return new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime();
  });
}

const mockCoursesWithFriends = buildCoursesWithFriends(mockFriendHits);

// ============================================================================
// EXPORTED MOCK DATA
// ============================================================================
export const MOCK_FRIENDS_COURSES_BUSY: FriendsCoursesResult = {
  courses: mockCoursesWithFriends,
  recent: mockFriendHits,
  totalCourses: mockCoursesWithFriends.length,
  totalFriendsActive: MOCK_FRIENDS.length,
};
