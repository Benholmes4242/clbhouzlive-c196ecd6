import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'video_queue';

/**
 * useVideoQueue - Manages a queue of videos for continuous playback
 * - Persists in sessionStorage (survives modal navigation, clears on tab close)
 * - queue: array of video IDs
 * - playNext: inserts video at front of queue
 * - enqueue: appends video to end of queue
 * - popNext: removes and returns next video from queue
 * - setQueueFromRelated: initializes queue from related videos (excludes current)
 */
export function useVideoQueue() {
  const [queue, setQueue] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist queue to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore storage errors
    }
  }, [queue]);

  // Insert video at front of queue (plays after current video)
  const playNext = useCallback((videoId: string) => {
    setQueue((prev) => {
      // Remove if already in queue to avoid duplicates
      const filtered = prev.filter((id) => id !== videoId);
      return [videoId, ...filtered];
    });
  }, []);

  // Append video to end of queue
  const enqueue = useCallback((videoId: string) => {
    setQueue((prev) => {
      // Don't add if already in queue
      if (prev.includes(videoId)) return prev;
      return [...prev, videoId];
    });
  }, []);

  // Remove and return the next video ID from queue
  const popNext = useCallback((): string | null => {
    let nextId: string | null = null;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      nextId = prev[0];
      return prev.slice(1);
    });
    return nextId;
  }, []);

  // Peek at next video without removing
  const peekNext = useCallback((): string | null => {
    return queue.length > 0 ? queue[0] : null;
  }, [queue]);

  // Initialize queue from related videos (excludes current video)
  const setQueueFromRelated = useCallback((relatedIds: string[], currentVideoId?: string) => {
    setQueue(relatedIds.filter((id) => id !== currentVideoId));
  }, []);

  // Remove a specific video from queue
  const removeFromQueue = useCallback((videoId: string) => {
    setQueue((prev) => prev.filter((id) => id !== videoId));
  }, []);

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    playNext,
    enqueue,
    popNext,
    peekNext,
    setQueueFromRelated,
    removeFromQueue,
    clearQueue,
    queueLength: queue.length,
  };
}
