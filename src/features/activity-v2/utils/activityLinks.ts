/**
 * Activity V2 deep-link router.
 *
 * Extracted from the legacy `getContextUrl` in src/hooks/useActivityFeed.ts
 * plus row-level click handlers in src/pages/ActivityPage.tsx.
 * Uses only fields present on ActivityFeedRowV2 (message/title/actor_user_id
 * /entity_type/entity_id/data), no ActivityNotification dependency.
 *
 * Mapping table (verified against legacy source):
 *  like / like_post                        -> /post/:entity_id
 *  comment / comment_post                  -> /post/:post_id/comment/:comment_id
 *  comment_reply                           -> /post/:post_id/comment/:comment_id
 *  mention (post/comment/review/top_ten)   -> source-typed permalink
 *  mention_post / tag / comment_mention    -> /post/:post_id
 *  top_ten_comment / top_ten_reply         -> /profile/:target?tab=courses&...
 *  friend_course_review / course_review*   -> /courses/:course_id?tab=reviews&review=:review_id
 *  review_response_posted                  -> /courses/:course_id?tab=reviews&review=:review_id
 *  follow / friend_*                       -> /profile/:actor (or /business/:id when follower is business)
 *  new_post                                -> /post/:entity_id (fallback /profile/:actor)
 *  achievement / achievement_unlocked      -> /achievements
 *  business_verification_*                 -> /business/:id/verification
 *  course_claim_*                          -> /courses/:course_id (claim surface)
 *  business_member_added                   -> /business/:id
 *  business_team_invited                   -> /business/invite/accept?token=... (fallback /business/:id)
 *  business_team_joined                    -> /business/:id
 *  business_team_member_joined             -> /business/:id/team
 *  club_*                                  -> /clubs/:club_id
 *  support_reply                           -> /support/thread/:ticket_id
 *  message                                 -> /messages
 *  handicap_authority_live                 -> /handicap
 *  unknown                                 -> /profile/:actor or '/'
 */

import type { ActivityFeedRowV2 } from '../hooks/useActivityFeedV2';

const FOLLOW_TYPES = new Set([
  'follow',
  'friend_request',
  'friend_request_sent',
  'friend_accept',
  'friend_accepted',
  'friend_declined',
  'friend_cancelled',
]);

export function getActivityLink(row: ActivityFeedRowV2): string {
  const {
    notif_type: type,
    entity_type,
    entity_id,
    data: rawData,
    actor_user_id,
  } = row;
  const data: any = rawData && typeof rawData === 'object' ? rawData : {};

  // --- like ------------------------------------------------------------
  if (type === 'like' || type === 'like_post') {
    const postId = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (postId) return `/post/${postId}`;
  }

  // --- comment / reply -------------------------------------------------
  if (type === 'comment' || type === 'comment_post' || type === 'comment_reply') {
    const postId = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    const commentId = data.comment_id ?? (entity_type === 'comment' ? entity_id : null);
    if (postId && commentId) return `/post/${postId}/comment/${commentId}`;
    if (postId) return `/post/${postId}?openComments=1`;
  }

  // --- mention (source-typed) -----------------------------------------
  if (type === 'mention') {
    const src = data.source_type ?? entity_type;
    if (src === 'post') {
      const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
      if (pid) return `/post/${pid}`;
    }
    if (src === 'comment') {
      const pid = data.post_id;
      const cid = data.comment_id ?? (entity_type === 'comment' ? entity_id : null);
      if (pid && cid) return `/post/${pid}/comment/${cid}`;
      if (pid) return `/post/${pid}?openComments=1`;
    }
    if (src === 'review') {
      const cid = data.course_id;
      const rid = data.review_id ?? (entity_type === 'review' ? entity_id : null);
      if (cid && rid) return `/courses/${cid}?tab=reviews&review=${rid}`;
      if (cid) return `/courses/${cid}?tab=reviews`;
    }
    if (src === 'top_ten_comment') {
      return buildTopTenLink(row, data);
    }
  }

  if (type === 'mention_post' || type === 'tag' || type === 'comment_mention') {
    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
  }

  // --- top-ten comments -----------------------------------------------
  if (type === 'top_ten_comment' || type === 'top_ten_reply' || entity_type === 'top_ten') {
    return buildTopTenLink(row, data);
  }

  // --- course reviews --------------------------------------------------
  if (
    type === 'friend_course_review' ||
    type === 'course_review' ||
    type === 'course_review_received' ||
    type === 'review_response_posted'
  ) {
    const cid = data.course_id;
    const rid = data.review_id ?? entity_id;
    if (cid && rid) return `/courses/${cid}?tab=reviews&review=${rid}`;
    if (cid) return `/courses/${cid}?tab=reviews`;
  }

  // --- entity fallbacks ------------------------------------------------
  if (entity_type === 'post' && entity_id) return `/post/${entity_id}`;
  if (entity_type === 'comment' && data.post_id) {
    const cid = data.comment_id;
    return cid ? `/post/${data.post_id}/comment/${cid}` : `/post/${data.post_id}`;
  }
  if (entity_type === 'course' && entity_id) return `/courses/${entity_id}`;
  if (entity_type === 'club' && entity_id) return `/clubs/${entity_id}`;

  // --- follow / friend -------------------------------------------------
  if (FOLLOW_TYPES.has(type)) {
    if (type === 'follow') {
      const fType = data.follower_actor_type;
      const fId = data.follower_actor_id;
      if (fType === 'business' && fId) return `/business/${fId}`;
      if (fType === 'personal' && fId) return `/profile/${fId}`;
    }
    return actor_user_id ? `/profile/${actor_user_id}` : '/';
  }

  // --- new_post --------------------------------------------------------
  if (type === 'new_post') {
    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
    if (actor_user_id) return `/profile/${actor_user_id}`;
  }

  // --- achievements ----------------------------------------------------
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') {
    return '/achievements';
  }

  // --- business verification / claims ---------------------------------
  if (
    type === 'business_verification_approved' ||
    type === 'business_verification_rejected' ||
    type === 'business_verification_needs_info' ||
    type === 'business_verification_submitted' ||
    type === 'business_verification_more_proof_requested'
  ) {
    const bizId = data.business_slug || data.business_id || entity_id;
    if (bizId) return `/business/${bizId}/verification`;
  }

  if (
    type === 'course_claim_submitted' ||
    type === 'course_claim_approved' ||
    type === 'course_claim_rejected' ||
    type === 'course_claim_needs_info'
  ) {
    const cid = data.course_id || entity_id;
    if (cid) return `/courses/${cid}`;
  }

  // --- business membership / team -------------------------------------
  if (type === 'business_member_added' || type === 'business_access_approved') {
    const id = data.business_slug || data.business_id || entity_id;
    if (id) return `/business/${id}`;
  }
  if (type === 'business_team_invited') {
    if (data.token) return `/business/invite/accept?token=${encodeURIComponent(data.token)}`;
    const id = data.business_slug || data.business_id || entity_id;
    if (id) return `/business/${id}`;
  }
  if (type === 'business_team_joined') {
    const id = data.business_slug || data.business_id || entity_id;
    if (id) return `/business/${id}`;
  }
  if (type === 'business_team_member_joined') {
    const id = data.business_id || entity_id;
    if (id) return `/business/${id}/team`;
  }

  // --- clubs -----------------------------------------------------------
  if (type.startsWith('club_')) {
    const id = data.club_id || entity_id;
    if (id) return `/clubs/${id}`;
  }

  // --- support / message / handicap -----------------------------------
  if (type === 'support_reply') {
    const tid = data.ticket_id ?? entity_id;
    if (tid) return `/support/thread/${tid}`;
  }
  if (type === 'message') return '/messages';
  if (type === 'handicap_authority_live') return '/handicap';

  // --- unknown ---------------------------------------------------------
  return actor_user_id ? `/profile/${actor_user_id}` : '/';
}

function buildTopTenLink(row: ActivityFeedRowV2, data: any): string {
  const targetId = data.target_user_id ?? row.actor_user_id;
  const commentId = data.top_ten_comment_id ?? data.comment_id;
  const courseId = data.course_id;
  const parentId = data.parent_comment_id;
  const parts = ['tab=courses'];
  if (courseId) parts.push(`course=${courseId}`);
  if (commentId) parts.push(`top_ten_comment=${commentId}`);
  if (parentId) parts.push(`top_ten_parent=${parentId}`);
  return `/profile/${targetId}?${parts.join('&')}`;
}
