/**
 * CLUBHOUSE COMPREHENSIVE DEBUG SYSTEM
 * =====================================
 * 
 * Super-technical debugging for the entire Clubhouse video pipeline.
 * Tracks everything from data fetch to video playback.
 * 
 * Enable/disable via: window.clubhouseDebug.enable() / .disable()
 * 
 * Pipeline stages:
 * 1. DATA FETCH: Query execution, response times, post counts
 * 2. POST FILTERING: Portrait filter, duration filter, deduplication
 * 3. PREFETCH: HLS manifest loading, segment caching, blob cache status
 * 4. SCROLL/SNAP: Index changes, intersection observations, snap timing
 * 5. MEDIA RUNTIME: Registration, candidate states, play requests
 * 6. HLS PLAYER: Attach/detach, first frame, buffering, errors
 * 7. VISIBILITY: IntersectionObserver events, autoplay map changes
 * 8. PERFORMANCE: Time-to-first-frame, time-to-playback, bottlenecks
 */

// ============ Types ============

interface DebugEvent {
  timestamp: number;
  stage: DebugStage;
  event: string;
  data?: Record<string, any>;
  videoId?: string;
}

type DebugStage = 
  | 'DATA_FETCH'
  | 'POST_FILTER'
  | 'PREFETCH'
  | 'SCROLL'
  | 'SNAP'
  | 'RUNTIME'
  | 'HLS_PLAYER'
  | 'VISIBILITY'
  | 'AUTOPLAY'
  | 'PERFORMANCE'
  | 'LIFECYCLE';

interface PerformanceMetrics {
  fetchStart: number | null;
  fetchEnd: number | null;
  firstPostRender: number | null;
  firstVideoAttach: number | null;
  firstFrameReady: number | null;
  firstPlayStart: number | null;
  videoMetrics: Map<string, VideoMetrics>;
}

interface VideoMetrics {
  attachTime: number | null;
  manifestLoadStart: number | null;
  manifestLoadEnd: number | null;
  firstSegmentStart: number | null;
  firstSegmentEnd: number | null;
  canPlayTime: number | null;
  firstFrameTime: number | null;
  playRequestTime: number | null;
  actualPlayTime: number | null;
  timeToFirstFrame: number | null;
  timeToPlayback: number | null;
}

// ============ Styles ============

const STYLES = {
  DATA_FETCH: 'color: #60a5fa; font-weight: bold;',    // Blue
  POST_FILTER: 'color: #a78bfa; font-weight: bold;',   // Purple
  PREFETCH: 'color: #34d399; font-weight: bold;',      // Green
  SCROLL: 'color: #fbbf24; font-weight: bold;',        // Yellow
  SNAP: 'color: #f472b6; font-weight: bold;',          // Pink
  RUNTIME: 'color: #2dd4bf; font-weight: bold;',       // Teal
  HLS_PLAYER: 'color: #fb923c; font-weight: bold;',    // Orange
  VISIBILITY: 'color: #a3e635; font-weight: bold;',    // Lime
  AUTOPLAY: 'color: #c084fc; font-weight: bold;',      // Violet
  PERFORMANCE: 'color: #f43f5e; font-weight: bold;',   // Red
  LIFECYCLE: 'color: #64748b; font-weight: bold;',     // Gray
  header: 'color: #ffffff; background: #1e293b; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
  videoId: 'color: #f472b6;',
  timing: 'color: #22d3ee;',
  success: 'color: #22c55e; font-weight: bold;',
  warning: 'color: #eab308; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
};

const ICONS = {
  DATA_FETCH: '📊',
  POST_FILTER: '🔍',
  PREFETCH: '⏳',
  SCROLL: '📜',
  SNAP: '🎯',
  RUNTIME: '⚡',
  HLS_PLAYER: '🎬',
  VISIBILITY: '👁️',
  AUTOPLAY: '▶️',
  PERFORMANCE: '⏱️',
  LIFECYCLE: '🔄',
};

// ============ Singleton Debug Class ============

class ClubhouseDebugger {
  private events: DebugEvent[] = [];
  private enabled = true; // ENABLED BY DEFAULT for debugging
  private pageLoadTime = performance.now();
  private metrics: PerformanceMetrics = {
    fetchStart: null,
    fetchEnd: null,
    firstPostRender: null,
    firstVideoAttach: null,
    firstFrameReady: null,
    firstPlayStart: null,
    videoMetrics: new Map(),
  };
  
  // Visibility tracking
  private visibilityStates: Map<string, { visible: boolean; ratio: number; lastUpdate: number }> = new Map();
  
  // Scroll tracking
  private scrollState = {
    isScrolling: false,
    lastScrollTime: 0,
    scrollStartTime: 0,
    snapCount: 0,
  };

  constructor() {
    // Log initialization
    this.logHeader();
  }

  private logHeader() {
    if (!this.enabled) return;
    
    console.log('%c\n╔══════════════════════════════════════════════════════════════════════════════╗', 'color: #60a5fa');
    console.log('%c║                    CLUBHOUSE DEBUG MODE ACTIVE                               ║', 'color: #60a5fa; font-weight: bold;');
    console.log('%c║  Tracking: Fetch → Filter → Prefetch → Scroll → Runtime → Player → Playback ║', 'color: #60a5fa');
    console.log('%c╚══════════════════════════════════════════════════════════════════════════════╝\n', 'color: #60a5fa');
  }

  enable() { 
    this.enabled = true; 
    this.logHeader();
    console.log('%c[ClubhouseDebug] Debugging ENABLED', STYLES.success);
  }
  
  disable() { 
    this.enabled = false; 
    console.log('%c[ClubhouseDebug] Debugging DISABLED', STYLES.warning);
  }
  
  isEnabled() { return this.enabled; }

  private getRelativeTime(): string {
    return `+${Math.round(performance.now() - this.pageLoadTime)}ms`;
  }

  private log(stage: DebugStage, event: string, data?: Record<string, any>, videoId?: string) {
    if (!this.enabled) return;

    const timestamp = performance.now();
    const relTime = this.getRelativeTime();
    
    this.events.push({ timestamp, stage, event, data, videoId });

    const icon = ICONS[stage];
    const style = STYLES[stage];
    const shortId = videoId ? videoId.slice(0, 8) : '';
    
    let logLine = `%c${relTime}%c ${icon} %c[${stage}]%c ${event}`;
    let logArgs = [STYLES.timing, '', style, ''];
    
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
        manifestLoadStart: null,
        manifestLoadEnd: null,
        firstSegmentStart: null,
        firstSegmentEnd: null,
        canPlayTime: null,
        firstFrameTime: null,
        playRequestTime: null,
        actualPlayTime: null,
        timeToFirstFrame: null,
        timeToPlayback: null,
      });
    }
    return this.metrics.videoMetrics.get(videoId)!;
  }

  // ============ DATA FETCH ============
  
  fetchStart(queryKey: string) {
    this.metrics.fetchStart = performance.now();
    this.log('DATA_FETCH', 'Query STARTED', { queryKey });
  }

  fetchSuccess(queryKey: string, postCount: number, duration: number) {
    this.metrics.fetchEnd = performance.now();
    const totalDuration = this.metrics.fetchStart 
      ? Math.round(this.metrics.fetchEnd - this.metrics.fetchStart) 
      : duration;
    this.log('DATA_FETCH', 'Query SUCCESS', { 
      queryKey, 
      postCount, 
      duration: `${totalDuration}ms`,
      postsPerSecond: Math.round(postCount / (totalDuration / 1000))
    });
  }

  fetchError(queryKey: string, error: string) {
    this.log('DATA_FETCH', 'Query FAILED', { queryKey, error });
  }

  fetchPageLoad(pageIndex: number, postCount: number) {
    this.log('DATA_FETCH', 'Page loaded', { pageIndex, postCount });
  }

  // ============ POST FILTERING ============

  filterStart(inputCount: number) {
    this.log('POST_FILTER', 'Filter pipeline STARTED', { inputPosts: inputCount });
  }

  filterDedupe(before: number, after: number, removed: number) {
    this.log('POST_FILTER', 'Deduplication', { 
      before, 
      after, 
      removed,
      removalRate: `${Math.round((removed / before) * 100)}%`
    });
  }

  filterDuration(before: number, after: number, removed: number, maxDuration: number) {
    this.log('POST_FILTER', 'Duration filter', { 
      before, 
      after, 
      removed, 
      maxDuration: `${maxDuration}s`,
      removalRate: `${Math.round((removed / before) * 100)}%`
    });
  }

  filterPortrait(before: number, after: number, removed: number, minAR: number) {
    this.log('POST_FILTER', 'Portrait filter', { 
      before, 
      after, 
      removed, 
      minAspectRatio: minAR,
      removalRate: `${Math.round((removed / before) * 100)}%`
    });
  }

  filterComplete(inputCount: number, outputCount: number) {
    const passRate = Math.round((outputCount / inputCount) * 100);
    this.log('POST_FILTER', 'Filter pipeline COMPLETE', { 
      input: inputCount, 
      output: outputCount, 
      removed: inputCount - outputCount,
      passRate: `${passRate}%`
    });
  }

  // ============ PREFETCH ============

  prefetchInitiated(videoId: string, url: string, position: number) {
    const vm = this.getVideoMetrics(videoId);
    vm.manifestLoadStart = performance.now();
    this.log('PREFETCH', 'Prefetch INITIATED', { 
      url: url.slice(0, 60) + '...', 
      position,
      queueSize: this.metrics.videoMetrics.size
    }, videoId);
  }

  prefetchManifestLoaded(videoId: string, fromCache: boolean, duration: number) {
    const vm = this.getVideoMetrics(videoId);
    vm.manifestLoadEnd = performance.now();
    this.log('PREFETCH', 'Manifest LOADED', { 
      fromCache, 
      duration: `${duration}ms`,
      manifestTime: vm.manifestLoadStart ? `${Math.round(vm.manifestLoadEnd - vm.manifestLoadStart)}ms` : 'N/A'
    }, videoId);
  }

  prefetchSegmentLoaded(videoId: string, segmentIndex: number, fromCache: boolean, bytes: number) {
    if (segmentIndex === 0) {
      const vm = this.getVideoMetrics(videoId);
      vm.firstSegmentEnd = performance.now();
    }
    this.log('PREFETCH', `Segment ${segmentIndex} LOADED`, { 
      fromCache, 
      size: `${Math.round(bytes / 1024)}KB`
    }, videoId);
  }

  prefetchComplete(videoId: string, segmentCount: number, totalBytes: number) {
    this.log('PREFETCH', 'Prefetch COMPLETE', { 
      segments: segmentCount, 
      totalSize: `${Math.round(totalBytes / 1024)}KB`
    }, videoId);
  }

  prefetchFailed(videoId: string, error: string) {
    this.log('PREFETCH', 'Prefetch FAILED', { error }, videoId);
  }

  posterPrefetchStart(count: number) {
    this.log('PREFETCH', 'Poster prefetch started', { count });
  }

  posterPrefetchComplete(successCount: number, failCount: number) {
    this.log('PREFETCH', 'Poster prefetch complete', { successCount, failCount });
  }

  // ============ SCROLL & SNAP ============

  scrollStart() {
    this.scrollState.isScrolling = true;
    this.scrollState.scrollStartTime = performance.now();
    this.log('SCROLL', 'Scroll STARTED');
  }

  scrollEnd(duration: number) {
    this.scrollState.isScrolling = false;
    this.log('SCROLL', 'Scroll ENDED', { duration: `${duration}ms` });
  }

  scrollPosition(scrollTop: number, itemHeight: number, calculatedIndex: number) {
    this.log('SCROLL', 'Position update', { scrollTop, itemHeight, calculatedIndex });
  }

  snapIndexChange(oldIndex: number, newIndex: number, direction: 'up' | 'down') {
    this.scrollState.snapCount++;
    this.log('SNAP', 'Index CHANGED', { 
      from: oldIndex, 
      to: newIndex, 
      direction,
      totalSnaps: this.scrollState.snapCount
    });
  }

  snapSettled(index: number, settleTime: number) {
    this.log('SNAP', 'Snap SETTLED', { index, settleTime: `${settleTime}ms` });
  }

  // ============ MEDIA RUNTIME ============

  runtimeRegister(videoId: string, surface: string, sortIndex: number) {
    this.log('RUNTIME', 'Media REGISTERED', { surface, sortIndex }, videoId);
  }

  runtimeUnregister(videoId: string) {
    this.log('RUNTIME', 'Media UNREGISTERED', {}, videoId);
  }

  runtimeCandidateState(videoId: string, visible: boolean, ratio: number) {
    this.visibilityStates.set(videoId, { visible, ratio, lastUpdate: performance.now() });
    this.log('VISIBILITY', 'Candidate state', { visible, ratio: `${Math.round(ratio * 100)}%` }, videoId);
  }

  runtimePlayRequest(videoId: string, reason: string, surface: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.playRequestTime = performance.now();
    
    if (!this.metrics.firstPlayStart) {
      this.metrics.firstPlayStart = vm.playRequestTime;
    }
    
    this.log('RUNTIME', 'Play REQUEST', { reason, surface }, videoId);
  }

  runtimePlaySuccess(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.actualPlayTime = performance.now();
    
    if (vm.playRequestTime) {
      const requestToPlay = Math.round(vm.actualPlayTime - vm.playRequestTime);
      this.log('RUNTIME', 'Play SUCCESS', { 
        requestToPlay: `${requestToPlay}ms`
      }, videoId);
    } else {
      this.log('RUNTIME', 'Play SUCCESS', {}, videoId);
    }
  }

  runtimePlayFailed(videoId: string, reason: string) {
    this.log('RUNTIME', 'Play FAILED', { reason }, videoId);
  }

  runtimePauseRequest(videoId: string, reason: string) {
    this.log('RUNTIME', 'Pause REQUEST', { reason }, videoId);
  }

  runtimePrewarm(videoId: string) {
    this.log('RUNTIME', 'Prewarm requested', {}, videoId);
  }

  // ============ HLS PLAYER ============

  playerMount(videoId: string, src: string) {
    this.log('HLS_PLAYER', 'Component MOUNTED', { src: src.slice(0, 50) + '...' }, videoId);
  }

  playerUnmount(videoId: string) {
    this.log('HLS_PLAYER', 'Component UNMOUNTED', {}, videoId);
  }

  playerAttach(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.attachTime = performance.now();
    
    if (!this.metrics.firstVideoAttach) {
      this.metrics.firstVideoAttach = vm.attachTime;
    }
    
    this.log('HLS_PLAYER', 'HLS ATTACHED', {}, videoId);
  }

  playerDetach(videoId: string) {
    this.log('HLS_PLAYER', 'HLS DETACHED', {}, videoId);
  }

  playerManifestParsed(videoId: string, levels: number) {
    this.log('HLS_PLAYER', 'Manifest PARSED', { qualityLevels: levels }, videoId);
  }

  playerCanPlay(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.canPlayTime = performance.now();
    
    const attachToCanPlay = vm.attachTime 
      ? Math.round(vm.canPlayTime - vm.attachTime)
      : null;
    
    this.log('HLS_PLAYER', 'CAN PLAY', { 
      attachToCanPlay: attachToCanPlay ? `${attachToCanPlay}ms` : 'N/A'
    }, videoId);
  }

  playerFirstFrame(videoId: string) {
    const vm = this.getVideoMetrics(videoId);
    vm.firstFrameTime = performance.now();
    
    if (!this.metrics.firstFrameReady) {
      this.metrics.firstFrameReady = vm.firstFrameTime;
    }
    
    // Calculate time-to-first-frame from various points
    const fromAttach = vm.attachTime ? Math.round(vm.firstFrameTime - vm.attachTime) : null;
    const fromPlayRequest = vm.playRequestTime ? Math.round(vm.firstFrameTime - vm.playRequestTime) : null;
    
    vm.timeToFirstFrame = fromAttach;
    
    this.log('HLS_PLAYER', 'FIRST FRAME ready', { 
      fromAttach: fromAttach ? `${fromAttach}ms` : 'N/A',
      fromPlayRequest: fromPlayRequest ? `${fromPlayRequest}ms` : 'N/A'
    }, videoId);
  }

  playerBuffering(videoId: string, isBuffering: boolean) {
    this.log('HLS_PLAYER', isBuffering ? 'BUFFERING started' : 'BUFFERING ended', {}, videoId);
  }

  playerError(videoId: string, errorType: string, message: string, fatal: boolean) {
    this.log('HLS_PLAYER', 'ERROR', { errorType, message, fatal }, videoId);
  }

  playerStateChange(videoId: string, oldState: string, newState: string) {
    this.log('HLS_PLAYER', 'State change', { from: oldState, to: newState }, videoId);
  }

  // ============ AUTOPLAY ============

  autoplayMapChange(videoId: string, shouldAutoplay: boolean, source: string) {
    this.log('AUTOPLAY', `Autoplay ${shouldAutoplay ? 'ENABLED' : 'DISABLED'}`, { source }, videoId);
  }

  autoplayProtected(videoId: string, reason: string) {
    this.log('AUTOPLAY', 'Autoplay PROTECTED', { reason }, videoId);
  }

  autoplayBootstrap(videoId: string) {
    this.log('AUTOPLAY', 'Bootstrap first video', {}, videoId);
  }

  // ============ LIFECYCLE ============

  pageMount() {
    this.pageLoadTime = performance.now();
    this.log('LIFECYCLE', 'Clubhouse page MOUNTED');
  }

  pageUnmount() {
    this.log('LIFECYCLE', 'Clubhouse page UNMOUNTED');
  }

  feedReady(postCount: number) {
    this.metrics.firstPostRender = performance.now();
    const fromPageMount = Math.round(this.metrics.firstPostRender - this.pageLoadTime);
    
    this.log('LIFECYCLE', 'Feed READY', { 
      postCount, 
      fromPageMount: `${fromPageMount}ms`
    });
  }

  tabChange(from: string, to: string) {
    this.log('LIFECYCLE', 'Tab CHANGED', { from, to });
  }

  skeletonHide(reason: string) {
    this.log('LIFECYCLE', 'Skeleton HIDDEN', { reason });
  }

  // ============ PERFORMANCE SUMMARY ============

  printPerformanceSummary() {
    if (!this.enabled) return;
    
    console.log('\n%c╔══════════════════════════════════════════════════════════════╗', 'color: #f43f5e');
    console.log('%c║                    PERFORMANCE SUMMARY                        ║', 'color: #f43f5e; font-weight: bold;');
    console.log('%c╚══════════════════════════════════════════════════════════════╝', 'color: #f43f5e');
    
    const { fetchStart, fetchEnd, firstPostRender, firstVideoAttach, firstFrameReady, firstPlayStart } = this.metrics;
    
    console.log('\n%cGlobal Metrics:', 'font-weight: bold; font-size: 14px;');
    console.log(`  📊 Data Fetch:      ${fetchStart && fetchEnd ? `${Math.round(fetchEnd - fetchStart)}ms` : 'N/A'}`);
    console.log(`  🎨 First Render:    ${firstPostRender ? `${Math.round(firstPostRender - this.pageLoadTime)}ms` : 'N/A'}`);
    console.log(`  📎 First Attach:    ${firstVideoAttach ? `${Math.round(firstVideoAttach - this.pageLoadTime)}ms` : 'N/A'}`);
    console.log(`  🖼️ First Frame:     ${firstFrameReady ? `${Math.round(firstFrameReady - this.pageLoadTime)}ms` : 'N/A'}`);
    console.log(`  ▶️ First Play:      ${firstPlayStart ? `${Math.round(firstPlayStart - this.pageLoadTime)}ms` : 'N/A'}`);
    
    // Video-specific metrics
    if (this.metrics.videoMetrics.size > 0) {
      console.log('\n%cPer-Video Metrics:', 'font-weight: bold; font-size: 14px;');
      
      this.metrics.videoMetrics.forEach((vm, videoId) => {
        const shortId = videoId.slice(0, 8);
        console.log(`\n  %c[${shortId}]`, STYLES.videoId);
        if (vm.timeToFirstFrame) {
          console.log(`    ⏱️ Time-to-first-frame: ${vm.timeToFirstFrame}ms`);
        }
        if (vm.attachTime && vm.actualPlayTime) {
          console.log(`    ▶️ Attach-to-play: ${Math.round(vm.actualPlayTime - vm.attachTime)}ms`);
        }
      });
    }
    
    console.log('\n');
  }

  printTimeline(videoId?: string) {
    if (!this.enabled) return;
    
    const filtered = videoId 
      ? this.events.filter(e => e.videoId === videoId || !e.videoId)
      : this.events;
    
    console.log('\n%c╔══════════════════════════════════════════════════════════════╗', 'color: #60a5fa');
    console.log('%c║                    EVENT TIMELINE                             ║', 'color: #60a5fa; font-weight: bold;');
    console.log('%c╚══════════════════════════════════════════════════════════════╝\n', 'color: #60a5fa');
    
    filtered.forEach(event => {
      const relTime = Math.round(event.timestamp - this.pageLoadTime);
      const icon = ICONS[event.stage];
      console.log(
        `%c+${relTime.toString().padStart(6)}ms%c │ ${icon} %c${event.stage.padEnd(12)}%c │ ${event.event}`,
        STYLES.timing,
        'color: #4b5563',
        STYLES[event.stage],
        '',
        event.data || ''
      );
    });
    
    console.log('\n');
  }

  diagnose(videoId: string) {
    if (!this.enabled) return;
    
    const events = this.events.filter(e => e.videoId === videoId);
    const vm = this.metrics.videoMetrics.get(videoId);
    
    console.log('\n%c🔍 DIAGNOSIS FOR VIDEO:', 'font-weight: bold; font-size: 14px;', videoId);
    
    // Pipeline check
    const hasPrefetch = events.some(e => e.stage === 'PREFETCH' && e.event.includes('INITIATED'));
    const hasPrefetchComplete = events.some(e => e.stage === 'PREFETCH' && e.event.includes('COMPLETE'));
    const hasAttach = events.some(e => e.stage === 'HLS_PLAYER' && e.event.includes('ATTACHED'));
    const hasFirstFrame = events.some(e => e.stage === 'HLS_PLAYER' && e.event.includes('FIRST FRAME'));
    const hasPlaySuccess = events.some(e => e.stage === 'RUNTIME' && e.event.includes('Play SUCCESS'));
    const hasErrors = events.some(e => e.stage === 'HLS_PLAYER' && e.event.includes('ERROR'));
    
    console.log('\n%cPipeline Status:', 'font-weight: bold;');
    console.log(`  ${hasPrefetch ? '✅' : '❌'} Prefetch initiated`);
    console.log(`  ${hasPrefetchComplete ? '✅' : '⏳'} Prefetch complete`);
    console.log(`  ${hasAttach ? '✅' : '❌'} HLS attached`);
    console.log(`  ${hasFirstFrame ? '✅' : '⏳'} First frame ready`);
    console.log(`  ${hasPlaySuccess ? '✅' : '⏳'} Play success`);
    console.log(`  ${!hasErrors ? '✅' : '❌'} No errors`);
    
    if (vm) {
      console.log('\n%cTiming Breakdown:', 'font-weight: bold;');
      if (vm.attachTime && vm.canPlayTime) {
        console.log(`  📎→🎬 Attach to CanPlay: ${Math.round(vm.canPlayTime - vm.attachTime)}ms`);
      }
      if (vm.canPlayTime && vm.firstFrameTime) {
        console.log(`  🎬→🖼️ CanPlay to First Frame: ${Math.round(vm.firstFrameTime - vm.canPlayTime)}ms`);
      }
      if (vm.playRequestTime && vm.actualPlayTime) {
        console.log(`  ▶️→🔊 Play Request to Actual: ${Math.round(vm.actualPlayTime - vm.playRequestTime)}ms`);
      }
    }
    
    // Identify bottlenecks
    console.log('\n%cPotential Bottlenecks:', 'font-weight: bold;');
    
    if (!hasPrefetchComplete && hasAttach) {
      console.log('  ⚠️ Video attached before prefetch completed - cold start!');
    }
    
    if (vm?.timeToFirstFrame && vm.timeToFirstFrame > 500) {
      console.log(`  ⚠️ Slow time-to-first-frame: ${vm.timeToFirstFrame}ms (target: <500ms)`);
    }
    
    if (hasErrors) {
      console.log('  ⚠️ Errors detected - check event log for details');
    }
    
    console.log('\n');
  }

  clear() {
    this.events = [];
    this.metrics = {
      fetchStart: null,
      fetchEnd: null,
      firstPostRender: null,
      firstVideoAttach: null,
      firstFrameReady: null,
      firstPlayStart: null,
      videoMetrics: new Map(),
    };
    this.visibilityStates.clear();
    this.scrollState = {
      isScrolling: false,
      lastScrollTime: 0,
      scrollStartTime: 0,
      snapCount: 0,
    };
    console.log('%c[ClubhouseDebug] State cleared', STYLES.warning);
  }
}

// ============ Singleton Export ============

export const clubhouseDebug = new ClubhouseDebugger();

// Expose on window for console access
if (typeof window !== 'undefined') {
  (window as any).clubhouseDebug = clubhouseDebug;
}

// Type declaration for window
declare global {
  interface Window {
    clubhouseDebug: ClubhouseDebugger;
  }
}
