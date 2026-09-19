import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getActivityLink } from '../activityLinks';
import { routeForNotif } from '../../../../../supabase/functions/_shared/notifRoute';
import type { ActivityFeedRowV2 } from '../../hooks/useActivityFeedV2';

/**
 * N3.5 — PARITY. The Deno push router (supabase/functions/_shared/notifRoute.ts)
 * is a port of the client link builder (activityLinks.ts). It drifted by twenty
 * types once; this test is why it cannot again.
 *
 * Each fixture is the realistic payload its trigger writes. Both routers must
 * produce the same route, EXCEPT the documented '' cases below: the client
 * returns '' to mean "inert row, do not navigate", a contract a push cannot
 * honour (the worker builds `${APP_ORIGIN}${route}`, so '' means the home
 * screen). Those return the port's /notificationmessages fallback instead.
 */
const FALLBACK = '/notificationmessages';

function row(partial: Partial<ActivityFeedRowV2>): ActivityFeedRowV2 {
  return {
    notif_id: 'n1',
    notif_type: 'like',
    created_at: '2026-09-19T10:00:00Z',
    is_read: false,
    message: null,
    title: null,
    entity_id: null,
    entity_type: null,
    data: null,
    actor_user_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    actor_username: null,
    actor_display_name: null,
    actor_avatar_url: null,
    actor_kind: 'personal',
    actor_route_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    liker_avatar_urls: null,
    target_course_name: null,
    target_course_image: null,
    target_poster_url: null,
    target_review_rating: null,
    ...partial,
  };
}

const POST = 'post-1';
const CID = 'course-1';
const RID = 'review-1';
const SID = 'score-1';
const ACTOR = 'aaaaaaaa-0000-0000-0000-000000000001';

type Fixture = { name: string; row: Partial<ActivityFeedRowV2> };

/** One fixture per handled notification type (realistic trigger payloads). */
const FIXTURES: Fixture[] = [
  // rounds win outright
  { name: 'new_post (round)', row: { notif_type: 'new_post', entity_type: 'post', entity_id: POST, data: { post_id: POST, is_round: true, whs_score_id: SID, post_type: 'round' } } },
  { name: 'new_post (post)', row: { notif_type: 'new_post', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'like on a round post', row: { notif_type: 'like', entity_type: 'post', entity_id: POST, data: { post_id: POST, post_type: 'round', whs_score_id: SID } } },
  { name: 'comment on a round post', row: { notif_type: 'comment', entity_type: 'post', entity_id: POST, data: { post_id: POST, comment_id: 'c1', post_type: 'round', whs_score_id: SID } } },

  // game family
  { name: 'crown_taken', row: { notif_type: 'crown_taken', entity_type: 'course', entity_id: CID, data: { course_id: CID, category: 'gross' } } },
  { name: 'crown_lost', row: { notif_type: 'crown_lost', data: { course_id: CID } } },
  { name: 'legend_earned', row: { notif_type: 'legend_earned', data: { course_id: CID } } },
  { name: 'legend_lost', row: { notif_type: 'legend_lost', data: { course_id: CID } } },
  { name: 'course_record_beaten', row: { notif_type: 'course_record_beaten', data: { course_id: CID } } },
  { name: 'rival_played', row: { notif_type: 'rival_played', data: { course_id: CID } } },

  // streaks / trophies
  { name: 'streak_broken', row: { notif_type: 'streak_broken', data: {} } },
  { name: 'streak_at_risk', row: { notif_type: 'streak_at_risk', data: {} } },
  { name: 'streak_freeze_applied', row: { notif_type: 'streak_freeze_applied', data: {} } },
  { name: 'level_up', row: { notif_type: 'level_up', data: { level: '4' } } },
  { name: 'level_near', row: { notif_type: 'level_near', data: {} } },
  { name: 'status_at_risk', row: { notif_type: 'status_at_risk', data: {} } },
  { name: 'status_reclaimed', row: { notif_type: 'status_reclaimed', data: {} } },
  { name: 'badge_earned', row: { notif_type: 'badge_earned', data: { badge_id: 'first-eagle' } } },

  // reactions
  { name: 'reaction on a round', row: { notif_type: 'reaction', entity_type: 'score', entity_id: SID, data: { target_type: 'round', target_id: SID, score_id: SID, course_id: CID } } },
  { name: 'reaction on a review', row: { notif_type: 'reaction', entity_type: 'review', entity_id: RID, data: { target_type: 'review', target_id: RID, course_id: CID } } },

  // likes
  { name: 'like on a post', row: { notif_type: 'like', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'like_post', row: { notif_type: 'like_post', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'like on a review (R3.3)', row: { notif_type: 'like', entity_type: 'post', entity_id: POST, data: { post_id: POST, target_type: 'review', review_id: RID, course_id: CID } } },

  // comments
  { name: 'comment', row: { notif_type: 'comment', entity_type: 'post', entity_id: POST, data: { post_id: POST, comment_id: 'c1' } } },
  { name: 'comment_post (no comment id)', row: { notif_type: 'comment_post', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'comment_reply', row: { notif_type: 'comment_reply', entity_type: 'comment', entity_id: 'c1', data: { post_id: POST, comment_id: 'c1' } } },
  { name: 'comment on a round (G7.2e)', row: { notif_type: 'comment', data: { target_type: 'round', target_id: SID, score_id: SID } } },
  { name: 'comment on a review (G7.2e)', row: { notif_type: 'comment', data: { target_type: 'review', review_id: RID, course_id: CID } } },

  // mentions
  { name: 'mention (post)', row: { notif_type: 'mention', entity_type: 'post', entity_id: POST, data: { source_type: 'post', post_id: POST } } },
  { name: 'mention (comment)', row: { notif_type: 'mention', entity_type: 'comment', entity_id: 'c1', data: { source_type: 'comment', post_id: POST, comment_id: 'c1' } } },
  { name: 'mention (review)', row: { notif_type: 'mention', entity_type: 'review', entity_id: RID, data: { source_type: 'review', course_id: CID, review_id: RID } } },
  { name: 'mention (legacy rating_id)', row: { notif_type: 'mention', entity_type: 'review', entity_id: RID, data: { source_type: 'review', course_id: CID, rating_id: RID } } },
  { name: 'mention (top ten comment)', row: { notif_type: 'mention', data: { source_type: 'top_ten_comment', target_user_id: 'u2', top_ten_comment_id: 'tc1', course_id: CID } } },
  { name: 'mention_post', row: { notif_type: 'mention_post', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'tag', row: { notif_type: 'tag', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },
  { name: 'comment_mention', row: { notif_type: 'comment_mention', entity_type: 'post', entity_id: POST, data: { post_id: POST } } },

  // top ten
  { name: 'top_ten_comment', row: { notif_type: 'top_ten_comment', entity_type: 'top_ten', data: { target_user_id: 'u2', top_ten_comment_id: 'tc1', course_id: CID } } },
  { name: 'top_ten_reply', row: { notif_type: 'top_ten_reply', entity_type: 'top_ten', data: { target_user_id: 'u2', top_ten_comment_id: 'tc1', parent_comment_id: 'tc0' } } },

  // course surfaces
  // ORDERING SHADOW (reported, not fixed here): the client resolves these two
  // types BELOW its generic `entity_type === 'course'` fallback, so a row that
  // also carries entity_type 'course' returns /courses/:id in-app while the push
  // returns the intended deep link. The fixtures carry the course id in data
  // only, which is what both routers read first. Fixing the client's order is a
  // client change and outside N3.
  { name: 'rate_course_prompt', row: { notif_type: 'rate_course_prompt', entity_id: CID, data: { course_id: CID } } },
  { name: 'course_analytics_updated', row: { notif_type: 'course_analytics_updated', data: { course_id: CID } } },
  { name: 'friend_course_review', row: { notif_type: 'friend_course_review', entity_type: 'course', entity_id: CID, data: { course_id: CID, review_id: RID } } },
  { name: 'course_review', row: { notif_type: 'course_review', data: { course_id: CID, rating_id: RID } } },
  { name: 'course_review_received', row: { notif_type: 'course_review_received', data: { course_id: CID, review_id: RID } } },
  { name: 'review_response_posted', row: { notif_type: 'review_response_posted', data: { course_id: CID, review_id: RID } } },

  // system-authored
  { name: 'video_ready', row: { notif_type: 'video_ready', entity_type: 'post', entity_id: POST, data: { post_id: POST, stream_id: 'st1' } } },
  { name: 'service_announcement (route)', row: { notif_type: 'service_announcement', data: { campaign: 'c', route: '/amateur' } } },
  { name: 'golfer_verified', row: { notif_type: 'golfer_verified', data: {} } },
  { name: 'tour_preview', row: { notif_type: 'tour_preview', data: {} } },
  { name: 'tour_roundup', row: { notif_type: 'tour_roundup', data: {} } },
  { name: 'onboarding_nudge (whs)', row: { notif_type: 'onboarding_nudge', data: { gap: 'whs' } } },
  { name: 'onboarding_nudge (club)', row: { notif_type: 'onboarding_nudge', data: { gap: 'club' } } },
  { name: 'onboarding_nudge (username)', row: { notif_type: 'onboarding_nudge', data: { gap: 'username' } } },
  { name: 'onboarding_nudge (no gap)', row: { notif_type: 'onboarding_nudge', data: {} } },

  // social / business / clubs / support
  { name: 'follow (personal)', row: { notif_type: 'follow', data: { follower_actor_type: 'personal', follower_actor_id: ACTOR } } },
  { name: 'follow (business)', row: { notif_type: 'follow', data: { follower_actor_type: 'business', follower_actor_id: 'biz-1' } } },
  { name: 'friend_request', row: { notif_type: 'friend_request', data: {} } },
  { name: 'friend_accepted', row: { notif_type: 'friend_accepted', data: {} } },
  { name: 'achievement_unlocked', row: { notif_type: 'achievement_unlocked', data: {} } },
  { name: 'milestone_reached', row: { notif_type: 'milestone_reached', data: {} } },
  { name: 'business_verification_approved', row: { notif_type: 'business_verification_approved', data: { business_slug: 'biz' } } },
  { name: 'course_claim_approved', row: { notif_type: 'course_claim_approved', data: { course_id: CID } } },
  { name: 'business_member_added', row: { notif_type: 'business_member_added', data: { business_id: 'biz-1' } } },
  { name: 'business_team_invited', row: { notif_type: 'business_team_invited', data: { token: 'tok 1' } } },
  { name: 'business_team_joined', row: { notif_type: 'business_team_joined', data: { business_id: 'biz-1' } } },
  { name: 'business_team_member_joined', row: { notif_type: 'business_team_member_joined', data: { business_id: 'biz-1' } } },
  { name: 'club_invite', row: { notif_type: 'club_invite', data: { club_id: 'club-1' } } },
  { name: 'support_reply', row: { notif_type: 'support_reply', data: { ticket_id: 't1' } } },
  { name: 'message', row: { notif_type: 'message', data: {} } },
  { name: 'handicap_authority_live', row: { notif_type: 'handicap_authority_live', data: {} } },
];

/**
 * TRAP 1 — the '' contract. Each entry: the client returns '' (inert row) and
 * the port must return the activity-list fallback, because an empty route in
 * the worker resolves to the bare origin (the home screen).
 */
const INERT_EXCEPTIONS: Fixture[] = [
  // Champions family with no course id: nothing to open, so the in-app row is
  // non-tappable. A push is already delivered, so it lands on the activity list.
  { name: 'crown_taken without a course id', row: { notif_type: 'crown_taken', data: {} } },
  { name: 'rival_played without a course id', row: { notif_type: 'rival_played', data: {} } },
  // A reaction on a review whose course is unknown: no review permalink exists.
  { name: 'reaction on a review without a course id', row: { notif_type: 'reaction', data: { target_type: 'review', target_id: RID } } },
  // Same for a comment on a review (G7.2e uses the same two destinations).
  { name: 'comment on a review without a course id', row: { notif_type: 'comment', data: { target_type: 'review', review_id: RID } } },
  // A service announcement is the whole message; '/' is Clubhouse, not a target.
  { name: 'service_announcement with no route', row: { notif_type: 'service_announcement', data: { campaign: 'c' } } },
  { name: 'service_announcement routed at /', row: { notif_type: 'service_announcement', data: { campaign: 'c', route: '/' } } },
];

describe('notifRoute parity with activityLinks', () => {
  it.each(FIXTURES)('$name resolves identically in both routers', ({ row: partial }) => {
    const r = row(partial);
    expect(
      routeForNotif({
        notif_type: r.notif_type,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        data: r.data as Record<string, unknown> | null,
        actor_user_id: r.actor_user_id,
      }),
    ).toBe(getActivityLink(r));
  });

  it.each(INERT_EXCEPTIONS)('$name is inert on the client and falls back on push', ({ row: partial }) => {
    const r = row(partial);
    expect(getActivityLink(r)).toBe('');
    expect(
      routeForNotif({
        notif_type: r.notif_type,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        data: r.data as Record<string, unknown> | null,
        actor_user_id: r.actor_user_id,
      }),
    ).toBe(FALLBACK);
  });
});

/**
 * A type handled by one file and not the other must fail. Both files name their
 * handled types the same way (`type === '...'` / `type.startsWith('...')`), so
 * the two sets are compared directly.
 */
const ROOT = path.resolve(__dirname, '../../../../..');

function handledTypes(file: string): Set<string> {
  const src = readFileSync(path.join(ROOT, file), 'utf8');
  const out = new Set<string>();
  for (const m of src.matchAll(/type === '([^']+)'/g)) out.add(m[1]);
  for (const m of src.matchAll(/type\.startsWith\('([^']+)'\)/g)) out.add(`${m[1]}*`);
  for (const m of src.matchAll(/^\s+'([a-z_]+)',$/gm)) out.add(m[1]); // set literals
  return out;
}

/** Types the port knowingly handles beyond the client, each with its reason. */
const PORT_ONLY = new Set<string>([
  // Legacy record type kept in the port's own record family; the client resolves
  // it through its /courses entity fallback, so no push lands wrong.
  'top_100_record_beaten',
  'record_*',
  // The port matches the whole legend_ family by prefix; the client names its two
  // members (legend_earned, legend_lost) explicitly. Same destination either way.
  'legend_*',
  // Direct-message pushes are addressed by thread; the in-app list has no DM row.
  'dm_*',
]);

/** Types the client handles beyond the port, each with its reason. */
const CLIENT_ONLY = new Set<string>([]);

describe('notifRoute handled-type coverage', () => {
  it('handles the same notification types in both files', () => {
    const client = handledTypes('src/features/activity-v2/utils/activityLinks.ts');
    const port = handledTypes('supabase/functions/_shared/notifRoute.ts');
    const missingFromPort = [...client].filter((t) => !port.has(t) && !CLIENT_ONLY.has(t));
    const extraInPort = [...port].filter((t) => !client.has(t) && !PORT_ONLY.has(t));
    expect({ missingFromPort, extraInPort }).toEqual({ missingFromPort: [], extraInPort: [] });
  });
});
