/**
 * useUserFollows - Personalization layer for My Golf
 * Manages user's followed players, tours, and events
 */

import { useState, useCallback, useEffect } from 'react';
import type { UserFollows, TourLens } from '../types';

const STORAGE_KEY = 'golf-universe-follows';

export function useUserFollows() {
  const [follows, setFollows] = useState<UserFollows>({
    players: [],
    tours: [],
    events: [],
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFollows(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load follows from storage:', e);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
    } catch (e) {
      console.warn('Failed to save follows to storage:', e);
    }
  }, [follows]);

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

  const isFollowingPlayer = useCallback((playerId: string) => {
    return follows.players.includes(playerId);
  }, [follows.players]);

  const isFollowingTour = useCallback((tour: TourLens) => {
    return follows.tours.includes(tour);
  }, [follows.tours]);

  const isFollowingEvent = useCallback((eventId: string) => {
    return follows.events.includes(eventId);
  }, [follows.events]);

  return {
    follows,
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
    hasFollows: follows.players.length > 0 || follows.tours.length > 0 || follows.events.length > 0,
  };
}
