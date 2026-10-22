/** CB50: observation only. Never changes playback, HLS, audio or watchdogs.
 * One 100ms currentTime sampler + a 500ms deadline exist only during visible
 * play intent. Native WebKit currentTime works without waiting events. rVFC
 * and timeupdate deliver immediate recovery; idle lanes have no callbacks.
 */
export type StallEnd = 'pause' | 'pauseAll' | 'hidden' | 'swipe' | 'close' | 'release' | 'error' | 'ended';
export interface ProgressSample { currentTime: number; firstFrame: boolean }
export interface VisibleStall { phase: 'start' | 'mid'; duration_ms: number; ended_by?: StallEnd }

export class BufferingMonitor {
  buffering = false;
  private running = false;
  private presented = false;
  private last: ProgressSample = { currentTime: 0, firstFrame: false };
  private lastProgress = 0;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private sampler: ReturnType<typeof setInterval> | null = null;
  private visibleStart: number | null = null;
  private phase: 'start' | 'mid' = 'start';

  constructor(private read: () => ProgressSample, private changed: () => void, private ended: (stall: VisibleStall) => void) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const next = this.read();
    this.last = { currentTime: next.currentTime, firstFrame: next.firstFrame };
    this.lastProgress = Date.now();
    this.arm();
    this.sampler = setInterval(() => this.progress(), 100);
  }
  setPresented(value: boolean, reason: StallEnd = 'swipe'): void {
    if (value === this.presented) return;
    this.presented = value;
    if (!value) this.finish(reason);
    else if (this.buffering) this.beginVisible();
  }
  progress(): void {
    if (!this.running) return;
    const next = this.read();
    // A loop wrapping to zero is also progress, not a frozen playhead.
    if (next.currentTime !== this.last.currentTime || (next.firstFrame && !this.last.firstFrame)) {
      this.lastProgress = Date.now();
      this.last = { currentTime: next.currentTime, firstFrame: next.firstFrame };
      if (this.buffering) {
        this.buffering = false;
        this.finish();
        this.changed();
      }
      this.arm();
    }
  }
  stop(reason: StallEnd): void {
    this.running = false;
    if (this.deadline !== null) clearTimeout(this.deadline);
    if (this.sampler !== null) clearInterval(this.sampler);
    this.deadline = null;
    this.sampler = null;
    this.finish(reason);
    if (this.buffering) { this.buffering = false; this.changed(); }
  }
  private arm(): void {
    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = setTimeout(() => {
      this.deadline = null;
      this.progress();
      if (!this.running || Date.now() - this.lastProgress < 500 || this.buffering) return;
      this.buffering = true;
      if (this.presented) this.beginVisible();
      this.changed();
    }, 500);
  }
  private beginVisible(): void {
    this.visibleStart = Date.now();
    this.phase = this.read().firstFrame ? 'mid' : 'start';
  }
  private finish(reason?: StallEnd): void {
    if (this.visibleStart === null) return;
    const duration_ms = Date.now() - this.visibleStart;
    this.visibleStart = null;
    this.ended({ phase: this.phase, duration_ms, ...(reason ? { ended_by: reason } : {}) });
  }
}