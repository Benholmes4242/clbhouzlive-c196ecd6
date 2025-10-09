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
  }
};
