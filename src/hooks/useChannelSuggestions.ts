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

// Use the same mock creators from channels.mock.ts
const MOCK_CREATORS = [
  { id: 'c1', name: 'Golf with Aimee', avatar: '/images/mocks/avatars/avatar-01.png', verified: true, handle: '@golfwithaimee', subscribers: 245000 },
  { id: 'c2', name: 'Rick Shiels Golf', avatar: '/images/mocks/avatars/avatar-02.png', verified: true, handle: '@rickshielsgolf', subscribers: 312000 },
  { id: 'c3', name: 'Peter Finch Golf', avatar: '/images/mocks/avatars/avatar-03.png', verified: true, handle: '@peterfinchgolf', subscribers: 189000 },
  { id: 'c4', name: 'Mark Crossfield', avatar: '/images/mocks/avatars/avatar-04.png', verified: false, handle: '@markcrossfield', subscribers: 156000 },
  { id: 'c5', name: 'Good Good Golf', avatar: '/images/mocks/avatars/avatar-05.png', verified: true, handle: '@goodgoodgolf', subscribers: 428000 },
  { id: 'c6', name: 'Me And My Golf', avatar: '/images/mocks/avatars/avatar-06.png', verified: true, handle: '@meandmygolf', subscribers: 267000 },
  { id: 'c7', name: 'Golfholics', avatar: '/images/mocks/avatars/avatar-07.png', verified: false, handle: '@golfholics', subscribers: 98000 },
  { id: 'c8', name: 'The Golf Mates', avatar: '/images/mocks/avatars/avatar-08.png', verified: false, handle: '@thegolfmates', subscribers: 134000 },
];

const banners = Array.from({ length: 6 }).map((_, i) => `/images/mocks/channels/banners/banner-0${i+1}.jpg`);

// Convert mock creators to channel suggestions format
const MOCK_SUGGESTIONS: ChannelSuggestion[] = MOCK_CREATORS.map((creator, i) => ({
  id: creator.id,
  title: creator.name,
  handle: creator.handle,
  cover: banners[i % banners.length],
  avatar: creator.avatar,
  subscriberCount: creator.subscribers,
  isSubscribed: false
}));

const POOL_REFILL_THRESHOLD = 3;
const RECENT_SET_SIZE = 20;

export function useChannelSuggestions() {
  const poolRef = useRef<ChannelSuggestion[]>([]);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const allSuggestionsRef = useRef<ChannelSuggestion[]>([...MOCK_SUGGESTIONS]);
  const [initialized, setInitialized] = useState(false);

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
    
    poolRef.current = [...poolRef.current, ...newSuggestions];
  }, []);

  // Get the next suggestion - stable function that doesn't depend on state
  const next = useCallback((): ChannelSuggestion | null => {
    // Refill if pool is low
    if (poolRef.current.length < POOL_REFILL_THRESHOLD) {
      refillPool();
    }

    // Get next suggestion from pool
    if (poolRef.current.length === 0) return null;

    const suggestion = poolRef.current[0];
    poolRef.current = poolRef.current.slice(1);

    // Add to recent set
    recentIdsRef.current.add(suggestion.id);
    
    // Keep recent set size bounded
    if (recentIdsRef.current.size > RECENT_SET_SIZE) {
      const recentArray = Array.from(recentIdsRef.current);
      recentIdsRef.current = new Set(recentArray.slice(-RECENT_SET_SIZE));
    }

    return suggestion;
  }, [refillPool]);

  // Initialize pool once
  useEffect(() => {
    if (!initialized) {
      refillPool();
      setInitialized(true);
    }
  }, [initialized, refillPool]);

  return { next };
}
