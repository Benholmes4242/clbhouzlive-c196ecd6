import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Display labels for each category ID
const CATEGORY_LABELS: Record<string, string> = {
  'practice':      'Practice',
  'review':        'Reviews',
  'funny':         'Funny 😂',
  'my-round':      'Rounds',
  'tips-coaching':  'Tips',
  'course-vlog':   'Course Vlogs',
  'hole-out':      'Hole Outs',
  'hole-in-one':   'Hole in Ones',
  'travel':        'Golf Trips',
  'swing':         'Swings',
  'tournament':    'Tournament',
  'gear':          'Gear',
};

const MIN_POSTS = 5;
const MAX_CHIPS = 8;

export interface CategoryChip {
  id: string;
  label: string;
  postCount: number;
}

export function useWatchCategoryChips() {
  return useQuery({
    queryKey: ['watch-category-chips'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_category_counts');

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useWatchCategoryChips] RPC error:', error);
        }
        return [];
      }

      if (!data || data.length === 0) return [];

      return (data as { category: string; post_count: number }[])
        .filter(row =>
          row.post_count >= MIN_POSTS &&
          CATEGORY_LABELS[row.category] !== undefined
        )
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, MAX_CHIPS)
        .map(row => ({
          id: row.category,
          label: CATEGORY_LABELS[row.category],
          postCount: row.post_count,
        }));
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
