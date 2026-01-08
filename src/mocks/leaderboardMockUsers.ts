/**
 * Mock leaderboard users for Benjamin Holmes' leaderboard page
 * Generates 100 deterministic mock users for UI/UX testing
 * 
 * @see src/config/flags.ts - LEADERBOARD_MOCK_USERS_ENABLED
 */

export interface LeaderboardMockUser {
  user_id: string;
  display_name: string;
  home_club: string | null;
  avatar_url: string | null;
  total_top100_played: number;
  rank: number;
  previous_rank: number | null;
  country: string | null;
  country_code: string | null;
  is_friend: boolean;
  lists_completed: string[];
  milestone_label: string | null;
}

// Seeded pseudo-random number generator for deterministic results
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

// Realistic first names
const FIRST_NAMES = [
  'James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella',
  'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Sebastian', 'Harper',
  'Jack', 'Evelyn', 'Daniel', 'Abigail', 'Matthew', 'Emily', 'David', 'Elizabeth',
  'Joseph', 'Sofia', 'Samuel', 'Avery', 'Andrew', 'Ella', 'Ryan', 'Scarlett',
  'Nathan', 'Grace', 'Thomas', 'Chloe', 'Charles', 'Victoria', 'Christopher', 'Riley',
  'Liam', 'Aria', 'Ethan', 'Lily', 'Michael', 'Aubrey', 'Aiden', 'Zoey',
  'Noah', 'Penelope', 'Mason', 'Layla', 'Logan', 'Nora', 'Jacob', 'Camila',
  'Owen', 'Hannah', 'Luke', 'Brooklyn', 'Dylan', 'Zoe', 'Caleb', 'Stella',
  'Isaac', 'Aurora', 'Connor', 'Savannah', 'Evan', 'Bella', 'Jayden', 'Paisley',
  'Tyler', 'Skylar', 'Hunter', 'Addison', 'Cameron', 'Lucy', 'Julian', 'Ellie'
];

// Realistic last names
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz',
  'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook',
  'Rogers', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes'
];

// Famous golf clubs worldwide
const GOLF_CLUBS = [
  'Royal St. George\'s', 'Muirfield', 'Royal Birkdale', 'Carnoustie',
  'Royal Liverpool', 'Royal Lytham', 'Turnberry', 'Royal Portrush',
  'Royal County Down', 'Ballybunion', 'Lahinch', 'Portmarnock',
  'Sunningdale', 'Wentworth', 'The Belfry', 'Celtic Manor',
  'Augusta National', 'Pebble Beach', 'Cypress Point', 'Shinnecock Hills',
  'Pinehurst No. 2', 'Whistling Straits', 'Bethpage Black', 'Merion',
  'Oakmont', 'Winged Foot', 'Oakland Hills', 'Congressional',
  'TPC Sawgrass', 'Torrey Pines', 'Bandon Dunes', 'Streamsong',
  'St Andrews Links', 'Royal Dornoch', 'Kingsbarns', 'Castle Stuart',
  'Royal Melbourne', 'Kingston Heath', 'Barnbougle Dunes', 'Cape Kidnappers',
  'Valderrama', 'Le Golf National', 'Kennemer', 'Hamburger',
  'Fancourt', 'Leopard Creek', 'Gary Player CC', 'Pearl Valley',
  'Mission Hills', 'Spring City', 'Kasumigaseki', 'Kawana',
  null, null, null, null, null // Some users without clubs
];

const COUNTRIES = [
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Australia', code: 'AU' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Spain', code: 'ES' },
  { name: 'Italy', code: 'IT' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Japan', code: 'JP' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'Canada', code: 'CA' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Portugal', code: 'PT' },
];

/**
 * Generates 100 deterministic mock leaderboard users
 * Uses seeded randomness for consistent results across renders
 */
export function generateMockLeaderboardUsers(
  count: number = 100,
  seed: string = 'benjamin-holmes-leaderboard-mock-v1'
): LeaderboardMockUser[] {
  const random = seededRandom(seed);
  const users: LeaderboardMockUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    const club = GOLF_CLUBS[Math.floor(random() * GOLF_CLUBS.length)];
    const country = COUNTRIES[Math.floor(random() * COUNTRIES.length)];
    
    // Top 100 played: exponential decay distribution (more at top, fewer at bottom)
    // Range from ~50 at top to ~1 at bottom
    const topWeight = 1 - (i / count);
    const baseScore = Math.floor(50 * Math.pow(topWeight, 1.5) + random() * 5);
    const totalPlayed = Math.max(1, baseScore);
    
    // Previous rank with some variation
    const rankDelta = Math.floor(random() * 10) - 5; // -5 to +5
    const prevRank = i + 1 + rankDelta;
    
    users.push({
      user_id: `mock-lb-${seed.slice(0, 8)}-${i + 1}`,
      display_name: `${firstName} ${lastName}`,
      home_club: club,
      avatar_url: null,
      total_top100_played: totalPlayed,
      rank: i + 1,
      previous_rank: prevRank > 0 ? prevRank : null,
      country: country.name,
      country_code: country.code,
      is_friend: random() < 0.15, // 15% chance of being a "friend"
      lists_completed: [],
      milestone_label: null,
    });
  }
  
  // Sort by total_top100_played descending, then reassign ranks
  users.sort((a, b) => b.total_top100_played - a.total_top100_played);
  users.forEach((user, idx) => {
    user.rank = idx + 1;
  });
  
  return users;
}

// Pre-generated mock users (cached for performance)
let _cachedMockUsers: LeaderboardMockUser[] | null = null;

export function getMockLeaderboardUsers(): LeaderboardMockUser[] {
  if (!_cachedMockUsers) {
    _cachedMockUsers = generateMockLeaderboardUsers(100);
    if (import.meta.env.DEV) {
      console.info('[Leaderboard] Mock users enabled (100 injected)');
    }
  }
  return _cachedMockUsers;
}

// Benjamin Holmes user ID - used to scope mock injection
export const BENJAMIN_HOLMES_USER_ID = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';
