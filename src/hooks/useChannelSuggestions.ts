import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChannelSuggestion {
  id: string;
  title: string;
  handle: string;
  cover: string;
  avatar: string;
  subscriberCount: number;
  isSubscribed?: boolean;
}

// Mock suggestions pool - in production, fetch from API
const MOCK_SUGGESTIONS: ChannelSuggestion[] = [
  {
    id: 'sugg-1',
    title: 'Pro Golf Tips',
    handle: '@progolftips',
    cover: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&q=80',
    subscriberCount: 125000,
    isSubscribed: false
  },
  {
    id: 'sugg-2',
    title: 'Golf Course Vlogs',
    handle: '@golfcoursevibes',
    cover: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=200&q=80',
    subscriberCount: 89000,
    isSubscribed: false
  },
  {
    id: 'sugg-3',
    title: 'Short Game Mastery',
    handle: '@shortgamemaster',
    cover: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=200&q=80',
    subscriberCount: 210000,
    isSubscribed: false
  },
  {
    id: 'sugg-4',
    title: 'Golf Swing Analysis',
    handle: '@swinganalysis',
    cover: 'https://images.unsplash.com/photo-1596727147705-62a6c2e828d5?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1596727147705-62a6c2e828d5?w=200&q=80',
    subscriberCount: 156000,
    isSubscribed: false
  },
  {
    id: 'sugg-5',
    title: 'Golf Equipment Reviews',
    handle: '@golfgearreview',
    cover: 'https://images.unsplash.com/photo-1530028828-25e8270e8866?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1530028828-25e8270e8866?w=200&q=80',
    subscriberCount: 98000,
    isSubscribed: false
  },
  {
    id: 'sugg-6',
    title: 'Junior Golf Academy',
    handle: '@juniorgolfacad',
    cover: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&q=80',
    subscriberCount: 67000,
    isSubscribed: false
  },
  {
    id: 'sugg-7',
    title: 'Golf Travel Adventures',
    handle: '@golftraveladv',
    cover: 'https://images.unsplash.com/photo-1587174489496-cc0df13e568d?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1587174489496-cc0df13e568d?w=200&q=80',
    subscriberCount: 143000,
    isSubscribed: false
  },
  {
    id: 'sugg-8',
    title: 'Golf Fitness Training',
    handle: '@golffitness',
    cover: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=200&q=80',
    subscriberCount: 102000,
    isSubscribed: false
  }
];

const POOL_REFILL_THRESHOLD = 3;
const RECENT_SET_SIZE = 20;

export function useChannelSuggestions() {
  const [pool, setPool] = useState<ChannelSuggestion[]>([]);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const allSuggestionsRef = useRef<ChannelSuggestion[]>([...MOCK_SUGGESTIONS]);

  // Refill the pool with fresh suggestions
  const refillPool = useCallback(() => {
    const available = allSuggestionsRef.current.filter(
      s => !recentIdsRef.current.has(s.id)
    );

    // If we've exhausted all suggestions, reset the recent set (keep last 5)
    if (available.length === 0) {
      const recentArray = Array.from(recentIdsRef.current);
      recentIdsRef.current = new Set(recentArray.slice(-5));
      return refillPool();
    }

    // Shuffle and take up to 10 suggestions
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const newSuggestions = shuffled.slice(0, 10);
    
    setPool(prev => [...prev, ...newSuggestions]);
  }, []);

  // Get the next suggestion
  const next = useCallback((): ChannelSuggestion | null => {
    // Refill if pool is low
    if (pool.length < POOL_REFILL_THRESHOLD) {
      refillPool();
    }

    // Get next suggestion from pool
    if (pool.length === 0) return null;

    const suggestion = pool[0];
    setPool(prev => prev.slice(1));

    // Add to recent set
    recentIdsRef.current.add(suggestion.id);
    
    // Keep recent set size bounded
    if (recentIdsRef.current.size > RECENT_SET_SIZE) {
      const recentArray = Array.from(recentIdsRef.current);
      recentIdsRef.current = new Set(recentArray.slice(-RECENT_SET_SIZE));
    }

    return suggestion;
  }, [pool, refillPool]);

  // Initialize pool on first call
  useEffect(() => {
    if (pool.length === 0) {
      refillPool();
    }
  }, [pool.length, refillPool]);

  return { next };
}
