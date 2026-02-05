/**
 * DecoderLimitManager - Enforces maximum concurrent video decode streams
 * 
 * Hardware video decoders have limited capacity. On most mobile devices:
 * - iOS: 4-8 concurrent H.264 decode streams (device dependent)
 * - Android: 2-4 concurrent streams (highly device dependent)
 * 
 * Instagram limits to 3 concurrent decode streams.
 * TikTok limits to 2.
 * 
 * When the limit is exceeded, the oldest non-playing stream is detached.
 */

interface DecoderSlot {
  videoId: string;
  videoElement: HTMLVideoElement;
  priority: 'playing' | 'visible' | 'preload';
  attachedAt: number;
}

class DecoderLimitManagerClass {
  private static instance: DecoderLimitManagerClass;
  
  // Conservative limit that works across devices
  // Instagram uses 3, TikTok uses 2
  private readonly MAX_CONCURRENT_DECODERS = 3;
  
  private slots: Map<string, DecoderSlot> = new Map();
  private onDetachCallbacks: Map<string, () => void> = new Map();

  private constructor() {}

  public static getInstance(): DecoderLimitManagerClass {
    if (!DecoderLimitManagerClass.instance) {
      DecoderLimitManagerClass.instance = new DecoderLimitManagerClass();
    }
    return DecoderLimitManagerClass.instance;
  }

  /**
   * Request a decoder slot for a video
   * Returns true if slot was granted, false if denied
   * 
   * If at capacity, will evict lowest-priority slot to make room
   */
  public requestSlot(
    videoId: string,
    videoElement: HTMLVideoElement,
    priority: 'playing' | 'visible' | 'preload',
    onDetach?: () => void
  ): boolean {
    // If this video already has a slot, update priority and return
    if (this.slots.has(videoId)) {
      const existing = this.slots.get(videoId)!;
      existing.priority = priority;
      existing.attachedAt = Date.now();
      if (onDetach) {
        this.onDetachCallbacks.set(videoId, onDetach);
      }
      console.log(`[DecoderLimit] Updated slot priority: ${videoId} → ${priority}`);
      return true;
    }

    // If under limit, grant immediately
    if (this.slots.size < this.MAX_CONCURRENT_DECODERS) {
      this.slots.set(videoId, {
        videoId,
        videoElement,
        priority,
        attachedAt: Date.now(),
      });
      if (onDetach) {
        this.onDetachCallbacks.set(videoId, onDetach);
      }
      console.log(`[DecoderLimit] Granted slot: ${videoId} (${this.slots.size}/${this.MAX_CONCURRENT_DECODERS})`);
      return true;
    }

    // At capacity - try to evict a lower priority slot
    const evictCandidate = this.findEvictionCandidate(priority);
    
    if (!evictCandidate) {
      // All slots are higher priority, deny this request
      console.log(`[DecoderLimit] Denied slot: ${videoId} - all slots are higher priority`);
      return false;
    }

    // Evict the candidate
    this.evictSlot(evictCandidate.videoId);

    // Grant the new slot
    this.slots.set(videoId, {
      videoId,
      videoElement,
      priority,
      attachedAt: Date.now(),
    });
    if (onDetach) {
      this.onDetachCallbacks.set(videoId, onDetach);
    }
    console.log(`[DecoderLimit] Granted slot after eviction: ${videoId} (${this.slots.size}/${this.MAX_CONCURRENT_DECODERS})`);
    return true;
  }

  /**
   * Release a decoder slot (call when video is destroyed or detached)
   */
  public releaseSlot(videoId: string): void {
    if (this.slots.has(videoId)) {
      this.slots.delete(videoId);
      this.onDetachCallbacks.delete(videoId);
      console.log(`[DecoderLimit] Released slot: ${videoId} (${this.slots.size}/${this.MAX_CONCURRENT_DECODERS})`);
    }
  }

  /**
   * Update priority of an existing slot (e.g., when video starts playing)
   */
  public updatePriority(videoId: string, priority: 'playing' | 'visible' | 'preload'): void {
    const slot = this.slots.get(videoId);
    if (slot) {
      const oldPriority = slot.priority;
      slot.priority = priority;
      console.log(`[DecoderLimit] Priority update: ${videoId} ${oldPriority} → ${priority}`);
    }
  }

  /**
   * Find a slot that can be evicted to make room for a new request
   * Returns the best eviction candidate, or null if none can be evicted
   */
  private findEvictionCandidate(requestPriority: 'playing' | 'visible' | 'preload'): DecoderSlot | null {
    const priorityRank = { playing: 3, visible: 2, preload: 1 };
    const requestRank = priorityRank[requestPriority];

    // Find slots with lower priority than the request
    const candidates = Array.from(this.slots.values())
      .filter(slot => priorityRank[slot.priority] < requestRank);

    if (candidates.length === 0) {
      // Also consider equal priority - evict oldest
      const equalPriority = Array.from(this.slots.values())
        .filter(slot => priorityRank[slot.priority] === requestRank);
      
      if (equalPriority.length > 0) {
        // Evict oldest among equal priority
        return equalPriority.sort((a, b) => a.attachedAt - b.attachedAt)[0];
      }
      return null;
    }

    // Evict lowest priority first, then oldest among those
    return candidates.sort((a, b) => {
      const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.attachedAt - b.attachedAt;
    })[0];
  }

  /**
   * Evict a slot and notify its owner
   */
  private evictSlot(videoId: string): void {
    const slot = this.slots.get(videoId);
    if (!slot) return;

    console.log(`[DecoderLimit] Evicting slot: ${videoId}`);

    // Call the detach callback if registered
    const onDetach = this.onDetachCallbacks.get(videoId);
    if (onDetach) {
      onDetach();
    }

    this.slots.delete(videoId);
    this.onDetachCallbacks.delete(videoId);
  }

  /**
   * Get current slot count (for debugging)
   */
  public getSlotCount(): number {
    return this.slots.size;
  }

  /**
   * Get all slot info (for debugging)
   */
  public getSlots(): DecoderSlot[] {
    return Array.from(this.slots.values());
  }

  /**
   * Check if a specific video has a slot
   */
  public hasSlot(videoId: string): boolean {
    return this.slots.has(videoId);
  }

  /**
   * Reset all slots (for testing or page transitions)
   */
  public reset(): void {
    this.slots.clear();
    this.onDetachCallbacks.clear();
    console.log('[DecoderLimit] Reset all slots');
  }
}

export const DecoderLimitManager = DecoderLimitManagerClass.getInstance();
