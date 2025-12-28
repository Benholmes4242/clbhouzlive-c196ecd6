// Category definitions with keyword matching for intelligent suggestions
// Used by the suggestion engine to recommend categories based on caption/context

export type MomentCategoryDef = {
  id: string;
  label: string;
  emoji: string;
  keywords?: string[];
  courseBoost?: boolean;
  mediaBoost?: ('video' | 'photo')[];
};

export type MomentBadgeDef = {
  id: string;
  label: string;
  emoji: string;
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
  },
  {
    id: 'funny',
    label: 'Funny',
    emoji: '😂',
    keywords: ['funny', 'lol', 'haha', 'hilarious', 'fail', 'oops', 'blooper', 'mishap', 'embarrassing', 'comedy', 'joke', 'laugh'],
  },
  {
    id: 'course-vlog',
    label: 'Course Vlog',
    emoji: '🎬',
    keywords: ['vlog', 'playing', 'round', 'first time', 'bucket list', 'dream course'],
    courseBoost: true,
    mediaBoost: ['video'],
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
  },
  {
    id: 'hole-in-one',
    label: 'Hole in One',
    emoji: '🎯',
    keywords: ['hole in one', 'hole-in-one', 'hio', 'ace', 'aced it', 'one shot'],
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

// Score badges - separate from categories
export const MOMENT_BADGES: MomentBadgeDef[] = [
  {
    id: 'hio',
    label: 'Hole-in-One',
    emoji: '🎯',
    keywords: ['hole in one', 'hole-in-one', 'hio', 'aced'],
  },
  {
    id: 'albatross',
    label: 'Albatross',
    emoji: '🦅',
    keywords: ['albatross', 'double eagle', '-3'],
  },
  {
    id: 'eagle',
    label: 'Eagle',
    emoji: '🦅',
    keywords: ['eagle', 'eagled', '-2'],
  },
  {
    id: 'birdie',
    label: 'Birdie',
    emoji: '🐦',
    keywords: ['birdie', 'birdied', '-1'],
  },
  {
    id: 'pb',
    label: 'Personal Best',
    emoji: '🏆',
    keywords: ['personal best', 'pb', 'new low', 'best score', 'best round', 'career low'],
  },
  {
    id: 'break-80',
    label: 'Breaking 80',
    emoji: '7️⃣',
    keywords: ['broke 80', 'break 80', 'breaking 80', 'under 80', '79', '78', '77', '76', '75', '74', '73', '72'],
  },
  {
    id: 'break-90',
    label: 'Breaking 90',
    emoji: '8️⃣',
    keywords: ['broke 90', 'break 90', 'breaking 90', 'under 90', '89', '88', '87', '86', '85', '84', '83', '82', '81'],
  },
  {
    id: 'break-100',
    label: 'Breaking 100',
    emoji: '9️⃣',
    keywords: ['broke 100', 'break 100', 'breaking 100', 'under 100', '99', '98', '97', '96', '95', '94', '93', '92', '91'],
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
