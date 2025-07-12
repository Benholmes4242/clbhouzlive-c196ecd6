/**
 * Cache utilities for performance optimization
 */

// In-memory cache for small frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Create a global memory cache instance
export const memoryCache = new MemoryCache();

// localStorage cache with expiration
export const localStorageCache = {
  set(key: string, data: any, ttl = 24 * 60 * 60 * 1000): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  },

  get(key: string): any | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  },

  has(key: string): boolean {
    return this.get(key) !== null;
  },

  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete localStorage cache:', error);
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('clbhouz-cache-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
};

// sessionStorage cache (no expiration needed as it clears on tab close)
export const sessionStorageCache = {
  set(key: string, data: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to set sessionStorage cache:', error);
    }
  },

  get(key: string): any | null {
    try {
      const itemStr = sessionStorage.getItem(key);
      return itemStr ? JSON.parse(itemStr) : null;
    } catch (error) {
      console.warn('Failed to get sessionStorage cache:', error);
      return null;
    }
  },

  has(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  },

  delete(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete sessionStorage cache:', error);
    }
  },

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage cache:', error);
    }
  }
};

// Cache key generators
export const cacheKeys = {
  userProfile: (userId: string) => `clbhouz-cache-user-profile-${userId}`,
  golfCourses: (page: number, filters?: any) => 
    `clbhouz-cache-golf-courses-${page}-${JSON.stringify(filters || {})}`,
  userPosts: (userId: string, page: number) => 
    `clbhouz-cache-user-posts-${userId}-${page}`,
  courseRatings: (courseId: string) => 
    `clbhouz-cache-course-ratings-${courseId}`,
  userFollows: (userId: string) => 
    `clbhouz-cache-user-follows-${userId}`,
};

// Memoization decorator for functions
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string,
  ttl = 5 * 60 * 1000
): T {
  const cache = new Map<string, { result: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }

    const result = fn(...args);
    cache.set(key, { result, timestamp: Date.now() });

    // Clean up old entries periodically
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.slice(0, 50).forEach(([k]) => cache.delete(k));
    }

    return result;
  }) as T;
}