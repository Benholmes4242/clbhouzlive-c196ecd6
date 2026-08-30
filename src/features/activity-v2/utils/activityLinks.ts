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
 *  new_post (round)                        -> /round/:whs_score_id
 *  new_post                                -> /post/:entity_id (fallback /profile/:actor)
 *  achievement / achievement_unlocked      -> /achievements
 *  crown_* / legend_* / rival_played       -> /courses/:course_id (inert if absent)
 *  level_* / streak_* / status_* / badge_earned -> /handicap?gam=trophies (&badge=)
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

import { getActorRouteByType } from '@/types/actor';
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

/**
 * THE TAP ROUTES TO WHAT IT SHOWS. A notification sourced from a business post
 * renders the business's name and logo, so its profile destination must be the
 * BUSINESS. actor_user_id stays the person (blocking / mute / friends filter);
 * actor_route_id + actor_kind are the navigation pair. Pre-Aug-2026 rows carry
 * no actor_kind, so this collapses to /profile/:actor_user_id exactly as before.
 */
function actorProfileRoute(row: ActivityFeedRowV2): string | null {
  const id = row.actor_route_id ?? row.actor_user_id;
  if (!id) return null;
  return getActorRouteByType(row.actor_kind ?? 'personal', id);
}

export function getActivityLink(row: ActivityFeedRowV2): string {
  const {
    notif_type: type,
    entity_type,
    entity_id,
    data: rawData,
  } = row;
  const data = (rawData && typeof rawData === 'object' ? rawData : {}) as Record<string, string | undefined>;

  // --- rounds win outright (MICRO_BRIEF_ROUND_LINK_FLASH S1.2) -----------
  // This check USED to live in the `new_post` case at the bottom of the
  // resolver, where it never ran: a round notification carries
  // entity_type 'post', so the GENERIC ENTITY FALLBACK below
  // (`entity_type === 'post' -> /post/:id`) returned first. That sent the tap
  // through PostDeepLinkPage, which flashed its unavailable state before
  // redirecting here anyway. Resolved first, so no ordering change downstream
  // can shadow it again. is_round is only true when the trigger also wrote a
  // score id; a legacy row without one still falls through to /post/.
  if (type === 'new_post' && (rawData as Record<string, unknown> | null)?.is_round === true && data.whs_score_id) {
    return `/round/${encodeURIComponent(data.whs_score_id)}`;
  }



  // --- game family (Crowns chip) ---------------------------------------
  if (
    type === 'crown_taken' || type === 'crown_lost' ||
    type === 'legend_earned' || type === 'legend_lost' ||
    type === 'course_record_beaten' || type === 'rival_played'
  ) {
    const courseId = data.course_id ?? (entity_type === 'course' ? entity_id : null);
    // No course id -> inert row (return '' so handleClick's !url guard fires).
    if (!courseId) return '';
    // Champions tab, deep-linked to the exact crown section when known.
    const cat = data.category;
    return `/courses/${courseId}?tab=legends${cat ? `&cat=${encodeURIComponent(cat)}` : ''}`;
  }

  if (
    type === 'streak_broken' || type === 'streak_at_risk' ||
    type === 'streak_freeze_applied'
  ) {
    // Streaks have their own sheet, opened by ?gam=streaks. They were briefly
    // routed to the Trophy Room with the other gam types; a broken-streak
    // notification landing on the career record is the wrong destination -
    // the member is being told about a streak, so a streak is what should
    // open.
    return '/handicap?gam=streaks';
  }

  if (
    type === 'level_up' || type === 'level_near' ||
    type === 'status_at_risk' || type === 'status_reclaimed' ||
    type === 'badge_earned'
  ) {
    // The career record sheet lives on /handicap and is opened by the
    // ?gam=trophies deep link. badge= preserves the retired NotificationsSheet
    // behaviour: a badge row opens the record ON THAT BADGE.
    const badgeId = type === 'badge_earned' ? data.badge_id : null;
    return `/handicap?gam=trophies${badgeId ? `&badge=${encodeURIComponent(badgeId)}` : ''}`;
  }



  // --- discover reactions ---------------------------------------------
  // The trigger writes { actor_id, target_type, target_id } plus course_id
  // (both types, ABSENT when the round's course is unmapped) and score_id
  // (rounds only). A round opens the scorecard over /handicap; a review opens
  // the course review permalink, and is inert without a course id.
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
      return '';
    }
  }


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
    return actorProfileRoute(row) ?? '/';
  }

  // --- new_post --------------------------------------------------------
  if (type === 'new_post') {
    // ROUND NOTIFICATIONS ROUTE TO THE ROUND, AT LINK TIME (Aug 2026).
    // create_new_post_notifications now writes post_type / whs_score_id /
    // is_round onto the notification, so a round no longer has to be
    // discovered by fetching the post. is_round is only true when the post is
    // a round AND carries a score id; a legacy/hand-written row missing the
    // score id falls through to the post branch below.
    // BRIEF_ROUND_PAGE §3.1/§3.2 — the destination is now the round's OWN page
    // (/round/:whsScoreId). This SUPERSEDES /handicap/:userId?score=, which
    // borrowed the viewer's handicap surface to host someone else's card.
    const isRound = (data as Record<string, unknown>).is_round === true;
    const scoreId = data.whs_score_id;
    if (isRound && scoreId) {
      return `/round/${encodeURIComponent(scoreId)}`;
    }

    const pid = data.post_id ?? (entity_type === 'post' ? entity_id : null);
    if (pid) return `/post/${pid}`;
    const actorRoute = actorProfileRoute(row);
    if (actorRoute) return actorRoute;
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

  // --- rate-a-course prompt ------------------------------------------
  // System-authored nudge; entity_id is the course_id. Deep-link matches
  // the push payload's route so in-app tap and push tap behave identically.
  if (type === 'rate_course_prompt') {
    const cid = (data.course_id as string | undefined) ?? entity_id;
    if (cid) return `/rate-course-v2/${cid}`;
  }
  // --- course analytics updated (WHS post-sync — Phase D) ------------
  // Mirrors supabase/functions/_shared/notifRoute.ts. Route must stay
  // identical: /courses/:courseId?tab=holes (holes is the VALID_TABS id
  // for the tab labelled "Analytics").
  if (type === 'course_analytics_updated') {
    const cid = (data.course_id as string | undefined) ?? (entity_type === 'course' ? entity_id : null);
    if (cid) return `/courses/${cid}?tab=holes`;
  }
  // --- golfer verified (system-authored) -----------------------------
  if (type === 'golfer_verified') {
    return '/profile';
  }

  // --- tour digests (system-authored, NO actor, NO target) ------------
  // tour_preview (Thursday) and tour_roundup (Sunday) carry null entity_type,
  // null entity_id and no ids in data, so there is nothing to deep-link to.
  // FIXED ROUTE to the Tour Hub overview — the same path the bottom nav's
  // Tour tab uses (see components/bottom-navigation/navigationTabs.ts).
  // No ?tab and no tour slug: the overview's own picker rules decide the
  // default tour.
  if (type === 'tour_preview' || type === 'tour_roundup') {
    return '/tourhub';
  }

  // --- unknown ---------------------------------------------------------
  if (import.meta.env.DEV) {
    // An unhandled type still returns a valid route, so it fails SILENTLY on
    // Clubhouse. Log it so the next one is found in a console, not a
    // screenshot.
    console.warn('[activityLinks] unhandled notification type:', type, row);
  }
  return actorProfileRoute(row) ?? '/';

}

function buildTopTenLink(row: ActivityFeedRowV2, data: Record<string, string | undefined>): string {
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
