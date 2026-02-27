// Category definitions with keyword matching for intelligent suggestions
// Used by the suggestion engine to recommend categories based on caption/context

import { 
  BookOpen, Video, Flag, Star, Target, Trophy, Plane, Wrench, 
  Flame, Circle, Zap, Sparkles, MoreHorizontal, Users, Umbrella,
  Shirt, Camera, GraduationCap, TrendingUp, Calendar, MapPin,
  Clock, Lightbulb, Mountain, Award, Heart, MessageCircle,
  ThumbsUp, Smile, Bot, LucideIcon
} from "lucide-react";

export type CategoryAccentColor = {
  bg: string;       // unselected icon circle bg, e.g. 'bg-blue-50'
  text: string;     // unselected icon color, e.g. 'text-blue-500'
  bgActive: string; // selected icon circle bg, e.g. 'bg-blue-100'
  textActive: string; // selected icon color, e.g. 'text-blue-600'
  ring: string;     // selected card ring, e.g. 'ring-blue-300/40'
};

export type MomentCategoryDef = {
  id: string;
  label: string;
  emoji: string;
  icon: LucideIcon;
  keywords?: string[];
  courseBoost?: boolean;
  mediaBoost?: ('video' | 'photo')[];
  discoverEnabled?: boolean;
  accentColor?: CategoryAccentColor;
};

export type BadgeTier = 'legendary' | 'achievement' | 'milestone' | 'experience';

export type MomentBadgeDef = {
  id: string;
  label: string;
  description: string;
  category?: 'scoring' | 'shot' | 'performance' | 'experience';
  tier: BadgeTier;
  keywords?: string[];
};

// ===== 30 CATEGORIES =====
// First 9 are "Core" (shown in main grid)
// Remaining 21 are "More Tags" (collapsed by default)

export const MOMENT_CATEGORIES: MomentCategoryDef[] = [
  // ===== CORE 9 CATEGORIES (shown first in Create Moment) =====
  {
    id: 'tips-coaching',
    label: 'Tips & Coaching',
    emoji: '📚',
    icon: BookOpen,
    keywords: ['tip', 'tips', 'advice', 'lesson', 'coach', 'coaching', 'teach', 'learn', 'technique', 'drill', 'practice tip', 'how to', 'tutorial', 'improve', 'fix', 'correct'],
    mediaBoost: ['video'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-blue-50', text: 'text-blue-500', bgActive: 'bg-blue-100', textActive: 'text-blue-600', ring: 'ring-blue-300/40' },
  },
  {
    id: 'course-vlog',
    label: 'Course Vlog',
    emoji: '🎬',
    icon: Video,
    keywords: ['vlog', 'playing', 'round', 'first time', 'bucket list', 'dream course'],
    courseBoost: true,
    mediaBoost: ['video'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-emerald-50', text: 'text-emerald-500', bgActive: 'bg-emerald-100', textActive: 'text-emerald-600', ring: 'ring-emerald-300/40' },
  },
  {
    id: 'my-round',
    label: 'My Round',
    emoji: '⛳',
    icon: Flag,
    keywords: ['round', 'played', 'shot', 'finished', 'scored', 'today', 'front 9', 'back 9', '18 holes', 'great round', 'tough round'],
    courseBoost: true,
    discoverEnabled: true,
    accentColor: { bg: 'bg-green-50', text: 'text-green-500', bgActive: 'bg-green-100', textActive: 'text-green-600', ring: 'ring-green-300/40' },
  },
  {
    id: 'review',
    label: 'Review',
    emoji: '⭐',
    icon: Star,
    keywords: ['review', 'rating', 'recommend', 'worth', 'overrated', 'underrated', 'honest opinion', 'thoughts on'],
    courseBoost: true,
    discoverEnabled: true,
    accentColor: { bg: 'bg-amber-50', text: 'text-amber-500', bgActive: 'bg-amber-100', textActive: 'text-amber-600', ring: 'ring-amber-300/40' },
  },
  {
    id: 'practice',
    label: 'Practice',
    emoji: '🎾',
    icon: Target,
    keywords: ['practice', 'range', 'driving range', 'putting green', 'chipping', 'short game', 'working on', 'grind', 'session'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-violet-50', text: 'text-violet-500', bgActive: 'bg-violet-100', textActive: 'text-violet-600', ring: 'ring-violet-300/40' },
  },
  {
    id: 'tournament',
    label: 'Tournament',
    emoji: '🏅',
    icon: Trophy,
    keywords: ['tournament', 'competition', 'medal', 'trophy', 'winner', 'placing', 'qualified', 'club championship', 'match play', 'stroke play'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-red-50', text: 'text-red-500', bgActive: 'bg-red-100', textActive: 'text-red-600', ring: 'ring-red-300/40' },
  },
  {
    id: 'travel',
    label: 'Travel',
    emoji: '✈️',
    icon: Plane,
    keywords: ['travel', 'trip', 'vacation', 'holiday', 'visiting', 'destination', 'bucket list', 'flew', 'flying', 'abroad'],
    courseBoost: true,
    discoverEnabled: true,
    accentColor: { bg: 'bg-sky-50', text: 'text-sky-500', bgActive: 'bg-sky-100', textActive: 'text-sky-600', ring: 'ring-sky-300/40' },
  },
  {
    id: 'gear',
    label: 'Gear',
    emoji: '🔧',
    icon: Wrench,
    keywords: ['gear', 'club', 'clubs', 'driver', 'putter', 'iron', 'wedge', 'bag', 'ball', 'balls', 'glove', 'shoes', 'new', 'just got', 'upgrade', 'fitting', 'custom'],
    mediaBoost: ['photo'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-slate-100', text: 'text-slate-500', bgActive: 'bg-slate-200', textActive: 'text-slate-600', ring: 'ring-slate-300/40' },
  },
  {
    id: 'challenge',
    label: 'Challenge',
    emoji: '🏆',
    icon: Flame,
    keywords: ['challenge', 'bet', 'competition', 'contest', 'match', 'vs', 'versus', 'compete'],
    discoverEnabled: true,
    accentColor: { bg: 'bg-orange-50', text: 'text-orange-500', bgActive: 'bg-orange-100', textActive: 'text-orange-600', ring: 'ring-orange-300/40' },
  },

  // ===== MORE TAGS (21 additional categories) =====
  {
    id: 'swing',
    label: 'Swing',
    emoji: '🏌️',
    icon: Circle,
    keywords: ['swing', 'driver', 'iron', 'wedge', 'putter', 'form', 'backswing', 'downswing', 'tempo', 'speed', 'club'],
    mediaBoost: ['video'],
    discoverEnabled: true,
  },
  {
    id: 'hole-in-one',
    label: 'Hole in One',
    emoji: '🎯',
    icon: Zap,
    keywords: ['hole in one', 'hole-in-one', 'hio', 'ace', 'aced it', 'one shot'],
    discoverEnabled: true,
  },
  {
    id: 'funny',
    label: 'Funny',
    emoji: '😂',
    icon: Sparkles,
    keywords: ['funny', 'lol', 'haha', 'hilarious', 'fail', 'oops', 'blooper', 'mishap', 'embarrassing', 'comedy', 'joke', 'laugh'],
    discoverEnabled: true,
  },
  {
    id: 'playing-partners',
    label: 'Playing Partners',
    emoji: '👥',
    icon: Users,
    keywords: ['playing with', 'partners', 'group', 'fourball', 'foursome', 'buddies', 'friends', 'golf buddies'],
    discoverEnabled: true,
  },
  {
    id: 'weather-conditions',
    label: 'Weather & Conditions',
    emoji: '☔',
    icon: Umbrella,
    keywords: ['weather', 'rain', 'wind', 'sunny', 'cold', 'hot', 'conditions', 'wet', 'dry', 'frost', 'snow'],
    discoverEnabled: true,
  },
  {
    id: 'golf-fashion',
    label: 'Golf Fashion',
    emoji: '👕',
    icon: Shirt,
    keywords: ['fashion', 'outfit', 'clothes', 'polo', 'shirt', 'pants', 'shoes', 'hat', 'style', 'wearing'],
    discoverEnabled: true,
  },
  {
    id: 'course-photography',
    label: 'Course Photography',
    emoji: '📸',
    icon: Camera,
    keywords: ['photo', 'photography', 'scenic', 'view', 'landscape', 'beautiful', 'stunning', 'sunrise', 'sunset'],
    mediaBoost: ['photo'],
    discoverEnabled: true,
  },
  {
    id: 'lesson-progress',
    label: 'Lesson & Progress',
    emoji: '🎓',
    icon: GraduationCap,
    keywords: ['lesson', 'progress', 'improvement', 'getting better', 'coach', 'instructor', 'learning'],
    discoverEnabled: true,
  },
  {
    id: 'stats-analysis',
    label: 'Stats & Analysis',
    emoji: '📊',
    icon: TrendingUp,
    keywords: ['stats', 'statistics', 'analysis', 'data', 'strokes gained', 'gir', 'fairways', 'putts', 'handicap'],
    discoverEnabled: true,
  },
  {
    id: 'tee-time',
    label: 'Tee Time',
    emoji: '📅',
    icon: Calendar,
    keywords: ['tee time', 'booking', 'booked', 'reserved', 'scheduled', 'tomorrow', 'weekend'],
    discoverEnabled: true,
  },
  {
    id: 'bucket-list-course',
    label: 'Bucket List Course',
    emoji: '🗺️',
    icon: MapPin,
    keywords: ['bucket list', 'dream course', 'must play', 'finally played', 'on my list'],
    courseBoost: true,
    discoverEnabled: true,
  },
  {
    id: 'quick-tip',
    label: 'Quick Tip',
    emoji: '⚡',
    icon: Lightbulb,
    keywords: ['quick tip', 'pro tip', 'hack', 'shortcut', 'simple', 'easy'],
    discoverEnabled: true,
  },
  {
    id: 'golf-trip',
    label: 'Golf Trip',
    emoji: '⛰️',
    icon: Mountain,
    keywords: ['golf trip', 'getaway', 'vacation', 'boys trip', 'girls trip', 'away day', 'golf holiday'],
    courseBoost: true,
    discoverEnabled: true,
  },
  {
    id: 'personal-best',
    label: 'Personal Best',
    emoji: '🥇',
    icon: Award,
    keywords: ['personal best', 'pb', 'new low', 'best score', 'best round', 'career low', 'broke'],
    discoverEnabled: true,
  },
  {
    id: 'course-favorite',
    label: 'Course Favorite',
    emoji: '❤️',
    icon: Heart,
    keywords: ['favorite course', 'love this course', 'home course', 'best course', 'go-to course'],
    courseBoost: true,
    discoverEnabled: true,
  },
  {
    id: '19th-hole',
    label: '19th Hole',
    emoji: '💬',
    icon: MessageCircle,
    keywords: ['19th hole', 'clubhouse', 'after round', 'drinks', 'food', 'bar', 'restaurant', 'post round'],
    discoverEnabled: true,
  },
  {
    id: 'club-fitting',
    label: 'Club Fitting',
    emoji: '👍',
    icon: ThumbsUp,
    keywords: ['fitting', 'club fitting', 'custom fit', 'fitted', 'new clubs', 'getting fitted'],
    discoverEnabled: true,
  },
  {
    id: 'range-session',
    label: 'Range Session',
    emoji: '😊',
    icon: Smile,
    keywords: ['range', 'driving range', 'hitting balls', 'practice range', 'warm up'],
    discoverEnabled: true,
  },
  {
    id: 'golf-tech',
    label: 'Golf Tech',
    emoji: '🤖',
    icon: Bot,
    keywords: ['tech', 'technology', 'launch monitor', 'trackman', 'gps', 'app', 'gadget', 'device'],
    discoverEnabled: true,
  },
  {
    id: 'etiquette',
    label: 'Etiquette & Rules',
    emoji: '📋',
    icon: BookOpen,
    keywords: ['etiquette', 'rules', 'rule', 'penalty', 'drop', 'proper', 'correct', 'golf rules'],
    discoverEnabled: true,
  },
  {
    id: 'other',
    label: 'Other',
    emoji: '📌',
    icon: MoreHorizontal,
    keywords: [],
    discoverEnabled: false, // Hidden from discovery, only in Create
  },
];

// Core category IDs (first 9 shown in main grid)
export const CORE_CATEGORY_IDS = [
  'tips-coaching',
  'course-vlog',
  'my-round',
  'review',
  'practice',
  'tournament',
  'travel',
  'gear',
  'challenge',
];

// Get categories enabled for Discover filtering
export function getDiscoverCategories(): MomentCategoryDef[] {
  return MOMENT_CATEGORIES.filter(c => c.discoverEnabled);
}

// Get category by ID
export function getCategoryById(id: string): MomentCategoryDef | undefined {
  return MOMENT_CATEGORIES.find(c => c.id === id);
}
