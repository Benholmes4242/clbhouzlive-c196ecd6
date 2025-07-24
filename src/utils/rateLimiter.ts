// Rate limiting utility for client-side protection
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  blockedUntil?: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  
  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.limits) {
      // Clean up expired entries
      if (entry.windowStart + 3600000 < now) { // 1 hour cleanup
        this.limits.delete(key);
      }
    }
  }

  isRateLimited(identifier: string, config: RateLimitConfig): boolean {
    this.cleanupExpired();
    
    const now = Date.now();
    const entry = this.limits.get(identifier);
    
    if (!entry) {
      this.limits.set(identifier, {
        attempts: 1,
        windowStart: now
      });
      return false;
    }
    
    // Check if still blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return true;
    }
    
    // Check if window has expired
    if (entry.windowStart + config.windowMs < now) {
      this.limits.set(identifier, {
        attempts: 1,
        windowStart: now
      });
      return false;
    }
    
    // Increment attempts
    entry.attempts++;
    
    // Check if limit exceeded
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + (config.blockDurationMs || config.windowMs);
      return true;
    }
    
    return false;
  }
  
  getRemainingAttempts(identifier: string, config: RateLimitConfig): number {
    const entry = this.limits.get(identifier);
    if (!entry) return config.maxAttempts;
    
    const now = Date.now();
    
    // If window expired, return max attempts
    if (entry.windowStart + config.windowMs < now) {
      return config.maxAttempts;
    }
    
    return Math.max(0, config.maxAttempts - entry.attempts);
  }
  
  getTimeUntilReset(identifier: string, config: RateLimitConfig): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;
    
    const now = Date.now();
    
    // If blocked, return time until unblocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return entry.blockedUntil - now;
    }
    
    // Return time until window resets
    return Math.max(0, (entry.windowStart + config.windowMs) - now);
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  AUTH_ATTEMPTS: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  },
  ACCESS_CODE_ATTEMPTS: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000 // 15 minutes block
  },
  EMAIL_CHANGE_ATTEMPTS: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 24 * 60 * 60 * 1000 // 24 hours block
  }
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;