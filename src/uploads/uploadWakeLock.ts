/**
 * Upload Wake Lock — prevents screen from sleeping during active uploads.
 * 
 * Uses the Screen Wake Lock API (supported in Chrome 84+, Safari 16.4+, Edge 84+).
 * Falls back gracefully — if the API isn't available, uploads still work but
 * the screen may sleep and the upload may be interrupted.
 * 
 * Automatically re-acquires the lock when the tab regains visibility
 * (the browser releases wake locks when a tab becomes hidden).
 */

class UploadWakeLock {
  private wakeLock: WakeLockSentinel | null = null;
  private isActive = false;

  /**
   * Acquire a screen wake lock. Safe to call multiple times —
   * only acquires once until release() is called.
   */
  async acquire(): Promise<boolean> {
    if (this.isActive) return true;

    if (!('wakeLock' in navigator)) {
      console.log('[WakeLock] API not available — screen may sleep during upload');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isActive = true;
      console.log('[WakeLock] Acquired — screen will stay on during upload');

      this.wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Released by system');
        this.wakeLock = null;
        // Don't set isActive=false — we still want it, just lost it temporarily
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
    if (document.visibilityState === 'visible' && this.isActive && !this.wakeLock) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Re-acquired after tab became visible');
      } catch (err) {
        console.warn('[WakeLock] Failed to re-acquire:', err);
      }
    }
  };

  /**
   * Release the wake lock. Call this when all uploads are complete.
   */
  release() {
    this.isActive = false;

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

  /** Check if the wake lock is active (wanted, even if temporarily lost). */
  isWanted(): boolean {
    return this.isActive;
  }
}

export const uploadWakeLock = new UploadWakeLock();
