import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageSquare, UserPlus, Users, Building2, Bell,
  Star, Reply, AtSign, BadgeCheck, XCircle, Trophy, Flag, CheckCircle2, Clock, Ban,
} from 'lucide-react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  getActorDisplayName, getActorAvatarUrl,
  isBusinessEntityNotification, isClbhouzSystemNotification,
} from '@/components/activity/rows/rowHelpers';
import { FollowBackButton } from '@/components/activity/FollowBackButton';
import { FriendRequestButtons } from '@/components/activity/FriendRequestButtons';

// ----- Tokens (approved Option A) --------------------------------------------
const INK = '#0F172A';
const INK_45 = '#64748B';
const INK_60 = '#475569';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97A10';
const GREEN = '#059669';
const GREEN_SOFT = 'rgba(5,150,105,0.10)';
const RED = '#DC2626';
const RED_SOFT = 'rgba(220,38,38,0.08)';
const BLUE = '#2563EB';
const BLUE_SOFT = 'rgba(37,99,235,0.09)';
const NEUTRAL_TINT = '#F1F5F9';
const UNREAD_BG = 'rgba(247,147,30,0.045)';

import type { LucideIcon } from 'lucide-react';
type TypeSpec = { icon: LucideIcon; fg: string; bg: string };

function typeSpec(type: string): TypeSpec {
  switch (type) {
    case 'like':
    case 'like_post':
      return { icon: Heart, fg: RED, bg: RED_SOFT };
    case 'comment':
    case 'comment_post':
    case 'comment_reply':
    case 'top_ten_comment':
    case 'top_ten_reply':
      return { icon: MessageSquare, fg: BLUE, bg: BLUE_SOFT };
    case 'mention':
    case 'mention_post':
    case 'comment_mention':
    case 'top_ten_mention':
    case 'tag':
      return { icon: AtSign, fg: BLUE, bg: BLUE_SOFT };
    case 'follow':
      return { icon: UserPlus, fg: GREEN, bg: GREEN_SOFT };
    case 'friend_request':
    case 'friend_request_sent':
      return { icon: Users, fg: GREEN, bg: GREEN_SOFT };
    case 'friend_accept':
    case 'friend_accepted':
      return { icon: CheckCircle2, fg: GREEN, bg: GREEN_SOFT };
    case 'friend_declined':
    case 'friend_cancelled':
      return { icon: XCircle, fg: INK_60, bg: NEUTRAL_TINT };
    case 'course_review':
    case 'friend_course_review':
    case 'course_review_received':
      return { icon: Star, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'review_response_posted':
      return { icon: Reply, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'business_team_invited':
      return { icon: Users, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'business_team_joined':
    case 'business_team_member_joined':
    case 'business_member_added':
    case 'business_access_approved':
      return { icon: Building2, fg: INK_60, bg: NEUTRAL_TINT };
    case 'business_access_declined':
    case 'business_verification_rejected':
    case 'business_verification_removed':
    case 'business_verification_revoked':
    case 'golfer_verification_rejected':
    case 'golfer_verification_removed':
    case 'course_claim_rejected':
      return { icon: Ban, fg: RED, bg: RED_SOFT };
    case 'business_verification_approved':
    case 'golfer_verification_approved':
      return { icon: BadgeCheck, fg: GREEN, bg: GREEN_SOFT };
    case 'course_claim_approved':
      return { icon: BadgeCheck, fg: GREEN, bg: GREEN_SOFT };
    case 'course_claim_submitted':
    case 'course_claim_needs_info':
    case 'business_verification_submitted':
    case 'business_verification_more_proof_requested':
    case 'golfer_verification_submitted':
    case 'golfer_verification_invite':
      return { icon: Clock, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'achievement':
    case 'achievement_unlocked':
    case 'milestone_reached':
      return { icon: Trophy, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'handicap_authority_live':
      return { icon: Flag, fg: AMBER_DEEP, bg: AMBER_SOFT };
    case 'system':
    case 'app_update':
    case 'tip':
    case 'support_reply':
      return { icon: Bell, fg: INK_60, bg: NEUTRAL_TINT };
    default:
      return { icon: Bell, fg: INK_60, bg: NEUTRAL_TINT };
  }
}

function truncate(s: string, n = 140): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '...' : s;
}

/** Extract the target string (course, business, post excerpt) for the bold trailing token. */
function getTarget(n: ActivityNotification): string | null {
  const d: any = n.data || {};
  return (
    d.course_name || d.club_name || d.business_name || d.entity_name ||
    d.target_name || d.post_title || null
  );
}

/** Verb text between actor and target. */
function getVerb(n: ActivityNotification): string {
  switch (n.type) {
    case 'like':
    case 'like_post': return 'liked your post';
    case 'comment':
    case 'comment_post': return 'commented on your post';
    case 'comment_reply': return 'replied to your comment';
    case 'top_ten_comment': {
      // Course-aware phrasing when the enriched trigger has populated
      // data.course_name; otherwise fall back to a course-less variant.
      const cn = (n.data as any)?.course_name as string | undefined;
      return cn ? `commented on your ${cn} Top 10` : 'commented on your Top 10';
    }
    case 'top_ten_reply': {
      const cn = (n.data as any)?.course_name as string | undefined;
      return cn ? `replied to your comment on ${cn}` : 'replied to your Top 10 comment';
    }
    case 'mention':
    case 'mention_post':
    case 'comment_mention':
    case 'top_ten_mention': return 'mentioned you';
    case 'tag': return 'tagged you';
    case 'follow': return 'started following you';
    case 'new_post': return 'shared a new post';
    case 'friend_request': return 'wants to connect';
    case 'friend_accept':
    case 'friend_accepted': return "accepted your request";
    case 'friend_request_sent': return 'friend request sent';
    case 'friend_course_review':
    case 'course_review': return 'reviewed';
    case 'course_review_received': return 'left a review on';
    case 'review_response_posted': return 'replied to your review';
    case 'business_team_invited': return 'invited you to join';
    case 'business_team_joined': return 'you joined';
    case 'business_team_member_joined': return 'joined your team at';
    case 'business_member_added': return 'you were added to';
    case 'course_claim_approved': return 'your claim was approved';
    case 'course_claim_rejected': return 'your claim was rejected';
    case 'handicap_authority_live': return '';
    default: return '';
  }
}

/** Detail line under the primary line. */
function getDetail(n: ActivityNotification): string | null {
  const d: any = n.data || {};
  switch (n.type) {
    case 'business_team_invited': {
      const role = d.role || d.member_role;
      return role ? `as ${String(role).charAt(0).toUpperCase() + String(role).slice(1)}` : null;
    }
    case 'course_review':
    case 'friend_course_review':
    case 'course_review_received': {
      const rating = d.rating ?? d.stars;
      const excerpt = d.excerpt || d.review_text || d.comment;
      if (rating && excerpt) return `${rating}/10 - ${truncate(excerpt, 100)}`;
      if (rating) return `${rating}/10`;
      if (excerpt) return truncate(excerpt, 120);
      return null;
    }
    case 'comment':
    case 'comment_post':
    case 'comment_reply':
    case 'comment_mention':
    case 'top_ten_comment':
    case 'top_ten_reply':
    case 'mention':
    case 'mention_post':
    case 'top_ten_mention': {
      const excerpt = d.comment || d.excerpt || d.comment_text || n.message;
      return excerpt ? truncate(excerpt, 140) : null;
    }
    case 'review_response_posted': {
      const excerpt = d.response_text || d.excerpt || n.message;
      return excerpt ? truncate(excerpt, 140) : null;
    }
    case 'course_claim_rejected':
    case 'business_verification_rejected':
    case 'business_verification_more_proof_requested':
    case 'course_claim_needs_info': {
      const reason = d.reason || d.note || n.message;
      return reason ? truncate(reason, 160) : null;
    }
    // Types whose enriched trigger message is a FULL SENTENCE that begins
    // with the actor's name — echoing it below the composed title line
    // double-speaks. Suppress the detail line for these single-line social
    // rows. Push copy is unaffected (push reads n.message directly, not
    // this renderer). See ship-note Item 4 for the full audit table.
    case 'friend_request':
    case 'friend_request_sent':
    case 'follow':
    case 'new_post':
    case 'business_member_added':
    case 'business_team_member_joined':
      return null;
    case 'friend_accepted':
      return "You're now connected";
    default: {
      // For system / support / handicap / anything without special copy,
      // surface the message so nothing renders blank.
      return n.message ? truncate(n.message, 160) : null;
    }
  }
}

// -----------------------------------------------------------------------------
interface Props {
  notification: ActivityNotification;
  onClick: () => void;
  currentUserId?: string;
}

export const InboxRow: React.FC<Props> = ({ notification: n, onClick, currentUserId }) => {
  const navigate = useNavigate();
  const spec = typeSpec(n.type);
  const Icon = spec.icon;

  const actorName = getActorDisplayName(n);
  const avatarUrl = getActorAvatarUrl(n);
  const hasActor = !!avatarUrl || (!!n.actor_id && !isClbhouzSystemNotification(n.type));
  const target = getTarget(n);
  const verb = getVerb(n);
  const detail = getDetail(n);
  const isUnread = n.is_unread;
  const isSystemLike = isClbhouzSystemNotification(n.type) || (!n.actor_id && !isBusinessEntityNotification(n.type));

  // Inline action rendering
  let inlineActions: React.ReactNode = null;
  if (n.type === 'business_team_invited') {
    const token = (n.data as any)?.token;
    const acceptUrl = token
      ? `/business/invite/accept?token=${encodeURIComponent(token)}`
      : n.context_url;
    inlineActions = (
      <div className="flex items-center gap-8px mt-2" style={{ gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(acceptUrl); }}
          style={{
            padding: '8px 18px', borderRadius: 10, background: INK, color: '#FFFFFF',
            fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer',
          }}
        >
          Accept
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); /* marks read + navigates fallback */ }}
          style={{
            padding: '8px 18px', borderRadius: 10, background: '#FFFFFF',
            border: `1px solid ${HAIR}`, color: INK_60,
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Decline
        </button>
      </div>
    );
  } else if (n.type === 'follow' && n.actor_id) {
    inlineActions = (
      <div className="mt-1.5">
        <FollowBackButton actorId={n.actor_id} actorDisplayName={actorName} isMock={n.is_mock} />
      </div>
    );
  } else if (n.type === 'friend_request' && n.actor_id) {
    const requestId = (n.data as any)?.request_id || '';
    const status = (n.data as any)?.status;
    if (!status || status === 'pending') {
      inlineActions = (
        <div className="mt-1.5">
          <FriendRequestButtons
            notificationId={n.id}
            requestId={requestId}
            requesterId={n.actor_id}
            requesterName={actorName}
            isMock={n.is_mock}
          />
        </div>
      );
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left active:bg-black/[0.02] transition-colors flex items-start"
      style={{
        gap: 12,
        padding: '13px 16px',
        background: isUnread ? UNREAD_BG : 'transparent',
        borderLeft: `2.5px solid ${isUnread ? AMBER : 'transparent'}`,
      }}
    >
      {/* Left: squircle */}
      <div className="relative shrink-0" style={{ width: 44, height: 46 }}>
        {hasActor && avatarUrl !== null ? (
          <>
            <div style={{ borderRadius: '34%', lineHeight: 0, width: 44, height: 44 }}>
              <SquircleAvatar
                src={avatarUrl}
                alt={actorName || 'User'}
                size={44}
                fallback={actorName?.charAt(0) || '?'}
                hairlineRing
                ringColor={LIGHT_HAIRLINE}
              />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center"
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: `0 0 0 1px ${HAIR}`,
              }}
            >
              <Icon size={11} color={spec.fg} strokeWidth={2.5} />
            </span>
          </>
        ) : (
          <div
            style={{
              width: 44, height: 44, borderRadius: '34%',
              background: spec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={19} color={spec.fg} strokeWidth={2.25} />
          </div>
        )}
      </div>

      {/* Middle: text */}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 14, lineHeight: 1.4, color: INK_60, margin: 0 }}>
          {isSystemLike ? (
            <span style={{ fontWeight: 700, color: INK }}>{n.title || actorName}</span>
          ) : (
            <>
              <span style={{ fontWeight: 700, color: INK }}>{actorName}</span>
              {verb ? <>{' '}<span>{verb}</span></> : null}
              {target ? <>{' '}<span style={{ fontWeight: 700, color: INK }}>{target}</span></> : null}
            </>
          )}
        </p>
        {detail && (
          <p
            className="line-clamp-2"
            style={{ fontSize: 12.5, color: INK_45, margin: '3px 0 0', lineHeight: 1.4 }}
          >
            {detail}
          </p>
        )}
        {inlineActions}
      </div>

      {/* Right: time + unread dot */}
      <div className="shrink-0 flex flex-col items-end" style={{ minWidth: 40, gap: 6 }}>
        <span style={{ fontSize: 11.5, color: INK_45, fontWeight: 500 }} className="tabular-nums">
          {n.time_ago}
        </span>
        {isUnread && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER }} />
        )}
      </div>
    </button>
  );
};
