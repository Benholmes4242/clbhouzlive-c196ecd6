/**
 * Upload Visibility Monitor — tracks app foreground/background state during uploads.
 * 
 * When the app is backgrounded:
 * - Logs the event for diagnostics
 * - Records the timestamp (to detect long background periods)
 * - Emits events so the upload pipeline can react
 * 
 * When the app is foregrounded:
 * - Checks how long we were backgrounded
 * - If > 30 seconds, the upload connection may be stale
 * - Emits a 'foregrounded' event so TUS can verify/resume
 */

import { uploadEventBus } from './uploadEventBus';

class UploadVisibilityMonitor {
  private backgroundedAt: number | null = null;
  private isMonitoring = false;
  private activeJobCount = 0;

  /** Start monitoring visibility changes. Call when uploads begin. */
  start() {
    this.activeJobCount++;

    if (this.isMonitoring) return;
    this.isMonitoring = true;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('pagehide', this.handlePageHide);

    console.log('[VisibilityMonitor] Started');
  }

  /**
   * Stop monitoring. Call when all uploads complete.
   * Only actually stops when activeJobCount reaches 0.
   */
  stop() {
    this.activeJobCount = Math.max(0, this.activeJobCount - 1);

    if (this.activeJobCount > 0) return;

    this.isMonitoring = false;
    this.backgroundedAt = null;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('pagehide', this.handlePageHide);

    console.log('[VisibilityMonitor] Stopped');
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.backgroundedAt = Date.now();
      console.log('[VisibilityMonitor] App backgrounded');

      uploadEventBus.emit('upload:backgrounded', {
        type: 'upload:backgrounded',
        timestamp: this.backgroundedAt,
      });
    } else if (document.visibilityState === 'visible') {
      const backgroundDuration = this.backgroundedAt
        ? Math.round((Date.now() - this.backgroundedAt) / 1000)
        : 0;

      console.log(`[VisibilityMonitor] App foregrounded after ${backgroundDuration}s`);

      this.backgroundedAt = null;

      uploadEventBus.emit('upload:foregrounded', {
        type: 'upload:foregrounded',
        backgroundDurationSeconds: backgroundDuration,
        connectionMayBeStale: backgroundDuration > 30,
      });
    }
  };

  private handlePageHide = () => {
    console.log('[VisibilityMonitor] Page hide event');
    uploadEventBus.emit('upload:page-hiding', {
      type: 'upload:page-hiding',
    });
  };

  /** How long has the app been backgrounded? Returns 0 if in foreground. */
  getBackgroundDuration(): number {
    if (!this.backgroundedAt) return 0;
    return Math.round((Date.now() - this.backgroundedAt) / 1000);
  }

  isInBackground(): boolean {
    return document.visibilityState === 'hidden';
  }
}

export const uploadVisibilityMonitor = new UploadVisibilityMonitor();
