// Category definitions with keyword matching for intelligent suggestions
// Used by the suggestion engine to recommend categories based on caption/context

export type MomentCategoryDef = {
  id: string;
  label: string;
  emoji: string;
  keywords?: string[];
  courseBoost?: boolean;
  mediaBoost?: ('video' | 'photo')[];
  discoverEnabled?: boolean; // If true, appears in Discover filter pills
};

export type MomentBadgeDef = {
  id: string;
  label: string;
  category?: 'scoring' | 'shot' | 'performance' | 'experience';
  keywords?: string[];
};

// Core categories (prioritized in tie-breaks)
const CORE_CATEGORY_IDS = ['tips-coaching', 'funny', 'course-vlog', 'my-round'];

// Full category definitions with keyword/boost metadata
export const MOMENT_CATEGORIES: MomentCategoryDef[] = [
  // Core categories first
  {
    id: 'tips-coaching',
    label: 'Tips & Coaching',
    emoji: '📚',
    keywords: ['tip', 'tips', 'advice', 'lesson', 'coach', 'coaching', 'teach', 'learn', 'technique', 'drill', 'practice tip', 'how to', 'tutorial', 'improve', 'fix', 'correct'],
    mediaBoost: ['video'],
    discoverEnabled: true,
  },
  {
    id: 'funny',
    label: 'Funny',
    emoji: '😂',
    keywords: ['funny', 'lol', 'haha', 'hilarious', 'fail', 'oops', 'blooper', 'mishap', 'embarrassing', 'comedy', 'joke', 'laugh'],
    discoverEnabled: true,
  },
  {
    id: 'course-vlog',
    label: 'Course Vlog',
    emoji: '🎬',
    keywords: ['vlog', 'playing', 'round', 'first time', 'bucket list', 'dream course'],
    courseBoost: true,
    mediaBoost: ['video'],
    discoverEnabled: true,
  },
  {
    id: 'my-round',
    label: 'My Round',
    emoji: '⛳',
    keywords: ['round', 'played', 'shot', 'finished', 'scored', 'today', 'front 9', 'back 9', '18 holes', 'great round', 'tough round'],
    courseBoost: true,
  },
  // Other categories
  {
    id: 'challenge',
    label: 'Challenge',
    emoji: '🏆',
    keywords: ['challenge', 'bet', 'competition', 'contest', 'match', 'vs', 'versus', 'compete'],
    discoverEnabled: true,
  },
  {
    id: 'review',
    label: 'Review',
    emoji: '⭐',
    keywords: ['review', 'rating', 'recommend', 'worth', 'overrated', 'underrated', 'honest opinion', 'thoughts on'],
    courseBoost: true,
  },
  {
    id: 'swing',
    label: 'Swing',
    emoji: '🏌️',
    keywords: ['swing', 'driver', 'iron', 'wedge', 'putter', 'form', 'backswing', 'downswing', 'tempo', 'speed', 'club'],
    mediaBoost: ['video'],
    discoverEnabled: true,
  },
  {
    id: 'hole-in-one',
    label: 'Hole in One',
    emoji: '🎯',
    keywords: ['hole in one', 'hole-in-one', 'hio', 'ace', 'aced it', 'one shot'],
    discoverEnabled: true,
  },
  {
    id: 'gear',
    label: 'Gear',
    emoji: '🔧',
    keywords: ['gear', 'club', 'clubs', 'driver', 'putter', 'iron', 'wedge', 'bag', 'ball', 'balls', 'glove', 'shoes', 'new', 'just got', 'upgrade', 'fitting', 'custom'],
    mediaBoost: ['photo'],
  },
  {
    id: 'travel',
    label: 'Travel',
    emoji: '✈️',
    keywords: ['travel', 'trip', 'vacation', 'holiday', 'visiting', 'destination', 'bucket list', 'flew', 'flying', 'abroad'],
    courseBoost: true,
  },
  {
    id: 'tournament',
    label: 'Tournament',
    emoji: '🏅',
    keywords: ['tournament', 'competition', 'medal', 'trophy', 'winner', 'placing', 'qualified', 'club championship', 'match play', 'stroke play'],
  },
  {
    id: 'practice',
    label: 'Practice',
    emoji: '🎾',
    keywords: ['practice', 'range', 'driving range', 'putting green', 'chipping', 'short game', 'working on', 'grind', 'session'],
  },
  {
    id: 'other',
    label: 'Other',
    emoji: '📌',
    keywords: [],
  },
];

// Get categories enabled for Discover filtering
export function getDiscoverCategories(): MomentCategoryDef[] {
  return MOMENT_CATEGORIES.filter(c => c.discoverEnabled);
}

// V1 Achievement Badges - 15 total
// Organized by category for future grouping support
export const MOMENT_BADGES: MomentBadgeDef[] = [
  // Scoring (4)
  {
    id: 'break-100',
    label: 'Breaking 100',
    category: 'scoring',
    keywords: ['broke 100', 'break 100', 'breaking 100', 'under 100', '99', '98', '97', '96', '95', '94', '93', '92', '91'],
  },
  {
    id: 'break-90',
    label: 'Breaking 90',
    category: 'scoring',
    keywords: ['broke 90', 'break 90', 'breaking 90', 'under 90', '89', '88', '87', '86', '85', '84', '83', '82', '81'],
  },
  {
    id: 'break-80',
    label: 'Breaking 80',
    category: 'scoring',
    keywords: ['broke 80', 'break 80', 'breaking 80', 'under 80', '79', '78', '77', '76', '75', '74', '73', '72'],
  },
  {
    id: 'break-70',
    label: 'Breaking 70',
    category: 'scoring',
    keywords: ['broke 70', 'break 70', 'breaking 70', 'under 70', '69', '68', '67', '66', '65'],
  },
  // Shot / Hole (4)
  {
    id: 'hio',
    label: 'Hole-in-One',
    category: 'shot',
    keywords: ['hole in one', 'hole-in-one', 'hio', 'aced', 'ace'],
  },
  {
    id: 'albatross',
    label: 'Albatross',
    category: 'shot',
    keywords: ['albatross', 'double eagle', '-3'],
  },
  {
    id: 'eagle',
    label: 'Eagle',
    category: 'shot',
    keywords: ['eagle', 'eagled', '-2'],
  },
  {
    id: 'birdie',
    label: 'Birdie',
    category: 'shot',
    keywords: ['birdie', 'birdied', '-1'],
  },
  // Performance (4)
  {
    id: 'pb',
    label: 'Personal Best',
    category: 'performance',
    keywords: ['personal best', 'pb', 'new low', 'best score', 'best round', 'career low'],
  },
  {
    id: 'best-front-9',
    label: 'Best Front 9',
    category: 'performance',
    keywords: ['best front 9', 'front nine', 'best front nine', 'front 9 pb'],
  },
  {
    id: 'best-back-9',
    label: 'Best Back 9',
    category: 'performance',
    keywords: ['best back 9', 'back nine', 'best back nine', 'back 9 pb'],
  },
  {
    id: 'longest-drive',
    label: 'Longest Drive',
    category: 'performance',
    keywords: ['longest drive', 'bomb', 'bombed', 'crushed', 'smashed', 'distance'],
  },
  // Experience (3)
  {
    id: 'tournament',
    label: 'Tournament Round',
    category: 'experience',
    keywords: ['tournament', 'competition', 'comp', 'medal', 'club championship'],
  },
  {
    id: 'away-course',
    label: 'Away Course',
    category: 'experience',
    keywords: ['away', 'visitor', 'guest', 'first time', 'new course', 'traveled'],
  },
  {
    id: 'match-play',
    label: 'Match Play Win',
    category: 'experience',
    keywords: ['match play', 'won match', 'beat', 'victory', '1 up', '2 up', '3 up'],
  },
];

// Helper to check if a category is a core category (for tie-breaking)
export function isCoreCategory(categoryId: string): boolean {
  return CORE_CATEGORY_IDS.includes(categoryId);
}

// Get category by ID
export function getCategoryById(id: string): MomentCategoryDef | undefined {
  return MOMENT_CATEGORIES.find(c => c.id === id);
}

// Get badge by ID
export function getBadgeById(id: string): MomentBadgeDef | undefined {
  return MOMENT_BADGES.find(b => b.id === id);
}
