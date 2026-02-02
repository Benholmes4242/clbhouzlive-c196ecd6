export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';

export const RANDOM_AUDIO_TRACKS = [
  { title: "Eye of the Tiger", artist: "Survivor" },
  { title: "The Final Countdown", artist: "Europe" },
  { title: "We Will Rock You", artist: "Queen" },
  { title: "Born to Be Wild", artist: "Steppenwolf" },
  { title: "Thunderstruck", artist: "AC/DC" },
  { title: "Original Audio", isOriginal: true },
  { title: "Golf Swing Audio", isOriginal: true },
  { title: "Course Ambience", isOriginal: true }
] as const;

export const RANDOM_LABELS = ['Pro Tip', 'Trending', 'Featured'] as const;

export const DEFAULT_FETCH_LIMIT = 20;
export const CLUBHOUSE_FETCH_MULTIPLIER = 3;
export const MAX_FETCH_ITERATIONS = 5;
export const CLUBHOUSE_PAGE_SIZE = 60;

// Duration thresholds
export const SHORTS_MAX_DURATION = 180; // 3 minutes
export const CLUBHOUSE_MAX_DURATION = 120; // 2 minutes
