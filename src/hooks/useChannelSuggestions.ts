import { useState, useCallback, useEffect } from 'react';

export interface ChannelSuggestion {
  id: string;
  title: string;
  cover: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
  subscriberCount?: number;
  videoCount?: number;
}

// Mock data for channel suggestions - replace with real API call
const MOCK_SUGGESTIONS: ChannelSuggestion[] = [
  {
    id: 'ch_1',
    title: 'Pro Golf Tips',
    handle: '@progolftips',
    cover: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    verified: true,
    subscriberCount: 125000,
    videoCount: 342,
  },
  {
    id: 'ch_2',
    title: 'Golf Course Reviews',
    handle: '@coursereviews',
    cover: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    verified: false,
    subscriberCount: 48000,
    videoCount: 156,
  },
  {
    id: 'ch_3',
    title: 'The Swing Lab',
    handle: '@swinglab',
    cover: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    verified: true,
    subscriberCount: 89000,
    videoCount: 234,
  },
  {
    id: 'ch_4',
    title: 'Golf Fitness Academy',
    handle: '@golffitnessacademy',
    cover: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    verified: true,
    subscriberCount: 210000,
    videoCount: 489,
  },
  {
    id: 'ch_5',
    title: 'Short Game Mastery',
    handle: '@shortgamemaster',
    cover: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    verified: false,
    subscriberCount: 67000,
    videoCount: 178,
  },
];

export function useChannelSuggestions() {
  const [pool, setPool] = useState<ChannelSuggestion[]>([]);
  const [isRefilling, setIsRefilling] = useState(false);

  const refill = useCallback(async () => {
    if (isRefilling) return;
    
    setIsRefilling(true);
    try {
      // TODO: Replace with real API call
      // const res = await fetch('/api/discover/channel-suggestions?limit=10');
      // const data = await res.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use mock data for now
      const shuffled = [...MOCK_SUGGESTIONS].sort(() => Math.random() - 0.5);
      setPool(prev => [...prev, ...shuffled.slice(0, 3)]);
    } catch (error) {
      console.error('Failed to fetch channel suggestions:', error);
    } finally {
      setIsRefilling(false);
    }
  }, [isRefilling]);

  // Initial load
  useEffect(() => {
    if (pool.length === 0) {
      void refill();
    }
  }, [pool.length, refill]);

  // Auto-refill when running low
  useEffect(() => {
    if (pool.length < 3 && !isRefilling) {
      void refill();
    }
  }, [pool.length, isRefilling, refill]);

  const next = useCallback((avoidIds: Set<string>): ChannelSuggestion | null => {
    const idx = pool.findIndex(s => !avoidIds.has(s.id));
    if (idx === -1) return null;
    
    const [pick] = pool.splice(idx, 1);
    setPool([...pool]); // Trigger state update
    
    // Trigger refill if running low
    if (pool.length < 3) {
      void refill();
    }
    
    return pick;
  }, [pool, refill]);

  return { next };
}
