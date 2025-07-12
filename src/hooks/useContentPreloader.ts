import { useEffect, useRef, useCallback } from 'react';

interface PreloadableContent {
  id: string;
  type: 'image' | 'video';
  url: string;
  priority?: 'high' | 'low';
}

interface UseContentPreloaderOptions {
  preloadDistance?: number; // How many items ahead to preload
  enabled?: boolean;
  onPreloadComplete?: (id: string) => void;
  onPreloadError?: (id: string, error: Error) => void;
}

export const useContentPreloader = ({
  preloadDistance = 3,
  enabled = true,
  onPreloadComplete,
  onPreloadError,
}: UseContentPreloaderOptions = {}) => {
  const preloadCache = useRef<Map<string, Promise<void>>>(new Map());
  const preloadedItems = useRef<Set<string>>(new Set());

  // Preload a single media item
  const preloadMediaItem = useCallback(async (item: PreloadableContent): Promise<void> => {
    if (!enabled || preloadedItems.current.has(item.id)) {
      return;
    }

    // Check if already preloading
    const existingPromise = preloadCache.current.get(item.id);
    if (existingPromise) {
      return existingPromise;
    }

    const preloadPromise = new Promise<void>((resolve, reject) => {
      if (item.type === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          preloadedItems.current.add(item.id);
          onPreloadComplete?.(item.id);
          resolve();
        };
        
        img.onerror = (error) => {
          const err = new Error(`Failed to preload image: ${item.url}`);
          onPreloadError?.(item.id, err);
          reject(err);
        };
        
        img.src = item.url;
      } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata'; // Load metadata and some data
        video.muted = true;
        
        const handleCanPlay = () => {
          preloadedItems.current.add(item.id);
          onPreloadComplete?.(item.id);
          cleanup();
          resolve();
        };
        
        const handleError = () => {
          const err = new Error(`Failed to preload video: ${item.url}`);
          onPreloadError?.(item.id, err);
          cleanup();
          reject(err);
        };
        
        const cleanup = () => {
          video.removeEventListener('canplaythrough', handleCanPlay);
          video.removeEventListener('error', handleError);
          video.remove();
        };
        
        video.addEventListener('canplaythrough', handleCanPlay);
        video.addEventListener('error', handleError);
        video.src = item.url;
      }
    });

    preloadCache.current.set(item.id, preloadPromise);
    return preloadPromise;
  }, [enabled, onPreloadComplete, onPreloadError]);

  // Preload multiple items with priority
  const preloadItems = useCallback(async (items: PreloadableContent[]) => {
    if (!enabled || items.length === 0) return;

    // Sort by priority - high priority first
    const sortedItems = items.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return 0;
    });

    // Preload items with controlled concurrency
    const CONCURRENT_PRELOADS = 3;
    const chunks = [];
    
    for (let i = 0; i < sortedItems.length; i += CONCURRENT_PRELOADS) {
      chunks.push(sortedItems.slice(i, i + CONCURRENT_PRELOADS));
    }

    // Process chunks sequentially, items within chunk concurrently
    for (const chunk of chunks) {
      try {
        await Promise.allSettled(
          chunk.map(item => preloadMediaItem(item))
        );
      } catch (error) {
        console.warn('Error in preload chunk:', error);
      }
    }
  }, [enabled, preloadMediaItem]);

  // Preload content based on current position and upcoming items
  const preloadAhead = useCallback((
    currentIndex: number, 
    allContent: PreloadableContent[]
  ) => {
    const startIndex = Math.max(0, currentIndex);
    const endIndex = Math.min(allContent.length, currentIndex + preloadDistance + 1);
    const itemsToPreload = allContent.slice(startIndex, endIndex);

    // Mark current and next item as high priority
    const prioritizedItems = itemsToPreload.map((item, index) => ({
      ...item,
      priority: index <= 1 ? 'high' as const : 'low' as const
    }));

    preloadItems(prioritizedItems);
  }, [preloadDistance, preloadItems]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      preloadCache.current.clear();
      preloadedItems.current.clear();
    };
  }, []);

  return {
    preloadAhead,
    preloadItems,
    preloadMediaItem,
    isPreloaded: (id: string) => preloadedItems.current.has(id),
    clearCache: () => {
      preloadCache.current.clear();
      preloadedItems.current.clear();
    }
  };
};