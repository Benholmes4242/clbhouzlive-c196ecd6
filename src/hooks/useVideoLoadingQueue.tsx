import { useState, useEffect, useRef } from 'react';

interface VideoLoadRequest {
  id: string;
  priority: number;
  callback: () => void;
  cleanup?: () => void;
}

class VideoLoadingQueue {
  private queue: VideoLoadRequest[] = [];
  private loading: Set<string> = new Set();
  private maxConcurrent: number = 2; // Limit concurrent video loads
  private maxMobileConcurrent: number = 1; // Even more restrictive on mobile
  
  constructor() {
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.maxConcurrent = isMobile ? this.maxMobileConcurrent : this.maxConcurrent;
  }

  addToQueue(request: VideoLoadRequest) {
    // Remove any existing request with same ID
    this.queue = this.queue.filter(req => req.id !== request.id);
    
    // Add new request
    this.queue.push(request);
    
    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    this.processQueue();
  }

  removeFromQueue(id: string) {
    // Remove from queue
    const removedRequest = this.queue.find(req => req.id === id);
    this.queue = this.queue.filter(req => req.id !== id);
    
    // Clean up if it was loading
    if (this.loading.has(id)) {
      this.loading.delete(id);
      removedRequest?.cleanup?.();
      // Process next in queue
      this.processQueue();
    }
  }

  private processQueue() {
    while (this.queue.length > 0 && this.loading.size < this.maxConcurrent) {
      const request = this.queue.shift()!;
      this.loading.add(request.id);
      
      // Execute the load callback
      request.callback();
      
      // Remove from loading after a delay to prevent rapid loading
      setTimeout(() => {
        this.loading.delete(request.id);
        this.processQueue();
      }, 500); // Small delay between loads
    }
  }

  isLoading(id: string): boolean {
    return this.loading.has(id);
  }

  getQueuePosition(id: string): number {
    return this.queue.findIndex(req => req.id === id);
  }
}

// Global queue instance
const globalVideoQueue = new VideoLoadingQueue();

export const useVideoLoadingQueue = (
  videoId: string,
  priority: number = 1,
  onLoad: () => void,
  onCleanup?: () => void
) => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState(-1);
  const hasRequestedLoad = useRef(false);

  const requestLoad = () => {
    if (hasRequestedLoad.current) return;
    
    hasRequestedLoad.current = true;
    setIsInQueue(true);
    
    globalVideoQueue.addToQueue({
      id: videoId,
      priority,
      callback: () => {
        setIsLoading(true);
        setIsInQueue(false);
        onLoad();
      },
      cleanup: onCleanup
    });
  };

  const cancelLoad = () => {
    if (hasRequestedLoad.current) {
      globalVideoQueue.removeFromQueue(videoId);
      setIsInQueue(false);
      setIsLoading(false);
      hasRequestedLoad.current = false;
    }
  };

  // Update queue position
  useEffect(() => {
    if (isInQueue) {
      const position = globalVideoQueue.getQueuePosition(videoId);
      setQueuePosition(position);
    }
  }, [isInQueue, videoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelLoad();
    };
  }, []);

  return {
    requestLoad,
    cancelLoad,
    isInQueue,
    isLoading: globalVideoQueue.isLoading(videoId),
    queuePosition
  };
};