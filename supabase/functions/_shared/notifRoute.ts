/**
 * Deno port of src/features/activity-v2/utils/activityLinks.ts
 * Computes a client-side route for a push/notification payload so tapping
 * a push deep-links into the correct surface. Keep in sync with the client.
 *
 * Fallback: '/notificationmessages' so unmapped taps land on the activity
 * list rather than a dead Clubhouse stop.
 *
 * N3 — PORTING CONTRACT. The client returns '' to mean "inert, do not
 * navigate" (its row guards on !url). A push has no such contract: the worker
 * builds `${APP_ORIGIN}${route}`, so '' sends the tap to the bare origin, i.e.
 * the home screen. Every client branch returning '' returns FALLBACK here.
 * The client's dev-only unhandled-type console.warn is intentionally dropped —
 * import.meta.env.DEV does not exist in Deno.
 */

/** The client's '' (inert) and its actor/'/' unknown fallback both land here. */
const FALLBACK = '/notificationmessages';

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

/** Reaction notifications whose target can be a ROUND post. */
const ROUND_REACTION_TYPES = new Set([
  'like',
  'like_post',
  'comment',
  'comment_post',
  'comment_reply',
  'comment_mention',
  'mention',
  'mention_post',
  'tag',
]);

/** Of those, the ones that should land with the comments open. */
const COMMENT_TYPES = new Set([
  'comment',
  'comment_post',
  'comment_reply',
  'comment_mention',
]);

export function routeForNotif(input: NotifRouteInput): string {
  const type = String(input.notif_type ?? '');
  const entity_type = input.entity_type ?? null;
  const entity_id = input.entity_id ?? null;
  const actor_user_id = input.actor_user_id ?? null;
  const data: any = input.data && typeof input.data === 'object' ? input.data : {};

  // --- rounds win outright (MICRO_BRIEF_ROUND_LINK_FLASH S1.2) -----------
  // A round notification carries entity_type 'post', so without this the
  // generic entity fallback below returns /post/:id and PostDeepLinkPage
  // flashes its unavailable state before redirecting. is_round is only true
  // when the trigger also wrote a score id.
  if (type === 'new_post' && data.is_round === true && data.whs_score_id) {
    return `/round/${encodeURIComponent(data.whs_score_id)}`;
  }

  // A LIKE, COMMENT OR MENTION ON A ROUND OPENS THE ROUND. Same reasoning:
  // a round post has no feed home and no media, so /post/:id can only
  // redirect. DEPLOYED-PAYLOAD LIMIT: only the new_post trigger writes
  // post_type / whs_score_id / is_round today, so like/comment/mention rows
  // still fall through to /post/:id until those triggers carry them.
  if (ROUND_REACTION_TYPES.has(type)) {
    const scoreId = data.whs_score_id ?? null;
    const isRound = data.is_round === true || data.post_type === 'round';
    if (scoreId && isRound) {
      const base = `/round/${encodeURIComponent(scoreId)}`;
      return COMMENT_TYPES.has(type) ? `${base}?openComments=1` : base;
    }
  }

  // --- game family (Crowns chip) ---------------------------------------
  if (
    type === 'crown_taken' || type === 'crown_lost' ||
    type === 'legend_earned' || type === 'legend_lost' ||
    type === 'course_record_beaten' || type === 'rival_played'
  ) {
    const courseId = data.course_id ?? (entity_type === 'course' ? entity_id : null);
    // Client returns '' (inert row) here; a push must still land somewhere.
    if (!courseId) return FALLBACK;
    const cat = data.category as string | undefined;
    return `/courses/${courseId}?tab=legends${cat ? `&cat=${encodeURIComponent(cat)}` : ''}`;
  }

  if (
    type === 'streak_broken' || type === 'streak_at_risk' ||
    type === 'streak_freeze_applied'
  ) {
    // Streaks have their own sheet, opened by ?gam=streaks — a broken-streak
    // notification landing on the career record is the wrong destination.
    return '/handicap?gam=streaks';
  }

  if (
    type === 'level_up' || type === 'level_near' ||
    type === 'status_at_risk' || type === 'status_reclaimed' ||
    type === 'badge_earned'
  ) {
    // The career record sheet lives on /handicap, opened by ?gam=trophies.
    // badge= opens the record ON THAT BADGE.
    const badgeId = type === 'badge_earned' ? (data.badge_id as string | undefined) : null;
    return `/handicap?gam=trophies${badgeId ? `&badge=${encodeURIComponent(badgeId)}` : ''}`;
  }

  // --- discover reactions ---------------------------------------------
  // The trigger writes { actor_id, target_type, target_id } plus course_id
  // (both types, ABSENT when the round's course is unmapped) and score_id
  // (rounds only). A round opens the scorecard over /handicap; a review opens
  // the course review permalink.
  if (type === 'reaction') {
    const targetType = data.target_type;
    const targetId = data.target_id ?? entity_id ?? null;
    if (targetType === 'round') {
      const scoreId = data.score_id ?? (entity_type === 'score' ? entity_id : null) ?? targetId;
      return scoreId ? `/handicap?score=${encodeURIComponent(scoreId)}` : '/handicap';
    }
    if (targetType === 'review') {
      const cid = data.course_id;
      if (cid && targetId) return `/courses/${cid}?tab=reviews&review=${targetId}`;
      if (cid) return `/courses/${cid}?tab=reviews`;
      return FALLBACK; // client returns '' (inert); a push cannot.
    }
  }

  // like
  if (type === 'like' || type === 'like_post') {
    /* R3.3 — A LIKE ON A REVIEW GOES WHERE ITS COMMENT GOES. A PERSONAL like on
       a review-backed post writes content_reactions and arrives as `reaction`
       (above); a BUSINESS like still writes post_likes and arrives as `like`,
       carrying target_type 'review' plus the review and course ids. Rows
       predating R3.3 carry no target_type and fall through to /post/:id. */
    const targetType = data.target_type;
    if (targetType === 'review') {
      const cid = data.course_id;
      const rid = data.review_id ?? data.target_id ?? null;
      if (cid && rid) return `/courses/${cid}?tab=reviews&review=${rid}`;
      if (cid) return `/courses/${cid}?tab=reviews`;
    }
    const postId = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (postId) return `/post/${postId}`;
  }

  // comment / reply
  if (type === 'comment' || type === 'comment_post' || type === 'comment_reply') {
    /* G7.2(e) — A COMMENT ON A ROUND OR A REVIEW GOES WHERE ITS LIKE GOES. The
       same two destinations the `reaction` branch resolves, from the same
       payload keys the widened comments_v2_notify writes. */
    const targetType = data.target_type;
    const targetId = data.target_id ?? null;
    if (targetType === 'round') {
      const scoreId = data.score_id ?? data.whs_score_id ?? targetId;
      return scoreId ? `/handicap?score=${encodeURIComponent(scoreId)}` : '/handicap';
    }
    if (targetType === 'review') {
      const cid = data.course_id;
      const rid = data.review_id ?? targetId;
      if (cid && rid) return `/courses/${cid}?tab=reviews&review=${rid}`;
      if (cid) return `/courses/${cid}?tab=reviews`;
      return FALLBACK; // client returns '' (inert); a push cannot.
    }
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
      // rating_id is the legacy key notify_friends_on_course_review() wrote, kept
      // as a fallback so notifications already in the table resolve without a
      // backfill.
      const rid = data.review_id ?? data.rating_id ?? (entity_type === 'review' ? entity_id : null);
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

  // rate-course prompt
  if (type === 'rate_course_prompt') {
    const cid = (data.course_id as string | undefined) ?? (entity_type === 'course' ? entity_id : null);
    if (cid) return `/rate-course-v2/${cid}`;
  }

  // course analytics updated (WHS post-sync deep link — Phase D)
  if (type === 'course_analytics_updated') {
    const cid = (data.course_id as string | undefined) ?? (entity_type === 'course' ? entity_id : null);
    if (cid) return `/courses/${cid}?tab=holes`;
  }


  // course reviews / responses
  if (
    type === 'friend_course_review' ||
    type === 'course_review' ||
    type === 'course_review_received' ||
    type === 'review_response_posted'
  ) {
    const cid = data.course_id;
    // entity_id on these rows is the COURSE, never the review — falling back to
    // it built a review id that can never match, so the push tap was broken in
    // exactly the same way as the in-app row. rating_id resolves rows already in
    // the table without a backfill.
    const rid =
      data.review_id ??
      data.rating_id ??
      (entity_type === 'review' ? entity_id : null);
    if (cid && rid) return `/courses/${cid}?tab=reviews&review=${rid}`;
    if (cid) return `/courses/${cid}?tab=reviews`;
  }

  // video ready (system-authored). Payload carries { post_id, stream_id };
  // no usable target -> the member's OWN profile, never Clubhouse.
  if (type === 'video_ready') {
    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
    return '/profile';
  }

  // service announcement (app-wide, from clbhouz). These carry
  // { campaign, route } and nothing else. A route of '/' is Clubhouse, i.e.
  // NOT a destination. Route only to a REAL carried target.
  if (type === 'service_announcement') {
    const target = data.route ?? data.url ?? null;
    if (target && target !== '/' && target.startsWith('/')) return target;
    return FALLBACK; // client returns '' (inert row); a push cannot.
  }

  // record-beaten / legends family
  if (
    type === 'top_100_record_beaten' ||
    type === 'course_record_beaten' ||
    type === 'crown_taken' ||
    type === 'crown_lost' ||
    type.startsWith('legend_') ||
    type.startsWith('record_')
  ) {
    const cid = data.course_id ?? (entity_type === 'course' ? entity_id : null);
    const cat = data.category as string | undefined;
    if (cid) return `/courses/${cid}?tab=legends${cat ? `&cat=${encodeURIComponent(cat)}` : ''}`;
  }


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
    const isRound = data.is_round === true;
    const scoreId = data.whs_score_id as string | undefined;
    if (isRound && scoreId) return `/round/${encodeURIComponent(scoreId)}`;
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

  // Onboarding nudge: the row's whole job is the setup step it names, so it
  // routes to that step's own screen, carrying the ?src marker the arrival
  // tracker reads. The gap is authoritative; data.link is only a display echo.
  if (type === 'onboarding_nudge') {
    const gap = data.gap;
    if (gap === 'whs') return '/handicap?src=nudge_whs';
    if (gap === 'club') return '/edit-profile?src=nudge_club';
    if (gap === 'username') return '/edit-profile?src=nudge_username';
    return '/edit-profile';
  }
  if (type === 'handicap_authority_live') return '/handicap';

  // golfer verified (system-authored)
  if (type === 'golfer_verified') return '/profile';

  // tour digests (system-authored, NO actor, NO target). Each digest summarises
  // several stories, so there is nothing single to deep-link to — they land on
  // the wire, not on a hub with a leaderboard at the top.
  if (type === 'tour_preview' || type === 'tour_roundup') {
    return '/tour/news';
  }

  // --- entity fallbacks ------------------------------------------------
  // LAST RESORT ONLY. These match on entity_type alone, so any type branch
  // below them is unreachable for a row carrying a matching entity_type —
  // course_claim_* sat below this block and a claim push carrying
  // entity_type 'course' opened /courses/{entity_id} instead of the claim
  // surface (N5; N4 fixed the same shadow on the client for
  // rate_course_prompt). The block stays immediately above the final
  // FALLBACK return, after EVERY type branch; the parity test asserts that
  // ordering structurally in both routers.
  if (entity_type === 'post' && entity_id) return `/post/${entity_id}`;
  if (entity_type === 'comment' && data.post_id) {
    const cid = data.comment_id;
    return cid ? `/post/${data.post_id}/comment/${cid}` : `/post/${data.post_id}`;
  }
  if (entity_type === 'course' && entity_id) return `/courses/${entity_id}`;
  if (entity_type === 'club' && entity_id) return `/clubs/${entity_id}`;

  // unknown -> activity list
  return FALLBACK;
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
  return targetId ? `/profile/${targetId}?${parts.join('&')}` : FALLBACK;
}
