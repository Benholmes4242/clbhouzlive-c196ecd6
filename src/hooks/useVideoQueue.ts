import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { markQueueUsed } from './useDiscoverySignals';

const QUEUE_KEY = 'video_queue';
const META_KEY = 'video_queue_meta';

export interface QueueItemMeta {
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  durationSeconds?: number;
}

/**
 * useVideoQueue - Manages a queue of videos for continuous playback
 * - Persists in sessionStorage (survives modal navigation, clears on tab close)
 * - queue: array of video IDs
 * - queueMeta: metadata for each video (title, thumbnail, etc.)
 * - playNext: inserts video at front of queue
 * - enqueue: appends video to end of queue
 * - popNext: removes next video from queue (use peekNext first)
 * - setQueueFromRelated: initializes queue from related videos (excludes current)
 */
export function useVideoQueue() {
  const [queue, setQueue] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(QUEUE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // 6B-4: Stricter validation - ensure array of strings
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  const [queueMeta, setQueueMeta] = useState<Record<string, QueueItemMeta>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = sessionStorage.getItem(META_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      // 6B-4: Stricter validation - ensure plain object
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  // Persist queue to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore storage errors
    }
  }, [queue]);

  // Persist queue meta to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(META_KEY, JSON.stringify(queueMeta));
    } catch {
      // Ignore storage errors
    }
  }, [queueMeta]);

  // Insert video at front of queue (plays after current video)
  const playNext = useCallback((videoId: string, meta?: QueueItemMeta) => {
    setQueue((prev) => {
      const filtered = prev.filter((id) => id !== videoId);
      return [videoId, ...filtered];
    });
    if (meta) {
      setQueueMeta((prev) => ({ ...prev, [videoId]: meta }));
    }
    markQueueUsed(); // Track for discovery signals
    toast.success('Playing next');
  }, []);

  // Append video to end of queue
  const enqueue = useCallback((videoId: string, meta?: QueueItemMeta) => {
    setQueue((prev) => {
      if (prev.includes(videoId)) {
        toast.info('Already in queue');
        return prev;
      }
      return [...prev, videoId];
    });
    if (meta) {
      setQueueMeta((prev) => ({ ...prev, [videoId]: meta }));
    }
    markQueueUsed(); // Track for discovery signals
    toast.success('Added to queue');
  }, []);

  // Remove the next video from queue (optionally with expected id for safety)
  const popNext = useCallback((expectedId?: string) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      if (expectedId && prev[0] !== expectedId) return prev; // Safety: don't pop wrong item
      return prev.slice(1);
    });
    // Also clean up meta for popped item
    if (expectedId) {
      setQueueMeta((prev) => {
        const copy = { ...prev };
        delete copy[expectedId];
        return copy;
      });
    }
  }, []);

  // Play now: removes item from queue and returns it (caller handles navigation)
  const playNow = useCallback((videoId: string) => {
    setQueue((prev) => prev.filter((id) => id !== videoId));
  }, []);

  // Peek at next video without removing
  const peekNext = useCallback((): string | null => {
    return queue.length > 0 ? queue[0] : null;
  }, [queue]);

  // Get metadata for a video ID
  const getMeta = useCallback((videoId: string): QueueItemMeta | null => {
    return queueMeta[videoId] || null;
  }, [queueMeta]);

  // Initialize queue from related videos (excludes current video)
  // Only call this when queue is empty to avoid overwriting user additions
  const setQueueFromRelated = useCallback((
    relatedIds: string[], 
    currentVideoId?: string,
    metaMap?: Record<string, QueueItemMeta>
  ) => {
    setQueue(relatedIds.filter((id) => id !== currentVideoId));
    if (metaMap) {
      setQueueMeta((prev) => ({ ...prev, ...metaMap }));
    }
  }, []);

  // Remove a specific video from queue
  const removeFromQueue = useCallback((videoId: string) => {
    setQueue((prev) => prev.filter((id) => id !== videoId));
  }, []);

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueMeta({});
  }, []);

  // Move queue item from one index to another (for drag reorder)
  const moveQueueItem = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      if (fromIndex === toIndex) return prev;
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  // Update meta for a video (useful when fetching details)
  const updateMeta = useCallback((videoId: string, meta: QueueItemMeta) => {
    setQueueMeta((prev) => ({ ...prev, [videoId]: meta }));
  }, []);

  return {
    queue,
    queueMeta,
    playNext,
    enqueue,
    popNext,
    peekNext,
    getMeta,
    setQueueFromRelated,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    updateMeta,
    playNow,
    queueLength: queue.length,
  };
}
