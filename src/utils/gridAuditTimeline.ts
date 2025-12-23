/**
 * Grid & Video Tile Audit Timeline
 * Performance instrumentation for video surfaces beyond Clubhouse
 * 
 * Add timestamped logs for:
 * - Hero video events
 * - Grid item events
 * - Error/retry triggers
 */

// Enable/disable audit logging
export const DEBUG_GRID_AUDIT = true;

// Session start time for relative timestamps
const sessionStart = performance.now();

interface AuditEvent {
  timestamp: number;
  event: string;
  surface: 'hero' | 'grid' | 'tile' | 'shorts';
  data?: Record<string, any>;
}

// Store events for later analysis
const auditEvents: AuditEvent[] = [];

// Log helper
const log = (event: string, surface: AuditEvent['surface'], data?: Record<string, any>) => {
  if (!DEBUG_GRID_AUDIT) return;
  
  const timestamp = performance.now() - sessionStart;
  const entry: AuditEvent = { timestamp, event, surface, data };
  auditEvents.push(entry);
  
  const shortData = data ? Object.entries(data)
    .map(([k, v]) => `${k}=${typeof v === 'string' && v.length > 20 ? v.slice(0, 20) + '...' : v}`)
    .join(' ') : '';
  
  console.log(`[${timestamp.toFixed(2)}ms] [GridAudit:${surface.toUpperCase()}] ${event}`, shortData);
};

// ============ Hero Video Events ============

export const logHeroMount = (itemId: string, mediaType: string) => {
  log('HERO_VIDEO_MOUNT', 'hero', { itemId: itemId.slice(0, 8), mediaType });
};

export const logHeroPosterLoad = (itemId: string) => {
  log('HERO_VIDEO_POSTER_LOAD', 'hero', { itemId: itemId.slice(0, 8) });
};

export const logHeroHlsLoadStart = (itemId: string, src: string) => {
  log('HERO_VIDEO_HLS_LOAD_START', 'hero', { itemId: itemId.slice(0, 8), src: src.slice(0, 50) });
};

export const logHeroCanplay = (itemId: string, readyState: number) => {
  log('HERO_VIDEO_CANPLAY', 'hero', { itemId: itemId.slice(0, 8), readyState });
};

export const logHeroPlaying = (itemId: string) => {
  log('HERO_VIDEO_PLAYING', 'hero', { itemId: itemId.slice(0, 8) });
};

export const logHeroError = (itemId: string, error: string) => {
  log('HERO_VIDEO_ERROR', 'hero', { itemId: itemId.slice(0, 8), error });
};

export const logHeroLoadedData = (itemId: string, currentTime: number) => {
  log('HERO_VIDEO_LOADED_DATA', 'hero', { itemId: itemId.slice(0, 8), currentTime });
};

// ============ Grid Events ============

export const logGridMount = (surface: string, itemCount: number) => {
  log('GRID_MOUNT', 'grid', { surface, itemCount });
};

export const logGridDataReady = (surface: string, itemCount: number) => {
  log('GRID_DATA_READY', 'grid', { surface, itemCount });
};

export const logGridItemRender = (postId: string, index: number, isVideo: boolean) => {
  log('GRID_ITEM_RENDER', 'tile', { postId: postId.slice(0, 8), index, isVideo });
};

export const logGridItemIntersect = (postId: string, ratio: number, isVisible: boolean) => {
  log('GRID_ITEM_INTERSECT', 'tile', { postId: postId.slice(0, 8), ratio: ratio.toFixed(2), isVisible });
};

export const logGridItemAttach = (postId: string, readyState: number) => {
  log('GRID_ITEM_ATTACH', 'tile', { postId: postId.slice(0, 8), readyState });
};

export const logGridItemPlayAttempt = (postId: string, source: string) => {
  log('GRID_ITEM_PLAY_ATTEMPT', 'tile', { postId: postId.slice(0, 8), source });
};

export const logGridItemPlaySuccess = (postId: string, timeToPlay: number) => {
  log('GRID_ITEM_PLAY_SUCCESS', 'tile', { postId: postId.slice(0, 8), timeToPlayMs: timeToPlay.toFixed(2) });
};

export const logGridItemPlayFail = (postId: string, reason: string) => {
  log('GRID_ITEM_PLAY_FAIL', 'tile', { postId: postId.slice(0, 8), reason });
};

// ============ Shorts Events ============

export const logShortsCardMount = (itemId: string, gridPosition: number) => {
  log('SHORTS_CARD_MOUNT', 'shorts', { itemId: itemId.slice(0, 8), gridPosition });
};

export const logShortsCardVisibilityChange = (itemId: string, isVisible: boolean, gridPosition: number) => {
  log('SHORTS_CARD_VISIBILITY', 'shorts', { itemId: itemId.slice(0, 8), isVisible, gridPosition });
};

export const logShortsAutoplayDecision = (itemId: string, shouldPlay: boolean, reason: string) => {
  log('SHORTS_AUTOPLAY_DECISION', 'shorts', { itemId: itemId.slice(0, 8), shouldPlay, reason });
};

// ============ Error Events ============

export const logRetryShown = (surface: string, mediaId: string, errorCode?: number) => {
  log('RETRY_OVERLAY_SHOWN', 'tile', { surface, mediaId: mediaId.slice(0, 8), errorCode });
};

export const logRetryClicked = (surface: string, mediaId: string) => {
  log('RETRY_OVERLAY_CLICKED', 'tile', { surface, mediaId: mediaId.slice(0, 8) });
};

// ============ Analysis Helpers ============

export const getAuditEvents = () => [...auditEvents];

export const getAuditSummary = () => {
  const byEvent = new Map<string, number>();
  const bySurface = new Map<string, number>();
  
  auditEvents.forEach(e => {
    byEvent.set(e.event, (byEvent.get(e.event) || 0) + 1);
    bySurface.set(e.surface, (bySurface.get(e.surface) || 0) + 1);
  });
  
  return {
    totalEvents: auditEvents.length,
    byEvent: Object.fromEntries(byEvent),
    bySurface: Object.fromEntries(bySurface),
    firstEvent: auditEvents[0],
    lastEvent: auditEvents[auditEvents.length - 1],
    totalDuration: auditEvents.length > 0 
      ? auditEvents[auditEvents.length - 1].timestamp - auditEvents[0].timestamp 
      : 0,
  };
};

export const printAuditSummary = () => {
  const summary = getAuditSummary();
  console.log('\n[GridAudit] ========== SUMMARY ==========');
  console.log('Total events:', summary.totalEvents);
  console.log('Total duration:', summary.totalDuration.toFixed(2), 'ms');
  console.log('By surface:', summary.bySurface);
  console.log('By event:', summary.byEvent);
  console.log('==========================================\n');
};

// Expose for console debugging
if (typeof window !== 'undefined') {
  (window as any).__gridAudit = {
    getEvents: getAuditEvents,
    getSummary: getAuditSummary,
    printSummary: printAuditSummary,
  };
}
