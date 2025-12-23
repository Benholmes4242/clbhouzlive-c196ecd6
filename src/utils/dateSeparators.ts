import { isToday, isYesterday, differenceInDays, startOfWeek, isWithinInterval, subDays } from 'date-fns';

export type DateBucket = 'today' | 'yesterday' | 'earlier-this-week' | 'last-week' | 'older';

export function getDateBucket(date: Date | string): DateBucket {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (isToday(d)) return 'today';
  if (isYesterday(d)) return 'yesterday';

  // Earlier this week: after start of current week but before yesterday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  if (d >= weekStart && !isToday(d) && !isYesterday(d)) {
    return 'earlier-this-week';
  }

  // Last week: within 7-14 days ago
  const lastWeekStart = subDays(weekStart, 7);
  if (isWithinInterval(d, { start: lastWeekStart, end: subDays(weekStart, 1) })) {
    return 'last-week';
  }

  return 'older';
}

export function getDateBucketLabel(bucket: DateBucket): string {
  switch (bucket) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'earlier-this-week':
      return 'This week';
    case 'last-week':
    case 'older':
      return 'Earlier';
  }
}

/**
 * Given an array of items with createdAt, returns indices where separators should be inserted
 */
export function calculateDateSeparators<T extends { createdAt: string }>(
  items: T[]
): Map<number, DateBucket> {
  const separators = new Map<number, DateBucket>();
  let lastBucket: DateBucket | null = null;

  items.forEach((item, index) => {
    const bucket = getDateBucket(item.createdAt);
    if (bucket !== lastBucket) {
      separators.set(index, bucket);
      lastBucket = bucket;
    }
  });

  return separators;
}
