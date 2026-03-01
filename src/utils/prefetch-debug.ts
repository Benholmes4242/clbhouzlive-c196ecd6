// =============================================================================
// VIDEO PREFETCH PIPELINE DEBUG LOGGER
// =============================================================================

type LogLevel = 'info' | 'success' | 'warn' | 'error';

interface PrefetchDebugEvent {
  timestamp: number;
  component: string;
  event: string;
  videoId: string;
  details?: Record<string, any>;
}

class PrefetchDebugger {
  private events: PrefetchDebugEvent[] = [];
  private enabled = false; // Disabled for production — enable via prefetchDebug.enable() in console
  private prefetchTimings: Map<string, number> = new Map();
  private cacheHits: Map<string, boolean> = new Map();

  private styles = {
    info: 'color: #60a5fa; font-weight: bold;',
    success: 'color: #34d399; font-weight: bold;',
    warn: 'color: #fbbf24; font-weight: bold;',
    error: 'color: #f87171; font-weight: bold;',
    component: 'color: #a78bfa; font-weight: bold;',
    videoId: 'color: #f472b6;',
    timing: 'color: #2dd4bf;',
  };

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  private log(level: LogLevel, component: string, event: string, videoId: string, details?: Record<string, any>) {
    if (!this.enabled) return;

    const timestamp = performance.now();
    const entry: PrefetchDebugEvent = { timestamp, component, event, videoId, details };
    this.events.push(entry);

    const icon = level === 'success' ? '✅' : level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📍';
    const shortId = videoId.slice(0, 8);
    
    console.log(
      `%c[PREFETCH]%c ${icon} %c${component}%c → ${event} %c[${shortId}]`,
      this.styles[level],
      '',
      this.styles.component,
      '',
      this.styles.videoId,
      details || ''
    );
  }

  // PREFETCH PHASE
  prefetchInitiated(videoId: string, hlsUrl: string) {
    this.prefetchTimings.set(videoId, performance.now());
    this.log('info', 'hlsPreload', 'Prefetch INITIATED', videoId, { hlsUrl: hlsUrl.slice(0, 60) });
  }

  manifestLoaded(videoId: string, fromCache: boolean) {
    const startTime = this.prefetchTimings.get(videoId);
    const elapsed = startTime ? Math.round(performance.now() - startTime) : '?';
    this.log('success', 'hlsPreload', `Manifest loaded (${elapsed}ms, cache=${fromCache})`, videoId);
  }

  segmentLoaded(videoId: string, segmentIndex: number, fromCache: boolean, byteSize: number) {
    this.log('success', 'hlsPreload', `Segment ${segmentIndex} loaded (cache=${fromCache}, ${Math.round(byteSize/1024)}KB)`, videoId);
  }

  prefetchComplete(videoId: string, segmentCount: number) {
    const startTime = this.prefetchTimings.get(videoId);
    const elapsed = startTime ? Math.round(performance.now() - startTime) : '?';
    this.log('success', 'hlsPreload', `Prefetch COMPLETE (${elapsed}ms, ${segmentCount} segments)`, videoId);
  }

  prefetchFailed(videoId: string, error: string) {
    this.log('error', 'hlsPreload', `Prefetch FAILED: ${error}`, videoId);
  }

  // READY QUEUE
  readyQueueInitiate(videoId: string, position: number) {
    this.log('info', 'ReadyQueue', `initiatePrefetch called (position=${position})`, videoId);
  }

  readyQueueMarkedReady(videoId: string, source: string) {
    this.log('success', 'ReadyQueue', `Marked READY (source=${source})`, videoId);
  }

  readyQueueCheck(videoId: string, isReady: boolean) {
    const level = isReady ? 'success' : 'warn';
    this.log(level, 'ReadyQueue', `Ready check: ${isReady ? 'YES' : 'NO'}`, videoId);
  }

  // MEDIA RUNTIME
  runtimePrewarm(videoId: string) {
    this.log('info', 'MediaRuntime', 'prewarmCandidate called', videoId);
  }

  runtimePrewarmAttach(videoId: string, wasAlreadyAttached: boolean) {
    if (wasAlreadyAttached) {
      this.log('warn', 'MediaRuntime', 'prewarm skipped (already attached)', videoId);
    } else {
      this.log('success', 'MediaRuntime', 'prewarm triggered attach()', videoId);
    }
  }

  runtimeRequestPlay(videoId: string, generation: number) {
    this.log('info', 'MediaRuntime', `requestPlay (gen=${generation})`, videoId);
  }

  runtimePlaySuccess(videoId: string) {
    this.log('success', 'MediaRuntime', 'Play succeeded', videoId);
  }

  runtimePlayFailed(videoId: string, reason: string) {
    this.log('error', 'MediaRuntime', `Play failed: ${reason}`, videoId);
  }

  // HLS PLAYER
  playerMount(videoId: string, src: string) {
    this.log('info', 'HLSPlayer', 'Component MOUNTED', videoId, { src: src.slice(0, 50) + '...' });
  }

  playerUnmount(videoId: string) {
    this.log('info', 'HLSPlayer', 'Component UNMOUNTED', videoId);
  }

  playerAttach(videoId: string, wasDetached: boolean) {
    this.log('info', 'HLSPlayer', `attach() called (wasDetached=${wasDetached})`, videoId);
  }

  playerHlsCreated(videoId: string) {
    this.log('info', 'HLSPlayer', 'HLS.js instance created', videoId);
  }

  playerManifestParsed(videoId: string, levels: number) {
    this.log('success', 'HLSPlayer', `HLS manifest parsed (${levels} quality levels)`, videoId);
  }

  playerFirstFrameReady(videoId: string, timeToFirstFrame: number) {
    this.log('success', 'HLSPlayer', `FIRST FRAME ready (${timeToFirstFrame}ms)`, videoId);
  }

  playerSpinnerShown(videoId: string, reason: string) {
    this.log('warn', 'HLSPlayer', `Spinner SHOWN: ${reason}`, videoId);
  }

  playerSpinnerHidden(videoId: string, totalSpinnerTime: number) {
    this.log('success', 'HLSPlayer', `Spinner HIDDEN (visible for ${totalSpinnerTime}ms)`, videoId);
  }

  playerStateReset(videoId: string, reason: string) {
    this.log('warn', 'HLSPlayer', `State RESET: ${reason}`, videoId);
  }

  playerCacheHit(videoId: string, action: string) {
    this.log('success', 'HLSPlayer', `CACHE HIT → ${action} (skipped spinner)`, videoId);
  }

  // CACHE VERIFICATION - checks HlsBlobCache (in-memory), not browser Cache API
  verifyCacheStatus(videoId: string, _hlsUrl: string): boolean {
    // Import dynamically to avoid circular dependency issues
    // The hlsBlobCache is the actual storage mechanism used by prefetch
    try {
      // Access global singleton directly (exposed on window for debugging)
      const blobCache = typeof window !== 'undefined' ? (window as any).hlsBlobCache : null;
      if (!blobCache) {
        this.log('warn', 'CacheCheck', 'hlsBlobCache not available', videoId);
        return false;
      }
      
      const isReady = blobCache.isReady(videoId);
      const stats = blobCache.getStats(videoId);
      
      this.cacheHits.set(videoId, isReady);
      
      if (isReady && stats) {
        this.log('success', 'CacheCheck', `BLOB CACHE HIT (${stats.segmentCount} segments, ${Math.round(stats.totalBytes/1024)}KB)`, videoId);
      } else if (stats) {
        this.log('warn', 'CacheCheck', `In cache but NOT READY (${stats.segmentCount} segments)`, videoId);
      } else {
        this.log('error', 'CacheCheck', 'NOT IN blob cache', videoId);
      }
      
      return isReady;
    } catch {
      this.log('error', 'CacheCheck', 'Cache check failed', videoId);
      return false;
    }
  }

  // TIMELINE VIEW
  printTimeline(videoId?: string) {
    const filtered = videoId 
      ? this.events.filter(e => e.videoId === videoId)
      : this.events;

    console.log('\n%c═══════════════════════════════════════════════════════════════', 'color: #60a5fa');
    console.log('%c  PREFETCH PIPELINE TIMELINE', 'color: #60a5fa; font-weight: bold; font-size: 14px;');
    console.log('%c═══════════════════════════════════════════════════════════════\n', 'color: #60a5fa');

    const startTime = filtered[0]?.timestamp || 0;
    
    filtered.forEach(event => {
      const relativeTime = Math.round(event.timestamp - startTime);
      console.log(
        `%c+${relativeTime.toString().padStart(5)}ms%c │ %c${event.component.padEnd(12)}%c │ ${event.event}`,
        this.styles.timing,
        'color: #4b5563',
        this.styles.component,
        ''
      );
    });

    console.log('\n%c═══════════════════════════════════════════════════════════════\n', 'color: #60a5fa');
  }

  // DIAGNOSIS
  diagnose(videoId: string) {
    const events = this.events.filter(e => e.videoId === videoId);
    
    console.log('\n%c🔍 DIAGNOSIS FOR VIDEO: ' + videoId, 'color: #f472b6; font-weight: bold; font-size: 14px;');
    
    const hasPrefetchInit = events.some(e => e.event.includes('Prefetch INITIATED'));
    const hasPrefetchComplete = events.some(e => e.event.includes('Prefetch COMPLETE'));
    const hasPlayerMount = events.some(e => e.event.includes('MOUNTED'));
    const hasFirstFrame = events.some(e => e.event.includes('FIRST FRAME'));
    const hadSpinner = events.some(e => e.event.includes('Spinner SHOWN'));
    
    const prefetchCompleteEvent = events.find(e => e.event.includes('Prefetch COMPLETE'));
    const playerMountEvent = events.find(e => e.event.includes('MOUNTED'));
    
    console.log('\n%cPipeline Status:', 'font-weight: bold;');
    console.log(`  ${hasPrefetchInit ? '✅' : '❌'} Prefetch initiated`);
    console.log(`  ${hasPrefetchComplete ? '✅' : '❌'} Prefetch completed`);
    console.log(`  ${hasPlayerMount ? '✅' : '❌'} Player mounted`);
    console.log(`  ${hasFirstFrame ? '✅' : '❌'} First frame ready`);
    console.log(`  ${!hadSpinner ? '✅' : '⚠️'} Spinner ${hadSpinner ? 'was shown (BAD)' : 'avoided (GOOD)'}`);
    
    if (prefetchCompleteEvent && playerMountEvent) {
      const gap = playerMountEvent.timestamp - prefetchCompleteEvent.timestamp;
      if (gap < 0) {
        console.log(`\n%c⚠️ PROBLEM: Player mounted ${Math.abs(Math.round(gap))}ms BEFORE prefetch completed!`, 'color: #f87171; font-weight: bold;');
      } else {
        console.log(`\n%c✅ Prefetch completed ${Math.round(gap)}ms before player mounted`, 'color: #34d399;');
      }
    }
    
    if (hasPrefetchComplete && hadSpinner) {
      console.log(`\n%c⚠️ PROBLEM: Prefetch completed but spinner still shown!`, 'color: #f87171; font-weight: bold;');
      console.log('   This confirms the handoff mechanism is broken.');
    }
    
    const cacheStatus = this.cacheHits.get(videoId);
    if (cacheStatus !== undefined) {
      console.log(`\n%cCache Status: ${cacheStatus ? '✅ HIT' : '❌ MISS'}`, cacheStatus ? 'color: #34d399;' : 'color: #f87171;');
    }
    
    console.log('\n');
  }

  clear() {
    this.events = [];
    this.prefetchTimings.clear();
    this.cacheHits.clear();
  }
}

export const prefetchDebug = new PrefetchDebugger();

if (typeof window !== 'undefined') {
  (window as any).prefetchDebug = prefetchDebug;
}

// Debug banner disabled for production
// To enable: prefetchDebug.enable() in console
