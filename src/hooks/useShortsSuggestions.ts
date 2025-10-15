import { useState, useRef, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

const POOL_SIZE = 16;
const RECENT_HISTORY_SIZE = 20;
const REFILL_THRESHOLD = 6;

/**
 * Hook to manage a pool of shorts suggestions
 * Returns a next() function to get the next available short
 */
export function useShortsSuggestions() {
  const poolRef = useRef<ExploreContentItem[]>([]);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const allSuggestionsRef = useRef<ExploreContentItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Mock shorts data - replace with real API call
  const MOCK_SHORTS: ExploreContentItem[] = [
    {
      id: 'short_1',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Perfect swing in slow motion 🏌️',
      likes: 12500,
      duration: '0:15',
      durationSeconds: 15,
      user: {
        id: 'user_1',
        name: 'Golf Pro Tips',
        username: 'golftips',
        avatar: '/placeholder.svg',
        verified: true
      }
    },
    {
      id: 'short_2',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Crazy chip shot from the bunker! 🔥',
      likes: 8900,
      duration: '0:12',
      durationSeconds: 12,
      user: {
        id: 'user_2',
        name: 'Short Game Master',
        username: 'shortgameking',
        avatar: '/placeholder.svg'
      }
    },
    {
      id: 'short_3',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Driver swing secrets revealed',
      likes: 15200,
      duration: '0:18',
      durationSeconds: 18,
      user: {
        id: 'user_3',
        name: 'Max Distance',
        username: 'maxdistance',
        avatar: '/placeholder.svg',
        verified: true
      }
    },
    {
      id: 'short_4',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Putting drill that changed my game',
      likes: 6700,
      duration: '0:20',
      durationSeconds: 20,
      user: {
        id: 'user_4',
        name: 'Putting Pro',
        username: 'puttingpro',
        avatar: '/placeholder.svg'
      }
    },
    {
      id: 'short_5',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Albatross on a par 5! 🦅',
      likes: 22100,
      duration: '0:14',
      durationSeconds: 14,
      user: {
        id: 'user_5',
        name: 'Pro Highlights',
        username: 'prohighlights',
        avatar: '/placeholder.svg',
        verified: true
      }
    },
    {
      id: 'short_6',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'How to fix your slice forever',
      likes: 9400,
      duration: '0:16',
      durationSeconds: 16,
      user: {
        id: 'user_6',
        name: 'Fix Your Game',
        username: 'fixyourgame',
        avatar: '/placeholder.svg'
      }
    },
    {
      id: 'short_7',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Best golf courses in the world 🌍',
      likes: 11800,
      duration: '0:19',
      durationSeconds: 19,
      user: {
        id: 'user_7',
        name: 'Course Reviews',
        username: 'coursereviews',
        avatar: '/placeholder.svg'
      }
    },
    {
      id: 'short_8',
      type: 'video',
      src: '/placeholder.svg',
      thumbnailSrc: '/placeholder.svg',
      title: 'Iron shot technique breakdown',
      likes: 7300,
      duration: '0:17',
      durationSeconds: 17,
      user: {
        id: 'user_8',
        name: 'Iron Play',
        username: 'ironplay',
        avatar: '/placeholder.svg'
      }
    }
  ];

  const refillPool = useCallback(() => {
    // Get available suggestions that aren't in recent history
    const available = MOCK_SHORTS.filter(s => !recentIdsRef.current.has(s.id));
    
    // If we've exhausted all suggestions, reset the recent history
    if (available.length === 0) {
      recentIdsRef.current.clear();
      poolRef.current = [...MOCK_SHORTS];
      return;
    }
    
    // Shuffle and add to pool
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, POOL_SIZE - poolRef.current.length);
    poolRef.current.push(...toAdd);
  }, []);

  const next = useCallback((avoidIds: Set<string> = new Set()): ExploreContentItem | null => {
    // Refill if running low
    if (poolRef.current.length < REFILL_THRESHOLD) {
      refillPool();
    }
    
    // Find first item not in avoid list
    const index = poolRef.current.findIndex(item => !avoidIds.has(item.id));
    if (index === -1) return null;
    
    // Remove and return the item
    const [item] = poolRef.current.splice(index, 1);
    
    // Add to recent history
    recentIdsRef.current.add(item.id);
    
    // Keep recent history at max size
    if (recentIdsRef.current.size > RECENT_HISTORY_SIZE) {
      const arr = Array.from(recentIdsRef.current);
      recentIdsRef.current = new Set(arr.slice(-RECENT_HISTORY_SIZE));
    }
    
    return item;
  }, [refillPool]);

  // Initialize pool on mount
  useEffect(() => {
    if (!initialized) {
      allSuggestionsRef.current = [...MOCK_SHORTS];
      refillPool();
      setInitialized(true);
    }
  }, [initialized, refillPool]);

  return { next };
}
