import { useState, useRef, useCallback, useEffect } from 'react';

interface MediaItem {
  id: string;
  url: string;
  type: 'video' | 'image';
  loaded: boolean;
  element?: HTMLElement;
}

// Global media registry to track loaded media across components
class MediaRenderingManager {
  private loadedMedia: Map<string, MediaItem> = new Map();
  private listeners: Set<(id: string, loaded: boolean) => void> = new Set();

  // Generate stable ID for media based on URL and type
  private generateMediaId(url: string, type: 'video' | 'image'): string {
    return `${type}-${btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
  }

  // Register media for tracking
  registerMedia(url: string, type: 'video' | 'image'): string {
    const id = this.generateMediaId(url, type);
    
    if (!this.loadedMedia.has(id)) {
      this.loadedMedia.set(id, {
        id,
        url,
        type,
        loaded: false
      });
    }
    
    return id;
  }

  // Mark media as loaded
  markAsLoaded(id: string, element?: HTMLElement) {
    const media = this.loadedMedia.get(id);
    if (media && !media.loaded) {
      media.loaded = true;
      media.element = element;
      this.notifyListeners(id, true);
    }
  }

  // Check if media is already loaded
  isLoaded(id: string): boolean {
    return this.loadedMedia.get(id)?.loaded || false;
  }

  // Subscribe to loading state changes
  subscribe(callback: (id: string, loaded: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(id: string, loaded: boolean) {
    this.listeners.forEach(callback => callback(id, loaded));
  }

  // Get media info
  getMedia(id: string): MediaItem | undefined {
    return this.loadedMedia.get(id);
  }

  // Cleanup media that's no longer needed
  cleanup(id: string) {
    this.loadedMedia.delete(id);
  }
}

// Global instance
const globalMediaManager = new MediaRenderingManager();

// Hook for stable media rendering
export const useStableMediaRenderer = (url: string, type: 'video' | 'image') => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mediaId] = useState(() => globalMediaManager.registerMedia(url, type));
  const elementRef = useRef<HTMLElement>(null);
  const hasInitialized = useRef(false);

  // Check if already loaded on mount
  useEffect(() => {
    const alreadyLoaded = globalMediaManager.isLoaded(mediaId);
    if (alreadyLoaded) {
      setIsLoaded(true);
      hasInitialized.current = true;
    }
  }, [mediaId]);

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = globalMediaManager.subscribe((id, loaded) => {
      if (id === mediaId) {
        setIsLoaded(loaded);
      }
    });

    return unsubscribe;
  }, [mediaId]);

  // Mark as loaded callback
  const markAsLoaded = useCallback(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      globalMediaManager.markAsLoaded(mediaId, elementRef.current || undefined);
    }
  }, [mediaId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if this was the last instance using this media
      // In practice, we'll keep loaded media in cache for performance
    };
  }, [mediaId]);

  return {
    mediaId,
    isLoaded,
    elementRef,
    markAsLoaded,
    // Prevent re-rendering if already loaded
    shouldRender: !isLoaded || !hasInitialized.current
  };
};

// Hook specifically for video elements
export const useStableVideoRenderer = (src: string) => {
  const { mediaId, isLoaded, elementRef, markAsLoaded, shouldRender } = useStableMediaRenderer(src, 'video');
  
  const handleVideoLoadStart = useCallback(() => {
    // Video started loading
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    markAsLoaded();
  }, [markAsLoaded]);

  const handleVideoError = useCallback(() => {
    // Handle video error - still mark as "loaded" to prevent retries
    markAsLoaded();
  }, [markAsLoaded]);

  return {
    mediaId,
    isLoaded,
    elementRef: elementRef as React.RefObject<HTMLVideoElement>,
    shouldRender,
    videoProps: {
      onLoadStart: handleVideoLoadStart,
      onCanPlay: handleVideoCanPlay,
      onError: handleVideoError,
    }
  };
};

// Hook specifically for image elements  
export const useStableImageRenderer = (src: string) => {
  const { mediaId, isLoaded, elementRef, markAsLoaded, shouldRender } = useStableMediaRenderer(src, 'image');
  
  const handleImageLoad = useCallback(() => {
    markAsLoaded();
  }, [markAsLoaded]);

  const handleImageError = useCallback(() => {
    // Handle image error - still mark as "loaded" to prevent retries
    markAsLoaded();
  }, [markAsLoaded]);

  return {
    mediaId,
    isLoaded,
    elementRef: elementRef as React.RefObject<HTMLImageElement>,
    shouldRender,
    imageProps: {
      onLoad: handleImageLoad,
      onError: handleImageError,
    }
  };
};
