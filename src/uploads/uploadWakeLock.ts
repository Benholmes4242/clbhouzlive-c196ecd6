/**
 * Upload Wake Lock — prevents screen from sleeping during active uploads.
 * 
 * Uses the Screen Wake Lock API (supported in Chrome 84+, Safari 16.4+, Edge 84+).
 * Ref-counted: multiple concurrent uploads can call acquire/release independently.
 * The actual wake lock is only released when all uploads have completed.
 */

class UploadWakeLock {
  private wakeLock: WakeLockSentinel | null = null;
  private activeCount = 0;

  /**
   * Acquire a screen wake lock. Ref-counted — each call must be
   * balanced with a release() call. The actual sentinel is acquired
   * on the first call and released when activeCount returns to 0.
   */
  async acquire(): Promise<boolean> {
    this.activeCount++;

    // Already holding a lock — just increment the count
    if (this.activeCount > 1 && this.wakeLock) {
      console.log(`[WakeLock] Ref count → ${this.activeCount} (already held)`);
      return true;
    }

    if (!('wakeLock' in navigator)) {
      console.log('[WakeLock] API not available — screen may sleep during upload');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log(`[WakeLock] Acquired — ref count: ${this.activeCount}`);

      // Wake locks are released when the tab becomes hidden.
      // Track this so we can re-acquire on visibility change.
      this.wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Released by system');
        this.wakeLock = null;
        // Don't decrement activeCount — we still want the lock
      });

      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      return true;
    } catch (err) {
      console.warn('[WakeLock] Failed to acquire:', err);
      return false;
    }
  }

  /**
   * Re-acquire the lock when the tab becomes visible again.
   * The browser automatically releases wake locks when a tab is hidden.
   */
  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && this.activeCount > 0 && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Re-acquired after tab became visible');
      } catch (err) {
        console.warn('[WakeLock] Failed to re-acquire:', err);
      }
    }
  };

  /**
   * Release one reference to the wake lock. The actual sentinel is only
   * released when activeCount reaches 0 (all uploads complete).
   */
  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);

    console.log(`[WakeLock] Release called — ref count: ${this.activeCount}`);

    if (this.activeCount > 0) {
      // Other uploads still active — keep the lock
      return;
    }

    // All uploads done — actually release
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
      console.log('[WakeLock] Released — screen can sleep');
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /** Check if the wake lock is currently held. */
  isHeld(): boolean {
    return this.wakeLock !== null;
  }

  /** Check if any uploads want the lock (even if temporarily lost). */
  isWanted(): boolean {
    return this.activeCount > 0;
  }
}

export const uploadWakeLock = new UploadWakeLock();
