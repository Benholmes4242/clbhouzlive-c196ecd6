/**
 * Seeded Mock Leaderboard Generator for V2 Leaderboard Testing
 * 
 * Generates 100 deterministic mock players for busy-state UI testing.
 * Uses a seeded PRNG for stable results across reloads.
 */

import type { Top100LeaderboardEntry } from '@/hooks/useTop100Leaderboard';

// Seeded PRNG (mulberry32)
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Mock data pools
const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
  'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy',
  'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia',
  'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Madison', 'Scarlett',
  'Victoria', 'Aria', 'Grace', 'Chloe', 'Camila', 'Penelope', 'Riley', 'Layla',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  "O'Brien", "O'Connor", 'Murphy', 'Kelly', 'Sullivan', 'Kennedy', 'Walsh', 'Byrne',
  'MacDonald', 'Stewart', 'Fraser', 'Cameron', 'Ferguson', 'Murray', 'MacLeod',
];

const HOME_CLUBS = [
  'Royal St Andrews', 'Pebble Beach GC', 'Augusta National', 'Pinehurst Resort',
  'Muirfield Village', 'Carnoustie Links', 'Royal Birkdale', 'Sunningdale',
  'Wentworth Club', 'The K Club', 'Celtic Manor', 'Gleneagles', 'The Belfry',
  'Royal Liverpool', 'Royal Troon', 'Turnberry', 'Royal Portrush', 'Lahinch GC',
  'Ballybunion', 'Waterville', 'Royal County Down', 'Royal Dornoch', 'Kingsbarns',
  'North Berwick', 'Cruden Bay', 'Royal Aberdeen', 'Loch Lomond', 'Queenwood',
  'Stoke Park', 'The Grove', 'Hanbury Manor', 'London GC', 'Bearwood Lakes',
  'Chart Hills', 'Wisley', 'Walton Heath', 'Swinley Forest', 'St Georges Hill',
  'Rye GC', 'Deal GC', 'Sandwich Bay', "Prince's GC", 'TPC Sawgrass', 'Torrey Pines',
  'Bethpage Black', 'Kiawah Island', 'Whistling Straits', 'Chambers Bay',
  null, null, null, // Some players without home club
];

const COUNTRIES = [
  'GB', 'US', 'IE', 'ES', 'FR', 'DE', 'AU', 'NZ', 'CA', 'ZA',
  'SE', 'DK', 'NL', 'BE', 'IT', 'PT', 'JP', 'KR', 'AE', 'SG',
];

const REGIONS = ['gbi', 'usa', 'europe', 'asia-pacific'] as const;

// Generate weighted Top 100 count (realistic distribution)
function generateTop100Count(rand: () => number): number {
  const r = rand();
  if (r < 0.05) return Math.floor(rand() * 20) + 80; // 5%: 80-99 (elite)
  if (r < 0.15) return Math.floor(rand() * 20) + 50; // 10%: 50-69 (high)
  if (r < 0.35) return Math.floor(rand() * 20) + 30; // 20%: 30-49 (mid-high)
  if (r < 0.60) return Math.floor(rand() * 15) + 15; // 25%: 15-29 (mid)
  if (r < 0.85) return Math.floor(rand() * 10) + 5;  // 25%: 5-14 (low-mid)
  return Math.floor(rand() * 5) + 1;                  // 15%: 1-4 (new)
}

// Generate trend delta for climbers
function generateTrendDelta(rand: () => number, top100Count: number): number {
  if (rand() < 0.3) return 0; // 30% no movement
  const maxDelta = Math.min(20, Math.ceil(top100Count / 3));
  const delta = Math.floor(rand() * maxDelta) + 1;
  return rand() < 0.7 ? delta : -delta; // 70% up, 30% down
}

// Generate regional counts
function generateRegionCounts(rand: () => number, total: number): Record<string, number> {
  const gbi = Math.floor(rand() * (total * 0.6));
  const remaining = total - gbi;
  const usa = Math.floor(rand() * (remaining * 0.7));
  const europe = remaining - usa;
  
  return {
    gbi: Math.max(0, gbi),
    usa: Math.max(0, usa),
    europe: Math.max(0, europe),
    'asia-pacific': Math.floor(rand() * Math.min(10, total * 0.2)),
  };
}

export interface MockLeaderboardV2Entry extends Top100LeaderboardEntry {
  delta_rank?: number;
  region_counts?: Record<string, number>;
  primary_region?: string;
}

/**
 * Generate 100 mock leaderboard entries with stable seeding
 */
export function generateMockLeaderboardV2(
  count: number = 100,
  seed: string = 'leaderboard-mock-v2'
): MockLeaderboardV2Entry[] {
  const rand = seededRandom(seed);
  const entries: MockLeaderboardV2Entry[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const displayName = `${firstName} ${lastName}`;
    
    const top100Count = generateTop100Count(rand);
    const regionCounts = generateRegionCounts(rand, top100Count);
    const trendDelta = generateTrendDelta(rand, top100Count);
    
    // Determine primary region based on counts
    const maxRegion = Object.entries(regionCounts).reduce(
      (max, [region, count]) => count > max.count ? { region, count } : max,
      { region: 'worldwide', count: 0 }
    );

    entries.push({
      user_id: `mock-v2-${String(i + 1).padStart(4, '0')}`,
      rank: 0, // Will be assigned after sorting
      display_name: displayName,
      avatar_url: rand() < 0.7 
        ? `https://i.pravatar.cc/150?u=mock-v2-${i}-${seed}` 
        : null,
      home_club: HOME_CLUBS[Math.floor(rand() * HOME_CLUBS.length)],
      country: COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
      total_top100_played: top100Count,
      lists_completed: [],
      milestone_label: null,
      is_friend: rand() < 0.15, // 15% chance of being a friend
      delta_rank: trendDelta,
      region_counts: regionCounts,
      primary_region: maxRegion.region,
    });
  }

  // Sort by total played descending
  entries.sort((a, b) => b.total_top100_played - a.total_top100_played);

  // Assign ranks after sorting (will be re-ranked when merged with real data)
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

// Cached instance
let cachedMockEntries: MockLeaderboardV2Entry[] | null = null;

/**
 * Get cached mock entries (stable across renders)
 */
export function getMockLeaderboardV2Entries(): MockLeaderboardV2Entry[] {
  if (!cachedMockEntries) {
    cachedMockEntries = generateMockLeaderboardV2(100, 'leaderboard-mock-v2');
  }
  return cachedMockEntries;
}

/**
 * Merge mock entries with real entries, avoiding duplicates and maintaining sort order
 */
export function mergeWithMockEntries(
  realEntries: Top100LeaderboardEntry[],
  mockEntries: MockLeaderboardV2Entry[]
): Top100LeaderboardEntry[] {
  const realIds = new Set(realEntries.map(e => e.user_id));
  
  // Filter out any mocks that might conflict with real IDs (shouldn't happen, but safe)
  const uniqueMocks = mockEntries.filter(m => !realIds.has(m.user_id));
  
  // Merge and sort
  const merged = [...realEntries, ...uniqueMocks];
  merged.sort((a, b) => b.total_top100_played - a.total_top100_played);
  
  // Reassign ranks
  merged.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });
  
  return merged;
}
