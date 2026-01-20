/**
 * WATCH TAB (VIDEOS) COMPREHENSIVE DEBUG SYSTEM
 * ==============================================
 * 
 * Technical debugging for the Watch/Videos tab pipeline.
 * Mirrors the Clubhouse debug pattern for consistency.
 * 
 * Enable/disable via: window.watchTabDebug.enable() / .disable()
 * 
 * Pipeline stages:
 * 1. DATA FETCH: Query execution, response times, video counts
 * 2. VIDEO FILTERING: Duration filter, deduplication, search
 * 3. PREFETCH: HLS manifest loading, ready queue status
 * 4. SCROLL: Feed position, intersection states
 * 5. MEDIA AUTOPLAY: Registration, visibility, play states
 * 6. PLAYER: Attach/detach, first frame, buffering, errors
 * 7. PERFORMANCE: Time-to-first-frame, time-to-playback
 */

// ============ Types ============

interface DebugEvent {
  timestamp: number;
  stage: DebugStage;
  event: string;
  data?: Record<string, unknown>;
  videoId?: string;
}

type DebugStage = 
  | 'DATA_FETCH'
  | 'VIDEO_FILTER'
  | 'PREFETCH'
  | 'SCROLL'
  | 'AUTOPLAY'
  | 'PLAYER'
  | 'PERFORMANCE'
  | 'LIFECYCLE';

interface PerformanceMetrics {
  fetchStart: number | null;
  fetchEnd: number | null;
  firstVideoRender: number | null;
  firstVideoAttach: number | null;
  firstFrameReady: number | null;
  firstPlayStart: number | null;
  videoMetrics: Map<string, VideoMetrics>;
}

interface VideoMetrics {
  attachTime: number | null;
  canPlayTime: number | null;
  firstFrameTime: number | null;
  playRequestTime: number | null;
  actualPlayTime: number | null;
  timeToFirstFrame: number | null;
}

// ============ Styles ============

const STYLES = {
  DATA_FETCH: 'color: #60a5fa; font-weight: bold;',    // Blue
  VIDEO_FILTER: 'color: #a78bfa; font-weight: bold;',  // Purple
  PREFETCH: 'color: #34d399; font-weight: bold;',      // Green
  SCROLL: 'color: #fbbf24; font-weight: bold;',        // Yellow
  AUTOPLAY: 'color: #c084fc; font-weight: bold;',      // Violet
  PLAYER: 'color: #fb923c; font-weight: bold;',        // Orange
  PERFORMANCE: 'color: #f43f5e; font-weight: bold;',   // Red
  LIFECYCLE: 'color: #64748b; font-weight: bold;',     // Gray
  videoId: 'color: #f472b6;',
  timing: 'color: #22d3ee;',
  success: 'color: #22c55e; font-weight: bold;',
  warning: 'color: #eab308; font-weight: bold;',
};

const ICONS = {
  DATA_FETCH: '📊',
  VIDEO_FILTER: '🔍',
  PREFETCH: '⏳',
  SCROLL: '📜',
  AUTOPLAY: '▶️',
  PLAYER: '🎬',
  PERFORMANCE: '⏱️',
  LIFECYCLE: '🔄',
};

// ============ Singleton Debug Class ============

class WatchTabDebugger {
  private events: DebugEvent[] = [];
  private enabled = false; // DISABLED BY DEFAULT in production
  private pageLoadTime = performance.now();
  private metrics: PerformanceMetrics = {
    fetchStart: null,
    fetchEnd: null,
    firstVideoRender: null,
    firstVideoAttach: null,
    firstFrameReady: null,
    firstPlayStart: null,
    videoMetrics: new Map(),
  };

  constructor() {
    // Don't log header on construction - only when enabled
  }

  private logHeader() {
    if (!this.enabled) return;
    
    console.log('%c\n╔══════════════════════════════════════════════════════════════════════════════╗', 'color: #34d399');
    console.log('%c║                    WATCH TAB DEBUG MODE ACTIVE                               ║', 'color: #34d399; font-weight: bold;');
    console.log('%c║  Tracking: Fetch → Filter → Prefetch → Scroll → Autoplay → Player → Play    ║', 'color: #34d399');
    console.log('%c╚══════════════════════════════════════════════════════════════════════════════╝\n', 'color: #34d399');
  }

  enable() { 
    this.enabled = true; 
    this.logHeader();
    console.log('%c[WatchTabDebug] Debugging ENABLED', STYLES.success);
  }
  
  disable() { 
    this.enabled = false; 
    console.log('%c[WatchTabDebug] Debugging DISABLED', STYLES.warning);
  }
  
  isEnabled() { return this.enabled; }

  private getRelativeTime(): string {
    return `+${Math.round(performance.now() - this.pageLoadTime)}ms`;
  }

  private log(stage: DebugStage, event: string, data?: Record<string, unknown>, videoId?: string) {
    if (!this.enabled) return;

    const timestamp = performance.now();
    const relTime = this.getRelativeTime();
    
    this.events.push({ timestamp, stage, event, data, videoId });

    const icon = ICONS[stage];
    const style = STYLES[stage];
    const shortId = videoId ? videoId.slice(0, 8) : '';
    
    let logLine = `%c${relTime}%c ${icon} %c[${stage}]%c ${event}`;
    const logArgs = [STYLES.timing, '', style, ''];
    
    if (videoId) {
      logLine += ` %c[${shortId}]`;
      logArgs.push(STYLES.videoId);
    }
    
    if (data && Object.keys(data).length > 0) {
      console.log(logLine, ...logArgs, data);
    } else {
      console.log(logLine, ...logArgs);
    }
  }

  private getVideoMetrics(videoId: string): VideoMetrics {
    if (!this.metrics.videoMetrics.has(videoId)) {
      this.metrics.videoMetrics.set(videoId, {
        attachTime: null,
        canPlayTime: null,
        firstFrameTime: null,
        playRequestTime: null,
        actualPlayTime: null,
        timeToFirstFrame: null,
      });
    }
    return this.metrics.videoMetrics.get(videoId)!;
  }

  // ============ LIFECYCLE ============
  
  pageMount() {
    this.pageLoadTime = performance.now();
    this.log('LIFECYCLE', 'Watch tab MOUNTED');
  }

  pageUnmount() {
    this.log('LIFECYCLE', 'Watch tab UNMOUNTED');
  }

  // ============ DATA FETCH ============
  
  fetchStart(section: string) {
    this.metrics.fetchStart = performance.now();
    this.log('DATA_FETCH', 'Query STARTED', { section });
  }

  fetchSuccess(section: string, videoCount: number) {
    this.metrics.fetchEnd = performance.now();
    const duration = this.metrics.fetchStart 
      ? Math.round(this.metrics.fetchEnd - this.metrics.fetchStart) 
      : 0;
    this.log('DATA_FETCH', 'Query SUCCESS', { 
      section, 
      videoCount, 
      duration: `${duration}ms`,
    });
  }

  fetchError(section: string, error: string) {
    this.log('DATA_FETCH', 'Query FAILED', { section, error });
  }

  fetchPageLoad(pageIndex: number, videoCount: number) {
    this.log('DATA_FETCH', 'Page loaded', { pageIndex, videoCount });
  }

  // ============ VIDEO FILTERING ============

  filterApplied(inputCount: number, outputCount: number, filterType: string) {
    this.log('VIDEO_FILTER', 'Filter applied', { 
      input: inputCount, 
      output: outputCount, 
      removed: inputCount - outputCount,
      filterType,
    });
  }

  searchApplied(query: string, resultCount: number) {
    this.log('VIDEO_FILTER', 'Search filter', { query, resultCount });
  }

  // ============ PREFETCH ============

  prefetchInitiated(videoId: string, position: number) {
    this.log('PREFETCH', 'Prefetch INITIATED', { position }, videoId);
  }

  prefetchQueueUpdate(currentIndex: number, queueSize: number, readyCount: number) {
    this.log('PREFETCH', 'Queue update', { currentIndex, queueSize, readyCount });
  }

  videoMarkedReady(videoId: string) {
    this.log('PREFETCH', 'Video marked READY', {}, videoId);
  }

  // ============ SCROLL ============

  scrollIndexChange(oldIndex: number, newIndex: number) {
    this.log('SCROLL', 'Index CHANGED', { from: oldIndex, to: newIndex });
  }

  // ============ AUTOPLAY ============

  autoplayRegister(videoId: string, index: number) {
    this.log('AUTOPLAY', 'Media REGISTERED', { index }, videoId);
  }

  autoplayStateChange(videoId: string, isPlaying: boolean) {
    this.log('AUTOPLAY', isPlaying ? 'PLAYING' : 'PAUSED', {}, videoId);
  }

  // ============ PLAYER ============

  playerReady(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.canPlayTime = performance.now();
    
    if (!this.metrics.firstFrameReady) {
      this.metrics.firstFrameReady = vm.canPlayTime;
    }
    
    const timeToReady = vm.attachTime 
      ? Math.round(vm.canPlayTime - vm.attachTime) 
      : null;
    
    this.log('PLAYER', 'Video READY (canplaythrough)', { 
      timeToReady: timeToReady ? `${timeToReady}ms` : 'N/A' 
    }, videoId);
  }

  playerFirstFrame(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.firstFrameTime = performance.now();
    
    const fromMount = this.pageLoadTime 
      ? Math.round(vm.firstFrameTime - this.pageLoadTime) 
      : null;
    
    this.log('PLAYER', 'FIRST FRAME ready', { 
      fromPageMount: fromMount ? `${fromMount}ms` : 'N/A' 
    }, videoId);
  }

  playerError(videoId: string, error: string) {
    this.log('PLAYER', 'ERROR', { error }, videoId);
  }

  // ============ PERFORMANCE ============

  performanceSummary() {
    if (!this.enabled) return;
    
    const summary = {
      totalVideosTracked: this.metrics.videoMetrics.size,
      fetchToFirstFrame: this.metrics.fetchStart && this.metrics.firstFrameReady
        ? `${Math.round(this.metrics.firstFrameReady - this.metrics.fetchStart)}ms`
        : 'N/A',
      totalEvents: this.events.length,
    };
    
    console.log('%c\n═══ WATCH TAB PERFORMANCE SUMMARY ═══', 'color: #34d399; font-weight: bold;');
    console.table(summary);
  }

  getEvents() { return [...this.events]; }
  
  clearEvents() { 
    this.events = []; 
    this.metrics.videoMetrics.clear();
  }
}

// ============ Singleton Export ============

export const watchTabDebug = new WatchTabDebugger();

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as { watchTabDebug: WatchTabDebugger }).watchTabDebug = watchTabDebug;
}
