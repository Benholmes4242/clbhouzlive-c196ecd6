/**
 * NetworkPriorityManager - Coordinates network requests to prioritize first video loading
 * 
 * When first video is loading, non-critical requests (avatars, thumbnails, like counts)
 * can be deferred or aborted to give full bandwidth to video segments.
 * 
 * This is the pattern Instagram uses for instant video start.
 */

import { videoDebug } from '@/config/videoDebug';

type RequestPriority = 'critical' | 'high' | 'normal' | 'low';

interface ManagedRequest {
  id: string;
  controller: AbortController;
  priority: RequestPriority;
  url: string;
  createdAt: number;
}

class NetworkPriorityManagerClass {
  private static instance: NetworkPriorityManagerClass;
  private requests: Map<string, ManagedRequest> = new Map();
  private isFirstVideoLoading: boolean = false;
  private firstVideoLoadedAt: number | null = null;
  
  // Requests below this priority will be aborted when first video is loading
  private readonly ABORT_THRESHOLD: RequestPriority = 'normal';
  
  // How long to maintain priority mode after first video starts (ms)
  private readonly PRIORITY_WINDOW_MS = 3000;

  private constructor() {}

  public static getInstance(): NetworkPriorityManagerClass {
    if (!NetworkPriorityManagerClass.instance) {
      NetworkPriorityManagerClass.instance = new NetworkPriorityManagerClass();
    }
    return NetworkPriorityManagerClass.instance;
  }

  /**
   * Signal that first video is now loading - enter priority mode
   */
  public enterPriorityMode(): void {
    if (this.isFirstVideoLoading) return;
    
    this.isFirstVideoLoading = true;
    this.firstVideoLoadedAt = null;
    
    videoDebug('networkPriority', 'Entering priority mode - aborting low-priority requests');
    
    // Abort all requests below threshold
    this.requests.forEach((request, id) => {
      if (this.shouldAbort(request.priority)) {
        videoDebug('networkPriority', `Aborting ${request.priority} request`, { url: request.url });
        request.controller.abort();
        this.requests.delete(id);
      }
    });
  }

  /**
   * Signal that first video has loaded - exit priority mode after window
   */
  public exitPriorityMode(): void {
    if (!this.isFirstVideoLoading) return;
    
    this.firstVideoLoadedAt = Date.now();
    
    videoDebug('networkPriority', 'First video loaded - priority window active for 3s');
    
    // Maintain priority for a short window to allow ABR ramp-up
    setTimeout(() => {
      this.isFirstVideoLoading = false;
      videoDebug('networkPriority', 'Priority mode ended');
    }, this.PRIORITY_WINDOW_MS);
  }

  /**
   * Create a managed fetch request
   * Returns { signal, cleanup } - pass signal to fetch, call cleanup when done
   */
  public createRequest(
    url: string, 
    priority: RequestPriority = 'normal'
  ): { signal: AbortSignal; cleanup: () => void; shouldProceed: boolean } {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const controller = new AbortController();
    
    const request: ManagedRequest = {
      id,
      controller,
      priority,
      url,
      createdAt: Date.now(),
    };
    
    // If in priority mode and this request should be aborted, signal to not proceed
    if (this.isFirstVideoLoading && this.shouldAbort(priority)) {
      videoDebug('networkPriority', `Deferring ${priority} request`, { url });
      return {
        signal: controller.signal,
        cleanup: () => {},
        shouldProceed: false,
      };
    }
    
    this.requests.set(id, request);
    
    return {
      signal: controller.signal,
      cleanup: () => {
        this.requests.delete(id);
      },
      shouldProceed: true,
    };
  }

  /**
   * Wrap a fetch call with priority management
   */
  public async priorityFetch(
    url: string,
    options: RequestInit = {},
    priority: RequestPriority = 'normal'
  ): Promise<Response | null> {
    const { signal, cleanup, shouldProceed } = this.createRequest(url, priority);
    
    if (!shouldProceed) {
      // Return null to signal the request was deferred
      return null;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        signal,
      });
      return response;
    } finally {
      cleanup();
    }
  }

  private shouldAbort(priority: RequestPriority): boolean {
    const priorityOrder: RequestPriority[] = ['critical', 'high', 'normal', 'low'];
    const thresholdIndex = priorityOrder.indexOf(this.ABORT_THRESHOLD);
    const requestIndex = priorityOrder.indexOf(priority);
    return requestIndex >= thresholdIndex;
  }

  /**
   * Check if we're currently in priority mode
   */
  public isPriorityMode(): boolean {
    return this.isFirstVideoLoading;
  }

  /**
   * Reset state (useful for testing or page transitions)
   */
  public reset(): void {
    this.isFirstVideoLoading = false;
    this.firstVideoLoadedAt = null;
    this.requests.forEach((request) => {
      request.controller.abort();
    });
    this.requests.clear();
  }
}

export const NetworkPriorityManager = NetworkPriorityManagerClass.getInstance();
