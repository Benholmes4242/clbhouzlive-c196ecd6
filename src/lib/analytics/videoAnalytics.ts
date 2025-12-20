/**
 * videoAnalytics.ts - Analytics tracking for video player events
 * 
 * Events tracked:
 * - video_open_full / video_close_full
 * - video_open_mini / video_close_mini
 * - queue_add / queue_remove / queue_clear
 * - autoplay_toggle / autoplay_next_play
 */

type VideoEventProps = Record<string, string | number | boolean | undefined>;

/**
 * Track a video analytics event
 * Currently logs to console - replace with your analytics provider
 */
export const trackVideoEvent = (name: string, props?: VideoEventProps) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[video:track]', name, props);
    }
    // Hook into analytics provider here:
    // posthog?.capture(name, props);
    // analytics.track(name, props);
  } catch {
    // Silent fail
  }
};

// Player lifecycle events
export const trackVideoOpenFull = (videoId: string, source: 'feed' | 'queue' | 'upnext' | 'miniplayer' | 'direct') => {
  trackVideoEvent('video_open_full', { videoId, source });
};

export const trackVideoCloseFull = (videoId: string, progressSeconds: number) => {
  trackVideoEvent('video_close_full', { videoId, progressSeconds: Math.round(progressSeconds) });
};

export const trackVideoOpenMini = (videoId: string, source: 'close_full' | 'queue' | 'ended') => {
  trackVideoEvent('video_open_mini', { videoId, source });
};

export const trackVideoCloseMini = (videoId: string, progressSeconds: number) => {
  trackVideoEvent('video_close_mini', { videoId, progressSeconds: Math.round(progressSeconds) });
};

// Queue events
export const trackQueueAdd = (videoId: string, mode: 'enqueue' | 'play_next', source: 'tile' | 'sidebar' | 'drawer') => {
  trackVideoEvent('queue_add', { videoId, mode, source });
};

export const trackQueueRemove = (videoId: string, source: 'drawer' | 'tile') => {
  trackVideoEvent('queue_remove', { videoId, source });
};

export const trackQueueClear = (count: number) => {
  trackVideoEvent('queue_clear', { count });
};

// Autoplay events
export const trackAutoplayToggle = (enabled: boolean) => {
  trackVideoEvent('autoplay_toggle', { enabled });
};

export const trackAutoplayNextPlay = (fromVideoId: string, toVideoId: string, mode: 'overlay_auto' | 'overlay_play_now') => {
  trackVideoEvent('autoplay_next_play', { fromVideoId, toVideoId, mode });
};
