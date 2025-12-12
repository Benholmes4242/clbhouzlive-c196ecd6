// Mock leaderboard data for dev/demo testing
// Toggle this to enable mock data in development
export const USE_MOCK_LEADERBOARD_DATA = false;

// Mock current user position (can be changed for testing different scenarios)
export const MOCK_CURRENT_USER_RANK = 42;

// Club names for rotation
const MOCK_CLUBS = [
  'Royal St Andrews', 'Pebble Beach GC', 'Augusta National', 'Pinehurst Resort',
  'Muirfield Village', 'Carnoustie Links', 'Royal Birkdale', 'Sunningdale',
  'Wentworth Club', 'The K Club', 'Celtic Manor', 'Gleneagles',
  'St Mellion', 'The Belfry', 'Woburn GC', 'Royal Liverpool',
  'Royal Troon', 'Turnberry', 'Royal Portrush', 'Lahinch GC',
  'Ballybunion', 'Waterville', 'Royal County Down', 'Royal Dornoch',
  'Kingsbarns', 'North Berwick', 'Cruden Bay', 'Royal Aberdeen',
  'Trump Turnberry', 'Loch Lomond', 'Queenwood', 'Sunridge Park',
  'Stoke Park', 'The Grove', 'Hanbury Manor', 'London GC',
  'Bearwood Lakes', 'Chart Hills', 'Wisley', 'Walton Heath',
  'Swinley Forest', 'St Georges Hill', 'Worplesdon', 'West Sussex',
  'Rye GC', 'Deal GC', 'Sandwich Bay', 'Prince\'s GC'
];

const COUNTRY_CODES = ['GB', 'US', 'IE', 'ES', 'FR', 'DE', 'AU', 'NZ', 'CA', 'ZA', 'SE', 'DK', 'NL', 'BE', 'IT', 'PT', 'JP', 'KR', 'AE', 'SG'];

// Weighted distribution for realistic counts
function generateWeightedCount(): number {
  const rand = Math.random();
  if (rand < 0.50) return Math.floor(Math.random() * 10); // 50% have 0-9
  if (rand < 0.75) return Math.floor(Math.random() * 10) + 10; // 25% have 10-19
  if (rand < 0.88) return Math.floor(Math.random() * 15) + 20; // 13% have 20-34
  if (rand < 0.95) return Math.floor(Math.random() * 15) + 35; // 7% have 35-49
  if (rand < 0.98) return Math.floor(Math.random() * 25) + 50; // 3% have 50-74
  return Math.floor(Math.random() * 26) + 75; // 2% have 75-100
}

// Generate regional counts (subset of global)
function generateRegionalCounts(globalCount: number) {
  const gbi = Math.min(globalCount, Math.floor(Math.random() * (globalCount + 1)));
  const remaining = globalCount - gbi;
  const usa = Math.min(remaining, Math.floor(Math.random() * (remaining + 1)));
  const europe = globalCount - gbi - usa;
  return { gbi, usa, europe };
}

// Generate XP based on count (rough approximation)
function generateXP(count: number): number {
  const baseXP = count * 500;
  const variance = Math.floor(Math.random() * 2000);
  return baseXP + variance;
}

// Generate recent date within last 90 days
function generateRecentDate(): string {
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Generate delta for Rising view
function generateDelta(count: number): number {
  if (count < 5) return Math.floor(Math.random() * 3);
  if (count < 20) return Math.floor(Math.random() * 5);
  return Math.floor(Math.random() * 8);
}

export interface MockLeaderboardPlayer {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  country_code: string;
  home_club: string;
  top100_played_global: number;
  top100_played_gbi: number;
  top100_played_usa: number;
  top100_played_europe: number;
  last_activity_date: string;
  xp: number;
  delta_last_30_days: number;
  is_friend: boolean;
}

// Generate 300 mock players
function generateMockPlayers(): MockLeaderboardPlayer[] {
  const players: MockLeaderboardPlayer[] = [];
  
  // Determine which players are "friends" (roughly 20)
  const friendIndices = new Set<number>();
  while (friendIndices.size < 20) {
    friendIndices.add(Math.floor(Math.random() * 300));
  }
  
  for (let i = 0; i < 300; i++) {
    const globalCount = generateWeightedCount();
    const regional = generateRegionalCounts(globalCount);
    const xp = generateXP(globalCount);
    
    players.push({
      id: `mock-player-${String(i + 1).padStart(3, '0')}`,
      user_id: `mock-user-${String(i + 1).padStart(3, '0')}`,
      display_name: `Golfer ${String(i + 1).padStart(3, '0')}`,
      avatar_url: null, // Will use fallback initials
      country_code: COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)],
      home_club: MOCK_CLUBS[Math.floor(Math.random() * MOCK_CLUBS.length)],
      top100_played_global: globalCount,
      top100_played_gbi: regional.gbi,
      top100_played_usa: regional.usa,
      top100_played_europe: regional.europe,
      last_activity_date: generateRecentDate(),
      xp,
      delta_last_30_days: generateDelta(globalCount),
      is_friend: friendIndices.has(i),
    });
  }
  
  return players;
}

// Sort players by global count (desc), then last activity (desc), then name (asc)
function sortPlayers(players: MockLeaderboardPlayer[]): MockLeaderboardPlayer[] {
  return [...players].sort((a, b) => {
    if (b.top100_played_global !== a.top100_played_global) {
      return b.top100_played_global - a.top100_played_global;
    }
    if (b.last_activity_date !== a.last_activity_date) {
      return new Date(b.last_activity_date).getTime() - new Date(a.last_activity_date).getTime();
    }
    return a.display_name.localeCompare(b.display_name);
  });
}

// Cache the generated data
let cachedPlayers: MockLeaderboardPlayer[] | null = null;
let cachedSortedPlayers: MockLeaderboardPlayer[] | null = null;

export function getMockPlayers(): MockLeaderboardPlayer[] {
  if (!cachedPlayers) {
    cachedPlayers = generateMockPlayers();
  }
  return cachedPlayers;
}

export function getSortedMockPlayers(): MockLeaderboardPlayer[] {
  if (!cachedSortedPlayers) {
    cachedSortedPlayers = sortPlayers(getMockPlayers());
  }
  return cachedSortedPlayers;
}

// Get Top 100 view
export function getMockTop100(): (MockLeaderboardPlayer & { rank: number })[] {
  const sorted = getSortedMockPlayers();
  return sorted.slice(0, 100).map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}

// Get Around You view (10 above, current user, 10 below)
export function getMockAroundYou(currentUserRank: number): (MockLeaderboardPlayer & { rank: number; isCurrentUser?: boolean })[] {
  const sorted = getSortedMockPlayers();
  const currentIdx = currentUserRank - 1;
  
  const startIdx = Math.max(0, currentIdx - 10);
  const endIdx = Math.min(sorted.length, currentIdx + 11);
  
  return sorted.slice(startIdx, endIdx).map((p, idx) => ({
    ...p,
    rank: startIdx + idx + 1,
    isCurrentUser: startIdx + idx === currentIdx,
  }));
}

// Get Friends view
export function getMockFriends(): (MockLeaderboardPlayer & { rank: number })[] {
  const sorted = getSortedMockPlayers();
  const friends = sorted.filter(p => p.is_friend);
  return friends.map((p, idx) => ({
    ...p,
    rank: idx + 1, // Rank within friends
  }));
}

// Get Rising view (top 50 by delta)
export function getMockRising(): (MockLeaderboardPlayer & { rank: number })[] {
  const players = getMockPlayers();
  const byDelta = [...players].sort((a, b) => b.delta_last_30_days - a.delta_last_30_days);
  return byDelta.slice(0, 50).map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}

// Get current mock user
export function getMockCurrentUser(): MockLeaderboardPlayer & { rank: number } {
  const sorted = getSortedMockPlayers();
  const idx = MOCK_CURRENT_USER_RANK - 1;
  return {
    ...sorted[idx],
    rank: MOCK_CURRENT_USER_RANK,
  };
}

// Get paginated results
export function getMockPlayersPaginated(
  view: 'top100' | 'around' | 'friends' | 'rising',
  page: number,
  pageSize: number = 50
): {
  players: (MockLeaderboardPlayer & { rank: number; isCurrentUser?: boolean })[];
  total: number;
  hasMore: boolean;
} {
  let allPlayers: (MockLeaderboardPlayer & { rank: number; isCurrentUser?: boolean })[];
  
  switch (view) {
    case 'top100':
      allPlayers = getMockTop100();
      break;
    case 'around':
      allPlayers = getMockAroundYou(MOCK_CURRENT_USER_RANK);
      break;
    case 'friends':
      allPlayers = getMockFriends();
      break;
    case 'rising':
      allPlayers = getMockRising();
      break;
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = allPlayers.slice(start, end);
  
  return {
    players: paginated,
    total: allPlayers.length,
    hasMore: end < allPlayers.length,
  };
}
