// Telemetry utility for tracking profile media events
export const telemetry = {
  track: (eventName: string, properties?: Record<string, any>) => {
    // For now, just log to console
    // In production, this would send to analytics service
    console.log(`📊 Telemetry: ${eventName}`, properties);
    
    // Future: Send to analytics service
    // analytics.track(eventName, properties);
  }
};

export const profileMediaEvents = {
  // Media management events
  mediaAdded: (mediaId: string, mediaType: 'image' | 'video', fileSize: number) => {
    telemetry.track('profileMedia.added', {
      mediaId,
      mediaType,
      fileSize,
      timestamp: Date.now()
    });
  },

  mediaRemoved: (mediaId: string, mediaType: 'image' | 'video') => {
    telemetry.track('profileMedia.removed', {
      mediaId,
      mediaType,
      timestamp: Date.now()
    });
  },

  mediaReordered: (userId: string, newOrder: string[]) => {
    telemetry.track('profileMedia.reordered', {
      userId,
      newOrder,
      itemCount: newOrder.length,
      timestamp: Date.now()
    });
  },

  mediaSaved: (userId: string, totalItems: number) => {
    telemetry.track('profileMedia.saved', {
      userId,
      totalItems,
      timestamp: Date.now()
    });
  },

  // Header extension events
  headerExtendStarted: (mediaId: string, mediaType: 'image' | 'video') => {
    telemetry.track('headerExtend.started', {
      mediaId,
      mediaType,
      timestamp: Date.now()
    });
  },

  headerExtendSucceeded: (mediaId: string, duration: number, method: string, bytesOut: number) => {
    telemetry.track('headerExtend.succeeded', {
      mediaId,
      duration,
      method,
      bytesOut,
      timestamp: Date.now()
    });
  },

  headerExtendFallback: (mediaId: string, reason: string) => {
    telemetry.track('headerExtend.fallback', {
      mediaId,
      reason,
      timestamp: Date.now()
    });
  },

  headerExtendFailed: (mediaId: string, error: string, duration?: number) => {
    telemetry.track('headerExtend.failed', {
      mediaId,
      error,
      duration,
      timestamp: Date.now()
    });
  },

  // Carousel interaction events  
  slideChanged: (fromIndex: number, toIndex: number, mediaId: string) => {
    telemetry.track('profileMedia.slideChanged', {
      fromIndex,
      toIndex,
      mediaId,
      timestamp: Date.now()
    });
  },

  videoPlaybackStarted: (mediaId: string, duration: number) => {
    telemetry.track('profileMedia.videoPlay', {
      mediaId,
      duration,
      timestamp: Date.now()
    });
  },

  videoPlaybackPaused: (mediaId: string, currentTime: number) => {
    telemetry.track('profileMedia.videoPause', {
      mediaId,
      currentTime,
      timestamp: Date.now()
    });
  },

  videoUnmuted: (mediaId: string) => {
    telemetry.track('profileMedia.videoUnmute', {
      mediaId,
      timestamp: Date.now()
    });
  }
};