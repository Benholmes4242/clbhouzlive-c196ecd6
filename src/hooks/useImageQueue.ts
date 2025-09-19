import { useRef, useCallback } from 'react';

export function useImageQueue(max = 6) {
  const inFlight = useRef(0);
  const queue = useRef<(() => void)[]>([]);

  const request = useCallback((start: () => void) => {
    if (inFlight.current < max) {
      inFlight.current++;
      start();
    } else {
      queue.current.push(start);
    }
  }, [max]);

  const release = useCallback(() => {
    inFlight.current--;
    const next = queue.current.shift();
    if (next) {
      inFlight.current++;
      next();
    }
  }, []);

  return { request, release };
}

// Global singleton to share across all image components
let globalImageQueue: ReturnType<typeof useImageQueue> | null = null;

export function useGlobalImageQueue() {
  if (!globalImageQueue) {
    // Initialize once - this will be shared across all components
    const queue = { 
      inFlight: 0,
      queue: [] as (() => void)[],
      request: (start: () => void) => {
        if (queue.inFlight < 6) {
          queue.inFlight++;
          start();
        } else {
          queue.queue.push(start);
        }
      },
      release: () => {
        queue.inFlight--;
        const next = queue.queue.shift();
        if (next) {
          queue.inFlight++;
          next();
        }
      }
    };
    globalImageQueue = queue;
  }
  return globalImageQueue;
}