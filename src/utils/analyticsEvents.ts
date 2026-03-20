// Analytics event tracking utility
// Integrated with PostHog via telemetry wrapper
import { track as posthogTrack } from "@/lib/telemetry";

type EventParams = Record<string, any>;

export const analyticsEvents = {
  track: (eventName: string, params?: EventParams) => {
    // Console log for development
    console.log(`[Analytics] ${eventName}`, params);
    
    // Send to PostHog
    posthogTrack(eventName, params || {});
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
  },

  // Nearby overlay events
  nearby: {
    opened: (count: number) => {
      analyticsEvents.track('nearby_opened', {
        count,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    followClicked: (golferId: string, position: number) => {
      analyticsEvents.track('nearby_follow_clicked', {
        golfer_id: golferId,
        position,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    messageClicked: (golferId: string, position: number) => {
      analyticsEvents.track('nearby_message_clicked', {
        golfer_id: golferId,
        position,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    playNowClicked: () => {
      analyticsEvents.track('nearby_playnow_clicked', {
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    }
  },

  // Open to Play events
  openToPlay: {
    activate: (duration: number) => {
      analyticsEvents.track('open2play_tap_activate', {
        duration,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    cancel: (elapsed: number) => {
      analyticsEvents.track('open2play_cancel', {
        elapsed,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    expire: (elapsed: number) => {
      analyticsEvents.track('open2play_expire', {
        elapsed,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    filterToggle: (enabled: boolean) => {
      analyticsEvents.track('open2play_filter_toggle', {
        enabled,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    },

    profileDisplayed: (remainingMinutes: number) => {
      analyticsEvents.track('profile_open2play_displayed', {
        remainingMinutes,
        session_id: sessionStorage.getItem('session_id') || 'unknown'
      });
    }
  },

  // Hub events (My Clubhouse Hub)
  hub: {
    opened: { event: 'hub_opened', category: 'hub', label: 'Hub Opened' },
    tab_switch: { event: 'hub_tab_switch', category: 'hub', label: 'Hub Tab Switched' },
    golfers_view: { event: 'hub_golfers_view', category: 'hub', label: 'Golfers Tab Viewed' },
    games_view: { event: 'hub_games_view', category: 'hub', label: 'Games Tab Viewed' },
    your_games_view: { event: 'hub_your_games_view', category: 'hub', label: 'Your Games Tab Viewed' },
    create_game_open: { event: 'hub_create_game_open', category: 'hub', label: 'Create Game Opened' },
    echo_open: { event: 'hub_echo_open', category: 'hub', label: 'Echo Tab Opened' },
  },

  // Game events
  game: {
    created: { event: 'game_created', category: 'game', label: 'Game Created' },
    joined: { event: 'game_joined', category: 'game', label: 'Game Joined' },
    cancelled: { event: 'game_cancelled', category: 'game', label: 'Game Cancelled' },
  },

  // Echo events (Phase 4 complete)
  echo: {
    message_sent: { event: 'echo_message_sent', category: 'echo', label: 'Echo Message Sent' },
    history_opened: { event: 'echo_history_opened', category: 'echo', label: 'Echo History Opened' },
    new_conversation: { event: 'echo_new_conversation', category: 'echo', label: 'Echo New Conversation' },
    conversation_opened: { event: 'echo_conversation_opened', category: 'echo', label: 'Echo Conversation Opened' },
    conversation_renamed: { event: 'echo_conversation_renamed', category: 'echo', label: 'Echo Conversation Renamed' },
    conversation_deleted: { event: 'echo_conversation_deleted', category: 'echo', label: 'Echo Conversation Deleted' },
    stream_started: { event: 'echo_stream_started', category: 'echo', label: 'Echo Stream Started' },
    stream_completed: { event: 'echo_stream_completed', category: 'echo', label: 'Echo Stream Completed' },
    stream_aborted: { event: 'echo_stream_aborted', category: 'echo', label: 'Echo Stream Aborted' },
  },
  // Hub-specific Echo events
  hub_echo_open: { event: 'hub_echo_open', category: 'hub' },
  hub_echo_tab: (tab: 'chat' | 'history') => ({ event: 'hub_echo_tab', category: 'hub', label: tab }),
  hub_echo_history_open: (mode: 'chat') => ({ event: 'hub_echo_history_open', category: 'hub', label: mode }),
  hub_echo_chat_send: { event: 'hub_echo_chat_send', category: 'hub' },

  // Notifications namespace
  notifications: {
    opened: (params: { source: "bell" | "deep_link" }) =>
      analyticsEvents.track("notifications_opened", params),

    clicked: (params: {
      id: string;
      type: string;
      source: "notifications_page";
      targetType?: "profile" | "post" | "course" | "message";
      targetId?: string;
    }) => analyticsEvents.track("notification_clicked", params),
  },

  // Social namespace
  social: {
    followToggled: (params: {
      targetUserId: string;
      from: "profile" | "list" | "clubhouse" | "nearby";
      isFollowing: boolean;
    }) => analyticsEvents.track("social_follow_toggled", params),

    friendRequestSent: (params: {
      targetUserId: string;
      from: "profile" | "nearby" | "notifications";
    }) => analyticsEvents.track("social_friend_request_sent", params),

    friendRequestResponded: (params: {
      targetUserId: string;
      from: "notifications" | "profile";
      action: "accepted" | "declined";
    }) => analyticsEvents.track("social_friend_request_responded", params),

    blockChanged: (params: {
      targetUserId: string;
      action: "block" | "unblock";
      from: "profile" | "list";
    }) => analyticsEvents.track("social_block_changed", params),

    listViewed: (params: {
      type: "followers" | "following" | "friends";
      profileUserId: string;
      from: "profile_stats";
    }) => analyticsEvents.track("social_list_viewed", params),
  },

  // Course ratings namespace
  ratings: {
    modalOpened: (params: {
      courseId: string;
      courseName: string;
      isEditMode: boolean;
      deviceType?: string;
    }) =>
      analyticsEvents.track("rating_modal_opened", params),

    sliderChanged: (params: {
      courseId: string;
      courseName: string;
      category: "overall" | "design" | "condition" | "clubhouse" | "facilities";
      value: number;
    }) =>
      analyticsEvents.track("rating_slider_changed", params),

    submitted: (params: {
      courseId: string;
      courseName: string;
      isNewReview: boolean;
      overallRating: number;
      design?: number;
      condition?: number;
      clubhouse?: number;
      facilities?: number;
    }) =>
      analyticsEvents.track("rating_submitted", params),

    submissionFailed: (params: {
      courseId: string;
      courseName: string;
      isNewReview: boolean;
      errorMessage?: string;
    }) =>
      analyticsEvents.track("rating_submission_failed", params),

    confirmationViewed: (params: {
      courseId: string;
      courseName: string;
      isNewReview: boolean;
      overallRating: number;
    }) =>
      analyticsEvents.track("rating_confirmation_viewed", params),

    flowCompleted: (params: {
      courseId: string;
      courseName: string;
      isNewReview: boolean;
    }) =>
      analyticsEvents.track("rating_flow_completed", params),
  },
};
