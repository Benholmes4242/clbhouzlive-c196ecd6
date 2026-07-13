/**
 * Deno port of src/features/activity-v2/utils/activityLinks.ts
 * Computes a client-side route for a push/notification payload so tapping
 * a push deep-links into the correct surface. Keep in sync with the client.
 *
 * Fallback: '/notificationmessages' so unmapped taps land on the activity
 * list rather than a dead Clubhouse stop.
 */

export interface NotifRouteInput {
  notif_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  data?: Record<string, any> | null;
  actor_user_id?: string | null;
}

const FOLLOW_TYPES = new Set([
  'follow',
  'friend_request',
  'friend_request_sent',
  'friend_accept',
  'friend_accepted',
  'friend_declined',
  'friend_cancelled',
]);

export function routeForNotif(input: NotifRouteInput): string {
  const type = String(input.notif_type ?? '');
  const entity_type = input.entity_type ?? null;
  const entity_id = input.entity_id ?? null;
  const actor_user_id = input.actor_user_id ?? null;
  const data: any = input.data && typeof input.data === 'object' ? input.data : {};

  // like
  if (type === 'like' || type === 'like_post') {
    const postId = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (postId) return `/post/${postId}`;
  }

  // comment / reply
  if (type === 'comment' || type === 'comment_post' || type === 'comment_reply') {
    const postId = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    const commentId = data.comment_id ?? (entity_type === 'comment' ? entity_id : null);
    if (postId && commentId) return `/post/${postId}/comment/${commentId}`;
    if (postId) return `/post/${postId}?openComments=1`;
  }

  // mention (source-typed)
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
      return buildTopTenLink(actor_user_id, data);
    }
  }

  if (type === 'mention_post' || type === 'tag' || type === 'comment_mention') {
    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
  }

  // top-ten comments
  if (type === 'top_ten_comment' || type === 'top_ten_reply' || entity_type === 'top_ten') {
    return buildTopTenLink(actor_user_id, data);
  }

  // course reviews / responses
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

  // record-beaten / legends family
  if (
    type === 'top_100_record_beaten' ||
    type === 'course_record_beaten' ||
    type.startsWith('legend_') ||
    type.startsWith('record_')
  ) {
    const cid = data.course_id ?? (entity_type === 'course' ? entity_id : null);
    if (cid) return `/courses/${cid}?tab=legends`;
  }

  // entity fallbacks
  if (entity_type === 'post' && entity_id) return `/post/${entity_id}`;
  if (entity_type === 'comment' && data.post_id) {
    const cid = data.comment_id;
    return cid ? `/post/${data.post_id}/comment/${cid}` : `/post/${data.post_id}`;
  }
  if (entity_type === 'course' && entity_id) return `/courses/${entity_id}`;
  if (entity_type === 'club' && entity_id) return `/clubs/${entity_id}`;

  // follow / friend
  if (FOLLOW_TYPES.has(type)) {
    if (type === 'follow') {
      const fType = data.follower_actor_type;
      const fId = data.follower_actor_id;
      if (fType === 'business' && fId) return `/business/${fId}`;
      if (fType === 'personal' && fId) return `/profile/${fId}`;
    }
    if (actor_user_id) return `/profile/${actor_user_id}`;
  }

  // new_post
  if (type === 'new_post') {
    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
    if (actor_user_id) return `/profile/${actor_user_id}`;
  }

  // achievements
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') {
    return '/achievements';
  }

  // business verification
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

  // course claims
  if (
    type === 'course_claim_submitted' ||
    type === 'course_claim_approved' ||
    type === 'course_claim_rejected' ||
    type === 'course_claim_needs_info'
  ) {
    const cid = data.course_id || entity_id;
    if (cid) return `/courses/${cid}`;
  }

  // business membership / team
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

  // clubs
  if (type.startsWith('club_')) {
    const id = data.club_id || entity_id;
    if (id) return `/clubs/${id}`;
  }

  // support / message / handicap
  if (type === 'support_reply') {
    const tid = data.ticket_id ?? entity_id;
    if (tid) return `/support/thread/${tid}`;
  }
  if (type === 'message' || type.startsWith('dm_')) {
    const threadId = data.thread_id ?? data.conversation_id ?? entity_id;
    if (threadId) return `/messages/${threadId}`;
    return '/messages';
  }
  if (type === 'handicap_authority_live') return '/handicap';

  // unknown -> activity list
  return '/notificationmessages';
}

function buildTopTenLink(actor_user_id: string | null, data: any): string {
  const targetId = data.target_user_id ?? actor_user_id;
  const commentId = data.top_ten_comment_id ?? data.comment_id;
  const courseId = data.course_id;
  const parentId = data.parent_comment_id;
  const parts = ['tab=courses'];
  if (courseId) parts.push(`course=${courseId}`);
  if (commentId) parts.push(`top_ten_comment=${commentId}`);
  if (parentId) parts.push(`top_ten_parent=${parentId}`);
  return targetId ? `/profile/${targetId}?${parts.join('&')}` : '/notificationmessages';
}
