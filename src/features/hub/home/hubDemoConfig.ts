/**
 * Hub Demo Mode Configuration
 * Toggle HUB_DEMO_MODE to test filled states
 * 
 * Set to `true` to render Hub with mock data
 * Set to `false` to use real Supabase data
 */

// ============================================
// DEMO MODE FLAG
// ============================================
export const HUB_DEMO_MODE = true;

// ============================================
// MOCK DATA
// ============================================

// Sample course hero image
const MOCK_COURSE_IMAGE = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';
const MOCK_TRIP_IMAGE = 'https://images.unsplash.com/photo-1543685664-f95c461f6e38?w=800&h=400&fit=crop&q=80';

// A) Next Game (hero)
export const MOCK_NEXT_GAME = {
  type: 'game' as const,
  gameId: 'demo-game-001',
  startTimeISO: (() => {
    // Set to this Sunday at 1:00 PM
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (7 - now.getDay()));
    sunday.setHours(13, 0, 0, 0);
    return sunday.toISOString();
  })(),
  slotsOpen: 3,
  slotsTotal: 4,
  courseName: 'Ardglass Golf Club',
  courseImageUrl: MOCK_COURSE_IMAGE,
  isHost: true,
};

// B) Next Trip (hero carousel second slide)
export const MOCK_NEXT_TRIP = {
  type: 'trip' as const,
  tripId: 'demo-trip-001',
  tripName: 'Portugal Golf Break',
  startDate: '2025-05-12',
  endDate: '2025-05-16',
  primaryCourseName: 'Quinta do Lago',
  primaryCourseImageUrl: MOCK_TRIP_IMAGE,
};

// C) Messages tile (filled state)
export const MOCK_MESSAGES = {
  unreadCount: 3,
  groupChatsCount: 2,
  latestSnippet: 'Tee time confirmed for Sunday',
};

// D) Active Games Near You (filled state)
export const MOCK_NEARBY_GAMES = [
  {
    id: 'demo-nearby-001',
    course_id: 'demo-course-001',
    course_name: 'Royal County Down',
    start_time: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 30, 0, 0);
      return tomorrow.toISOString();
    })(),
    status: 'active',
    slots_total: 4,
    slots_open: 2,
    host_user_id: 'demo-user-001',
    distance_km: 5.2,
  },
  {
    id: 'demo-nearby-002',
    course_id: 'demo-course-002',
    course_name: 'Portstewart Golf Club',
    start_time: (() => {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(14, 0, 0, 0);
      return dayAfter.toISOString();
    })(),
    status: 'active',
    slots_total: 4,
    slots_open: 1,
    host_user_id: 'demo-user-002',
    distance_km: 12.8,
  },
];

// F) Diary tile / Your Games (filled state)
export const MOCK_YOUR_GAMES_SUMMARY = {
  nextGameSummary: 'Ardglass · Sun 1:00 PM',
  nextTripSummary: 'Portugal · May 12–16',
  upcomingCount: 2,
};

// ============================================
// HERO DATA (combines game + trip for carousel)
// ============================================
export const MOCK_HERO_DATA = {
  primary: MOCK_NEXT_GAME,
  secondary: MOCK_NEXT_TRIP,
  hasCarousel: true,
};
