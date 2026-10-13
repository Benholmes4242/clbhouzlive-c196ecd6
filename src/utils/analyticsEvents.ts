// Analytics event tracking utility
// Rewired to write directly to Supabase analytics_events table
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { getSessionId, getUserAgent, onSessionMinted } from './analyticsSession';

// The publishable (anon) key, read from the client config; safe in code.
const SUPABASE_PUBLISHABLE_KEY: string =
  ((supabase as unknown as { supabaseKey?: string }).supabaseKey) ?? '';

/**
 * Bot traffic is dropped at WRITE time. Read-time filtering means every future
 * query has to remember to exclude crawlers, and one that forgets reports
 * crawler volume as member activity.
 *
 * Intent must match the read-time filter in get_admin_ops_health: automated,
 * non-member traffic. Guarded against a missing navigator so it cannot throw.
 */
const BOT_UA = /headless|bot|crawler|spider/i;
function isBot(): boolean {
  try {
    const nav = typeof navigator === 'undefined' ? null : navigator;
    if (!nav) return false;
    if ((nav as Navigator & { webdriver?: boolean }).webdriver === true) return true;
    return BOT_UA.test(nav.userAgent || '');
  } catch {
    return false;
  }
}

type EventParams = Record<string, any>;

/* DWELL SURVIVES CLOSING THE APP. The user id and access token are held in
   memory from onAuthStateChange, so no event awaits getUser() before
   inserting. The hide-time page_exit uses sendKeepalive() below. */
let currentUserId: string | null = null;
let currentToken: string | null = null;
try {
  supabase.auth.onAuthStateChange((_evt, session) => {
    currentUserId = session?.user?.id ?? null;
    currentToken = session?.access_token ?? null;
  });
} catch { /* analytics never throws */ }

/* Envelope. The CALLER'S `path` wins (page_exit must record the page left,
   page_view must keep ?tab=). `page` stays location.pathname. session_id,
   page, build and ua remain reserved: callers must NOT send them — Explore's
   numeric `page` was silently replaced for the life of that event (renamed
   to stream_page, Sep 2026). */
function buildRow(eventName: string, params?: EventParams) {
  return {
    name: eventName,
    user_id: currentUserId,
    props: {
      ...params,
      session_id: getSessionId(),
      page: window.location.pathname,
      path: params?.path ?? window.location.pathname,
      build: __BUILD_ID__,
      ua: getUserAgent(),
    },
  };
}

/** Survives the page being killed: fetch with keepalive, same row shape. */
function sendKeepalive(eventName: string, params?: EventParams) {
  try {
    if (isBot()) return;
    const row = buildRow(eventName, params);
    void fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${currentToken ?? SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch { /* never block */ }
}

export const analyticsEvents = {
  track: async (eventName: string, params?: EventParams) => {
    try {
      if (isBot()) return;
      await supabase.from('analytics_events').insert(buildRow(eventName, params));
    } catch {
      // Never block UI — analytics is non-critical
    }
  },

  /** Hide-time page_exit only. Every other event uses track(). */
  trackOnHide: (eventName: string, params?: EventParams) => sendKeepalive(eventName, params),

  // Shorts squircle specific events
  shortsSquircle: {
    avatarClick: (creatorId: string, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_avatar_click', {
        creator_id: creatorId,
        position_index: positionIndex,
        session_id: getSessionId()
      });
    },

    nameClick: (username: string, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_name_click', {
        username,
        position_index: positionIndex,
        session_id: getSessionId()
      });
    },

    followToggle: (creatorId: string, isFollowing: boolean, positionIndex: number) => {
      analyticsEvents.track('shorts_squircle_follow_toggle', {
        creator_id: creatorId,
        is_following: isFollowing,
        position_index: positionIndex,
        session_id: getSessionId()
      });
    },

    plusClick: () => {
      analyticsEvents.track('shorts_squircle_plus_click', {
        session_id: getSessionId()
      });
    },

    empty: () => {
      analyticsEvents.track('shorts_squircle_empty', {
        session_id: getSessionId()
      });
    }
  },

  // Videos tab specific events
  videos: {
    tabView: (duration: string, topics: string[]) => {
      analyticsEvents.track('videos_tab_view', {
        duration,
        topics,
        session_id: getSessionId()
      });
    },
    
    filterChange: (duration: string, topics: string[]) => {
      analyticsEvents.track('videos_filter_change', {
        duration,
        topics,
        session_id: getSessionId()
      });
    }
  },

  // Live Clubhouse Strip events
  lcStrip: {
    impression: (count: number) => {
      analyticsEvents.track('lc_strip_impression', {
        count,
        session_id: getSessionId()
      });
    },

    avatarClick: (id: string, index: number) => {
      analyticsEvents.track('lc_strip_avatar_click', {
        creator_id: id,
        position_index: index,
        session_id: getSessionId()
      });
    },

    peekOpen: (id: string) => {
      analyticsEvents.track('lc_strip_peek_open', {
        creator_id: id,
        session_id: getSessionId()
      });
    },

    peekMs: (id: string, ms: number) => {
      analyticsEvents.track('lc_strip_peek_ms', {
        creator_id: id,
        duration_ms: ms,
        session_id: getSessionId()
      });
    },

    nearbyOpen: (count: number) => {
      analyticsEvents.track('lc_strip_nearby_open', {
        count,
        session_id: getSessionId()
      });
    },

    followFromStrip: (id: string) => {
      analyticsEvents.track('lc_strip_follow_from_strip', {
        creator_id: id,
        session_id: getSessionId()
      });
    }
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

  /**
   * MEDIA ENGAGEMENT (BRIEF_MEDIA_TRACKING_MINIMUM). TWO events, ONE payload
   * shape, so opened ÷ impression can be taken per section, per surface and per
   * position band. Every media surface calls these two functions and nothing
   * else — see src/utils/mediaEngagement.ts for the observer and the derivation.
   *
   * NO PLAYBACK, DWELL OR COMPLETION EVENTS here, deliberately (§0).
   *
   * community_moment_tapped IS UNCHANGED AND STILL FIRES alongside
   * media_item_opened on /community. That duplication is deliberate: the old
   * event is the only continuous baseline for the current layout. It may be
   * retired after 2026-12-01, once there is a full quarter of the new events.
   */
  media: {
    impression: (t: {
      mediaType: string;
      surface: string;
      section: string;
      position: number;
      postId: string;
      mediaId: string | null;
    }) =>
      analyticsEvents.track('media_item_impression', {
        media_type: t.mediaType,
        surface: t.surface,
        section: t.section,
        position: t.position,
        post_id: t.postId,
        media_id: t.mediaId,
      }),

    opened: (t: {
      mediaType: string;
      surface: string;
      section: string;
      position: number;
      postId: string;
      mediaId: string | null;
    }) =>
      analyticsEvents.track('media_item_opened', {
        media_type: t.mediaType,
        surface: t.surface,
        section: t.section,
        position: t.position,
        post_id: t.postId,
        media_id: t.mediaId,
      }),

    /**
     * The ONE signal free of position and autoplay confounds (§4): a member
     * naming the type they want.
     */
    filterSelected: (filter: string, previousFilter: string) =>
      analyticsEvents.track('community_media_filter_selected', {
        filter,
        previous_filter: previousFilter,
      }),
  },
};
