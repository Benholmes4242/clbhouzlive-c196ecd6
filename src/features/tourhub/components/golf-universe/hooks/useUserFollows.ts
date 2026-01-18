/**
 * useUserFollows - Personalization layer for My Golf
 * Manages user's followed players, tours, and events
 * 
 * Abstracted storage via adapter pattern for future Supabase migration
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { UserFollows, TourLens } from '../types';

// Storage adapter interface - easy to swap for Supabase later
interface StorageProvider {
  get(key: string): Promise<UserFollows | null>;
  set(key: string, value: UserFollows): Promise<void>;
}

// LocalStorage adapter (default for v1)
const localStorageAdapter: StorageProvider = {
  async get(key: string): Promise<UserFollows | null> {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  },
  async set(key: string, value: UserFollows): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },
};

const STORAGE_KEY = 'golf-universe-follows';
const DEFAULT_FOLLOWS: UserFollows = {
  players: [],
  tours: [],
  events: [],
};

export function useUserFollows(storageProvider: StorageProvider = localStorageAdapter) {
  const [follows, setFollows] = useState<UserFollows>(DEFAULT_FOLLOWS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    let mounted = true;
    storageProvider.get(STORAGE_KEY).then((stored) => {
      if (mounted && stored) {
        setFollows(stored);
      }
      setIsLoaded(true);
    });
    return () => { mounted = false; };
  }, [storageProvider]);

  // Save to storage on change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      storageProvider.set(STORAGE_KEY, follows);
    }
  }, [follows, isLoaded, storageProvider]);

  // Player follows
  const followPlayer = useCallback((playerId: string) => {
    setFollows(prev => ({
      ...prev,
      players: prev.players.includes(playerId) 
        ? prev.players 
        : [...prev.players, playerId],
    }));
  }, []);

  const unfollowPlayer = useCallback((playerId: string) => {
    setFollows(prev => ({
      ...prev,
      players: prev.players.filter(id => id !== playerId),
    }));
  }, []);

  const togglePlayerFollow = useCallback((playerId: string) => {
    setFollows(prev => ({
      ...prev,
      players: prev.players.includes(playerId)
        ? prev.players.filter(id => id !== playerId)
        : [...prev.players, playerId],
    }));
  }, []);

  // Tour follows
  const followTour = useCallback((tour: TourLens) => {
    setFollows(prev => ({
      ...prev,
      tours: prev.tours.includes(tour) 
        ? prev.tours 
        : [...prev.tours, tour],
    }));
  }, []);

  const unfollowTour = useCallback((tour: TourLens) => {
    setFollows(prev => ({
      ...prev,
      tours: prev.tours.filter(t => t !== tour),
    }));
  }, []);

  // Event follows
  const followEvent = useCallback((eventId: string) => {
    setFollows(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events
        : [...prev.events, eventId],
    }));
  }, []);

  const unfollowEvent = useCallback((eventId: string) => {
    setFollows(prev => ({
      ...prev,
      events: prev.events.filter(id => id !== eventId),
    }));
  }, []);

  // Check helpers
  const isFollowingPlayer = useCallback((playerId: string) => {
    return follows.players.includes(playerId);
  }, [follows.players]);

  const isFollowingTour = useCallback((tour: TourLens) => {
    return follows.tours.includes(tour);
  }, [follows.tours]);

  const isFollowingEvent = useCallback((eventId: string) => {
    return follows.events.includes(eventId);
  }, [follows.events]);

  const hasFollows = useMemo(() => 
    follows.players.length > 0 || follows.tours.length > 0 || follows.events.length > 0,
    [follows]
  );

  return {
    follows,
    isLoaded,
    followPlayer,
    unfollowPlayer,
    togglePlayerFollow,
    followTour,
    unfollowTour,
    followEvent,
    unfollowEvent,
    isFollowingPlayer,
    isFollowingTour,
    isFollowingEvent,
    hasFollows,
  };
}

// Export adapter for future Supabase integration
export { localStorageAdapter };
export type { StorageProvider };
