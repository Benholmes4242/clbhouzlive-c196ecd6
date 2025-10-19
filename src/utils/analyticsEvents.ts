// Analytics event tracking utility
// Can be integrated with Google Analytics, Mixpanel, etc.

type EventParams = Record<string, any>;

export const analyticsEvents = {
  track: (eventName: string, params?: EventParams) => {
    // Console log for development
    console.log(`[Analytics] ${eventName}`, params);
    
    // TODO: Integrate with your analytics provider
    // Example: window.gtag?.('event', eventName, params);
    // Example: window.mixpanel?.track(eventName, params);
  },

  // Shorts squircle specific events
  shortsSquircle: {
    avatarClick: (creatorId: string, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_avatar_click', {
        creator_id: creatorId,
        position_index: positionIndex,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    nameClick: (username: string, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_name_click', {
        username,
        position_index: positionIndex,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    followToggle: (creatorId: string, isFollowing: boolean, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_follow_toggle', {
        creator_id: creatorId,
        is_following: isFollowing,
        position_index: positionIndex,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    plusClick: () => {
      analyticsEvents.track('shorts_squircle_plus_click', {
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    empty: () => {
      analyticsEvents.track('shorts_squircle_empty', {
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    }
  },

  // Videos tab specific events
  videos: {
    tabView: (duration: string, topics: string[]) => {
      analyticsEvents.track('videos_tab_view', {
        duration,
        topics,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },
    
    filterChange: (duration: string, topics: string[]) => {
      analyticsEvents.track('videos_filter_change', {
        duration,
        topics,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    }
  },

  // Live Clubhouse Strip events
  lcStrip: {
    impression: (count: number) => {
      analyticsEvents.track('lc_strip_impression', {
        count,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    avatarClick: (id: string, index: number) => {
      analyticsEvents.track('lc_strip_avatar_click', {
        creator_id: id,
        position_index: index,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    peekOpen: (id: string) => {
      analyticsEvents.track('lc_strip_peek_open', {
        creator_id: id,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    peekMs: (id: string, ms: number) => {
      analyticsEvents.track('lc_strip_peek_ms', {
        creator_id: id,
        duration_ms: ms,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    nearbyOpen: (count: number) => {
      analyticsEvents.track('lc_strip_nearby_open', {
        count,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    followFromStrip: (id: string) => {
      analyticsEvents.track('lc_strip_follow_from_strip', {
        creator_id: id,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    }
  }
};
