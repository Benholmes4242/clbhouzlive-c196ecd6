// Debounce utility to prevent excessive API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeoutId: NodeJS.Timeout;
  let pendingPromises: { resolve: (value: any) => void; reject: (error: any) => void }[] = [];

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      pendingPromises.push({ resolve, reject });

      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          pendingPromises.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          pendingPromises.forEach(({ reject }) => reject(error));
        } finally {
          pendingPromises = [];
        }
      }, delay);
    });
  };
};

// Rate limiting utility for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 10000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(key: string): Promise<void> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot(key);
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
  }
}

export const edgeFunctionRateLimiter = new RateLimiter(3, 5000); // Max 3 requests per 5 seconds