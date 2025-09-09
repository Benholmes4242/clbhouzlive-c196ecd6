// Enhanced performance utilities with better request deduplication
import React from 'react';

// Enhanced request deduplication with priority
const requestCache = new Map<string, {
  promise: Promise<any>;
  timestamp: number;
  priority: 'low' | 'normal' | 'high';
}>();

export const dedupeRequest = <T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    ttl?: number;
    priority?: 'low' | 'normal' | 'high';
  } = {}
): Promise<T> => {
  const { ttl = 3000, priority = 'normal' } = options;
  const now = Date.now();
  const cached = requestCache.get(key);
  
  // Priority-based cache eviction
  if (cached && priority === 'high' && cached.priority === 'low') {
    requestCache.delete(key);
  } else if (cached && (now - cached.timestamp) < ttl) {
    return cached.promise;
  }
  
  const request = requestFn().finally(() => {
    setTimeout(() => requestCache.delete(key), ttl);
  });
  
  requestCache.set(key, { promise: request, timestamp: now, priority });
  return request;
};

// Smart cleanup with priority
setInterval(() => {
  const now = Date.now();
  const cutoff = 30000; // 30 seconds for aggressive cleanup
  
  for (const [key, { timestamp, priority }] of requestCache.entries()) {
    // Keep high priority requests longer
    const maxAge = priority === 'high' ? cutoff * 2 : cutoff;
    if (now - timestamp > maxAge) {
      requestCache.delete(key);
    }
  }
}, 10000); // Clean every 10 seconds

// Enhanced stable reference hooks
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const ref = React.useRef<T>(callback);
  
  React.useEffect(() => {
    ref.current = callback;
  }, deps);
  
  return React.useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
};

export const useStableValue = <T>(value: T): T => {
  const ref = React.useRef<T>(value);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  if (!Object.is(ref.current, value)) {
    ref.current = value;
    forceUpdate();
  }
  
  return ref.current;
};

// Deep memoization for complex objects
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = React.useRef<{ deps: React.DependencyList; value: T }>();
  
  if (!ref.current || !areEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  
  return ref.current.value;
};

// Efficient deep equality check
const areEqual = (a: React.DependencyList, b: React.DependencyList): boolean => {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  
  return true;
};

// Intersection observer with cleanup
export const useIntersectionObserver = (
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  const ref = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [callback, options.threshold, options.rootMargin]);
  
  return ref;
};

// Throttled resize observer
export const useResizeObserver = (
  callback: (entries: ResizeObserverEntry[]) => void,
  throttleMs: number = 16
) => {
  const ref = React.useRef<HTMLElement>(null);
  const callbackRef = React.useRef(callback);
  
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const throttledCallback = (entries: ResizeObserverEntry[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callbackRef.current(entries);
      }, throttleMs);
    };
    
    const observer = new ResizeObserver(throttledCallback);
    observer.observe(element);
    
    return () => {
      clearTimeout(timeoutId);
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [throttleMs]);
  
  return ref;
};
