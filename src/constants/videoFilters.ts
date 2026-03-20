// Video filter constants for Discover Videos tab

export interface DurationFilter {
  key: string;
  label: string;
  from: number;
  to: number | null;
}

export interface TopicFilter {
  key: string;
  label: string;
}

export const DURATION_FILTERS: DurationFilter[] = [
  { key: 'all', label: 'All', from: 180, to: null },
  { key: 'shorts', label: 'Shorts', from: 0, to: 180 },
  { key: 'under4', label: 'Under 4 mins', from: 180, to: 239 },
  { key: '4to20', label: '4–20 mins', from: 240, to: 1200 },
  { key: 'over20', label: 'Over 20 mins', from: 1201, to: null },
];

export const TOPIC_FILTERS: TopicFilter[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'lessons', label: 'Lessons' },
  { key: 'funny', label: 'Funny' },
  { key: 'protips', label: 'Pro Tips' },
];

export function getDurationFilter(key: string): DurationFilter {
  return DURATION_FILTERS.find(f => f.key === key) || DURATION_FILTERS[0];
}

export function parseTopics(topicsParam: string | null): string[] {
  if (!topicsParam) return [];
  return topicsParam.split(',').filter(Boolean);
}

export function stringifyTopics(topics: string[]): string {
  return topics.join(',');
}
