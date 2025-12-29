/**
 * Debug utilities for Watch Page issues
 * 
 * Issues being tracked:
 * 1. Timer not counting down with video autoplay
 * 2. Only 5 cards loading instead of 20
 * 3. Infinite scroll needing double-scroll
 * 
 * Usage: Import and call the log functions in relevant components
 * All logging is controlled by DEBUG_WATCH_PAGE flag
 */

export const DEBUG_WATCH_PAGE = true;

const getTimestamp = () => performance.now().toFixed(2);

// Color-coded log categories
const COLORS = {
  timer: '#9333ea',      // Purple
  cards: '#ec4899',      // Pink
  scroll: '#f59e0b',     // Amber
  loading: '#f97316',    // Orange
  success: '#16a34a',    // Green
  error: '#dc2626',      // Red
  info: '#3b82f6',       // Blue
  visibility: '#0891b2', // Cyan
};

// ============ Timer Debug Logging ============

export const logTimerMount = (videoId: string, data?: Record<string, any>) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] VideoTile Mounted`,
    `color: ${COLORS.timer}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8), ...data }
  );
};

export const logTimerUnmount = (videoId: string) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] VideoTile Unmounted`,
    `color: ${COLORS.error}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8) }
  );
};

export const logTimerStateChange = (videoId: string, currentTime: number, duration: number) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] Timer State Changed`,
    `color: ${COLORS.info}; font-weight: bold`,
    {
      videoId: videoId?.slice(0, 8),
      currentTime,
      duration,
      progress: duration > 0 ? `${((currentTime / duration) * 100).toFixed(1)}%` : '0%',
    }
  );
};

export const logVideoPlayState = (videoId: string, data: {
  isPlaying?: boolean;
  isVisible?: boolean;
  isInViewport?: boolean;
  visibilityRatio?: number;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] Video Play State`,
    `color: ${COLORS.success}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8), ...data }
  );
};

export const logTimerStart = (videoId: string, startTime: number) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] ▶️ START Timer`,
    `color: ${COLORS.success}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8), startTime }
  );
};

export const logTimerStop = (videoId: string, stoppedAt: number) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] ⏸️ STOP Timer`,
    `color: ${COLORS.error}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8), stoppedAt }
  );
};

export const logTimerPaused = (videoId: string, reason: string) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [Timer Debug] ⏸️ Timer Paused`,
    `color: ${COLORS.loading}; font-weight: bold`,
    { videoId: videoId?.slice(0, 8), reason }
  );
};

// ============ Cards Debug Logging ============

export const logGridMount = () => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: ${COLORS.cards}; font-weight: bold`);
  console.log(`%c[${getTimestamp()}ms] [Cards Debug] 🎬 VideosGrid MOUNTED`, `color: ${COLORS.cards}; font-weight: bold; font-size: 14px`);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: ${COLORS.cards}; font-weight: bold`);
};

export const logVideosArrayUpdate = (videos: any[], source: string = 'unknown') => {
  if (!DEBUG_WATCH_PAGE) return;
  console.group(`%c[${getTimestamp()}ms] [Cards Debug] 📊 Videos Array Updated (${source})`, `color: ${COLORS.timer}; font-weight: bold`);
  console.log('Total videos in array:', videos?.length || 0);
  console.log('First 10 videos:', videos?.slice(0, 10).map(v => ({
    id: v?.id?.slice(0, 8),
    title: v?.title?.substring(0, 30),
    type: v?.type || v?.kind,
  })));
  console.groupEnd();
};

export const logLazyTilesState = (data: {
  initialVisible: number;
  totalItems: number;
  visibleCount: number;
  visibleIndices: number[];
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.group(`%c[${getTimestamp()}ms] [Cards Debug] 👁️ Lazy Tiles State`, `color: ${COLORS.visibility}; font-weight: bold`);
  console.log('initialVisible config:', data.initialVisible);
  console.log('Total items:', data.totalItems);
  console.log('Visible indices count:', data.visibleCount);
  console.log('Visible indices (first 20):', data.visibleIndices.slice(0, 20));
  console.groupEnd();
};

export const logRenderedCards = () => {
  if (!DEBUG_WATCH_PAGE) return;
  setTimeout(() => {
    const renderedCards = document.querySelectorAll('[data-lazy-index]');
    const visibleCards = Array.from(renderedCards).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    });

    console.group(`%c[${getTimestamp()}ms] [Cards Debug] 🖼️ RENDERED CARDS IN DOM`, `color: ${COLORS.success}; font-weight: bold; font-size: 14px`);
    console.log('Total rendered (data-lazy-index):', renderedCards.length);
    console.log('Visible (height > 0):', visibleCards.length);
    console.log('Rendered indices:', Array.from(renderedCards).slice(0, 20).map(el => el.getAttribute('data-lazy-index')));
    console.groupEnd();
  }, 100);
};

export const logDataFetch = (data: {
  pagesLoaded?: number;
  firstPageCount?: number;
  totalItems?: number;
  filterKey?: string;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.group(`%c[${getTimestamp()}ms] [Cards Debug] 🔄 Data Fetch State`, `color: ${COLORS.timer}; font-weight: bold`);
  console.log('Filter key:', data.filterKey);
  console.log('First page count:', data.firstPageCount);
  console.log('Total items:', data.totalItems);
  console.groupEnd();
};

// ============ Infinite Scroll Debug Logging ============

export const logObserverSetup = (config: {
  rootMargin: string;
  threshold: number;
  hasSentinel: boolean;
  sentinelRect?: DOMRect;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: ${COLORS.scroll}; font-weight: bold`);
  console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] 🔍 Setting Up Observer`, `color: ${COLORS.scroll}; font-weight: bold; font-size: 14px`);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: ${COLORS.scroll}; font-weight: bold`);
  
  if (!config.hasSentinel) {
    console.error(`%c[${getTimestamp()}ms] [Infinite Scroll] ❌ NO SENTINEL ELEMENT!`, `color: ${COLORS.error}; font-weight: bold; font-size: 16px`);
  } else {
    console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] ✅ Sentinel Found`, `color: ${COLORS.success}; font-weight: bold`, {
      rect: config.sentinelRect,
      rootMargin: config.rootMargin,
      threshold: config.threshold,
    });
  }
};

export const logObserverCallback = (data: {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRect;
  hasMore: boolean;
  isLoading: boolean;
  willTrigger: boolean;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: #a855f7; font-weight: bold`);
  console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] 🔔 OBSERVER CALLBACK FIRED`, `color: #a855f7; font-weight: bold; font-size: 16px`);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', `color: #a855f7; font-weight: bold`);
  
  console.group(`%c[${getTimestamp()}ms] [Infinite Scroll] 📍 Intersection Entry`, `color: ${COLORS.visibility}; font-weight: bold`);
  console.log('isIntersecting:', data.isIntersecting);
  console.log('intersectionRatio:', data.intersectionRatio);
  console.log('boundingClientRect.top:', data.boundingClientRect.top);
  console.log('boundingClientRect.bottom:', data.boundingClientRect.bottom);
  console.groupEnd();

  console.group(`%c[${getTimestamp()}ms] [Infinite Scroll] 🎛️ Ref States`, `color: ${COLORS.timer}; font-weight: bold`);
  console.log('hasMore:', data.hasMore ? '✅ YES' : '❌ NO');
  console.log('isLoading:', data.isLoading ? '⏳ YES (loading)' : '✅ NO (ready)');
  console.groupEnd();

  console.group(`%c[${getTimestamp()}ms] [Infinite Scroll] ✅ Condition Checks`, `color: ${COLORS.success}; font-weight: bold`);
  console.log('isIntersecting?', data.isIntersecting ? '✅ YES' : '❌ NO');
  console.log('hasMore?', data.hasMore ? '✅ YES' : '❌ NO');
  console.log('!isLoading?', !data.isLoading ? '✅ YES' : '❌ NO (is loading)');
  console.log('WILL TRIGGER LOAD?', data.willTrigger ? '✅ YES' : '❌ NO');
  console.groupEnd();

  if (data.willTrigger) {
    console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] 🚀 TRIGGERING LOAD MORE!`, `color: ${COLORS.success}; font-weight: bold; font-size: 18px`);
  } else {
    console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] ⏸️ NOT TRIGGERING - Conditions not met`, `color: ${COLORS.loading}; font-weight: bold`);
    if (!data.isIntersecting) {
      console.log(`%c  Reason: Sentinel not intersecting viewport`, `color: ${COLORS.loading}`);
    }
    if (!data.hasMore) {
      console.log(`%c  Reason: No more content (hasMore = false)`, `color: ${COLORS.loading}`);
    }
    if (data.isLoading) {
      console.log(`%c  Reason: Already loading (isLoading = true)`, `color: ${COLORS.loading}`);
    }
  }
};

export const logScrollPosition = (data: {
  sentinelTop: number;
  viewportHeight: number;
  distanceFromBottom: number;
  scrollY: number;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  // Only log when near sentinel (within 600px)
  if (Math.abs(data.distanceFromBottom) > 600) return;
  
  console.log(`%c[${getTimestamp()}ms] [Scroll Tracking] 📏 Sentinel Position`, `color: #6366f1; font-weight: bold`, {
    distanceFromViewportBottom: data.distanceFromBottom,
    sentinelTop: data.sentinelTop,
    viewportHeight: data.viewportHeight,
    withinRootMargin: data.distanceFromBottom < 400,
    scrollY: data.scrollY,
  });
};

export const logLoadMore = (data: {
  currentCount: number;
  hasMore: boolean;
  isLoading: boolean;
  action: 'called' | 'skipped' | 'success' | 'error';
  newItemsCount?: number;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  const color = data.action === 'success' ? COLORS.success : 
                data.action === 'error' ? COLORS.error : 
                data.action === 'skipped' ? COLORS.loading : COLORS.info;
  
  console.log(
    `%c[${getTimestamp()}ms] [Loading State] ${data.action === 'called' ? '🚀' : data.action === 'success' ? '✅' : data.action === 'error' ? '❌' : '⏸️'} LOAD MORE ${data.action.toUpperCase()}`,
    `color: ${color}; font-weight: bold; font-size: 14px`,
    {
      currentCount: data.currentCount,
      hasMore: data.hasMore,
      isLoading: data.isLoading,
      newItemsCount: data.newItemsCount,
    }
  );
};

export const logObserverDisconnect = () => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(`%c[${getTimestamp()}ms] [Infinite Scroll] 🔌 DISCONNECTING Observer`, `color: ${COLORS.error}; font-weight: bold`);
};

// ============ MediaRuntime Debug Logging ============

export const logMediaRuntimeVisibility = (mediaId: string, data: {
  visibilityRatio: number;
  isVisible: boolean;
  isCandidate: boolean;
  activeIds: string[];
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [MediaRuntime] 👁️ Visibility Update`,
    `color: ${COLORS.visibility}; font-weight: bold`,
    { mediaId: mediaId?.slice(0, 8), ...data }
  );
};

export const logMediaRuntimePlayRequest = (mediaId: string, data: {
  surface: string;
  reason: string;
  granted: boolean;
}) => {
  if (!DEBUG_WATCH_PAGE) return;
  console.log(
    `%c[${getTimestamp()}ms] [MediaRuntime] ${data.granted ? '▶️' : '⏸️'} Play Request ${data.granted ? 'GRANTED' : 'DENIED'}`,
    `color: ${data.granted ? COLORS.success : COLORS.loading}; font-weight: bold`,
    { mediaId: mediaId?.slice(0, 8), ...data }
  );
};
