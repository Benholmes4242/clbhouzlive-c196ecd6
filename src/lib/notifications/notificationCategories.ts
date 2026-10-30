// Canonical categories. `types` are the notification_preferences.muted_types
// strings — every DB `type` we emit for that category, so a single toggle
// covers all the aliases the sender may use.
export const CATEGORIES: { key: string; label: string; sub: string; types: string[] }[] = [
  /* 'reaction' is the Discover round/review reaction type. KNOWN COUPLING
     (BRIEF_DISCOVER_LOOSE_ENDS §S3.3): tg_notify_content_reaction emits ONE type
     for rounds, reviews and ratings, so muting Likes mutes review likes too.
     Separating them needs distinct types at the trigger, not here. */
  { key: 'likes',        label: 'Likes',
    sub: 'When someone likes your posts or rounds',
    types: ['like', 'like_post', 'reaction'] },
  { key: 'comments',     label: 'Comments and replies',
    sub: 'Comments on your posts and replies to you',
    types: ['comment', 'comment_post', 'comment_reply', 'top_ten_comment', 'top_ten_reply'] },
  { key: 'mentions',     label: 'Mentions and tags',
    sub: 'When someone mentions or tags you',
    types: ['mention', 'mention_post', 'comment_mention', 'tag'] },
  { key: 'followers',    label: 'New followers',
    sub: 'When someone starts following you',
    types: ['follow'] },
  { key: 'friends',      label: 'Friend requests',
    sub: 'Requests and accepts',
    types: ['friend_request', 'friend_accept', 'friend_accepted'] },
  { key: 'messages',     label: 'Messages',
    sub: 'Direct and group messages',
    types: ['message', 'message_received', 'dm'] },
  { key: 'games',        label: 'Games',
    sub: 'Invites, changes and cancellations',
    types: ['game_invite', 'game_request', 'game_updated', 'game_cancelled', 'game_request_accepted', 'game_request_declined'] },
  { key: 'courses',      label: 'Course activity',
    sub: 'Friend reviews and responses to your reviews',
    types: ['friend_course_review', 'course_review', 'course_review_received', 'review_response', 'review_response_posted', 'friend_review'] },
  { key: 'gamification', label: 'Streaks and achievements',
    sub: 'Badges, streaks, crowns, rivals and rate-a-course prompts',
    types: ['badge_earned', 'legend_earned', 'legend_lost', 'rival_played', 'streak_at_risk', 'streak_broken', 'streak_freeze_applied', 'crown_taken', 'crown_lost', 'rate_course_prompt'] },
  { key: 'analytics',    label: 'Course analytics',
    sub: "When your rounds update a course's analytics",
    types: ['course_analytics_updated'] },
  { key: 'tour',         label: 'Tour roundups',
    sub: 'Sunday final rounds and Thursday picks',
    types: ['tour_roundup', 'tour_preview'] },

];

