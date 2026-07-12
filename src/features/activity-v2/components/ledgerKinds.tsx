/**
 * Activity V2 kind router. Maps notif_type -> visual treatment.
 * See legacy typeSpec() in src/components/activity/notifications/InboxRow.tsx
 * for the tinted-tile taxonomy this file replaces.
 */

import React from 'react';
import {
  Heart, MessageSquare, UserPlus, Users, Building2, Bell,
  Star, Reply, AtSign, BadgeCheck, XCircle, Trophy, Clock,
  MailQuestion, Ban, Flag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LeftVisualKind =
  | 'actor'              // actor_avatar_url or initials
  | 'stacked_likers'     // 2-avatar stagger for likes
  | 'tile';              // tinted icon square

export type RightElementKind =
  | 'none'
  | 'thumb'              // 44x44 media/course thumb
  | 'follow_back'        // ink pill (follow-state gated)
  | 'resolve'            // amber bordered pill
  | 'rating';            // review-score bold token

export interface KindSpec {
  left: LeftVisualKind;
  right: RightElementKind;
  tile?: {
    icon: LucideIcon;
    fg: string;
    bg: string;
  };
  bold?: 'course_name' | 'club_name' | 'business_name' | 'achievement_name';
  isSystem?: boolean;
}

// Token palette (dispatch light) --------------------------------------
export const T = {
  INK: '#0F172A',
  INK_60: '#475569',
  INK_45: '#64748B',
  HAIR: 'rgba(15,23,42,0.10)',
  AMBER: '#F7931E',
  AMBER_DEEP: '#C97A10',
  AMBER_SOFT: 'rgba(247,147,30,0.10)',
  GREEN: '#189A55',
  GREEN_SOFT: 'rgba(24,154,85,0.10)',
  RED: '#C24A4A',
  RED_SOFT: 'rgba(194,74,74,0.10)',
  BLUE: '#2563EB',
  BLUE_SOFT: 'rgba(37,99,235,0.09)',
  NEUTRAL: '#F1F5F9',
  GOLD: '#B36B00',
  GOLD_SOFT: 'rgba(179,107,0,0.12)',
} as const;

export function resolveKind(row: {
  notif_type: string;
  liker_avatar_urls?: any;
  target_poster_url?: string | null;
  target_course_image?: string | null;
  target_review_rating?: number | null;
}): KindSpec {
  const t = row.notif_type;

  // LIKES ------------------------------------------------------------
  if (t === 'like' || t === 'like_post') {
    const likers = Array.isArray(row.liker_avatar_urls) ? row.liker_avatar_urls : [];
    return {
      left: likers.length > 1 ? 'stacked_likers' : 'actor',
      right: row.target_poster_url || row.target_course_image ? 'thumb' : 'none',
    };
  }

  // COMMENTS / MENTIONS / TOP-TEN ------------------------------------
  if (
    t === 'comment' || t === 'comment_post' || t === 'comment_reply' ||
    t === 'top_ten_comment' || t === 'top_ten_reply' ||
    t === 'mention' || t === 'mention_post' || t === 'comment_mention' ||
    t === 'top_ten_mention' || t === 'tag'
  ) {
    return {
      left: 'actor',
      right: row.target_poster_url || row.target_course_image ? 'thumb' : 'none',
    };
  }

  // FOLLOW / FRIEND -------------------------------------------------
  if (t === 'follow') return { left: 'actor', right: 'follow_back' };
  if (t === 'friend_accept' || t === 'friend_accepted') return { left: 'actor', right: 'none' };
  if (t === 'friend_request' || t === 'friend_request_sent') return { left: 'actor', right: 'none' };
  if (t === 'friend_declined' || t === 'friend_cancelled') return { left: 'actor', right: 'none' };

  // POSTS -----------------------------------------------------------
  if (t === 'new_post') {
    return {
      left: 'actor',
      right: row.target_poster_url || row.target_course_image ? 'thumb' : 'none',
    };
  }

  // COURSE REVIEWS --------------------------------------------------
  if (
    t === 'friend_course_review' || t === 'course_review' ||
    t === 'course_review_received'
  ) {
    return {
      left: 'actor',
      right: row.target_review_rating != null ? 'rating' : 'thumb',
      bold: 'course_name',
    };
  }
  if (t === 'review_response_posted') {
    return { left: 'actor', right: row.target_course_image ? 'thumb' : 'none', bold: 'course_name' };
  }

  // ACHIEVEMENTS ----------------------------------------------------
  if (t === 'achievement' || t === 'achievement_unlocked' || t === 'milestone_reached') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Trophy, fg: T.GOLD, bg: T.GOLD_SOFT },
      bold: 'achievement_name',
      isSystem: true,
    };
  }

  // BUSINESS VERIFICATION ------------------------------------------
  if (t === 'business_verification_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: BadgeCheck, fg: T.GREEN, bg: T.GREEN_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_rejected') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Ban, fg: T.RED, bg: T.RED_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_needs_info' || t === 'business_verification_more_proof_requested') {
    return {
      left: 'tile',
      right: 'resolve',
      tile: { icon: MailQuestion, fg: T.AMBER_DEEP, bg: T.AMBER_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_submitted') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Clock, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
      bold: 'business_name',
    };
  }

  // COURSE CLAIMS --------------------------------------------------
  if (t === 'course_claim_needs_info') {
    return {
      left: 'tile',
      right: 'resolve',
      tile: { icon: MailQuestion, fg: T.AMBER_DEEP, bg: T.AMBER_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_rejected') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Ban, fg: T.RED, bg: T.RED_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: BadgeCheck, fg: T.GREEN, bg: T.GREEN_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_submitted') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Clock, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
      bold: 'course_name',
    };
  }

  // BUSINESS TEAM / MEMBERSHIP -------------------------------------
  if (t === 'business_member_added' || t === 'business_access_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Building2, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_team_invited') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Users, fg: T.AMBER_DEEP, bg: T.AMBER_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_team_joined' || t === 'business_team_member_joined') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Building2, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
      bold: 'business_name',
    };
  }

  // CLUBS -----------------------------------------------------------
  if (t.startsWith('club_')) {
    return { left: 'actor', right: 'none', bold: 'club_name' };
  }

  // SUPPORT / SYSTEM / MESSAGE -------------------------------------
  if (t === 'support_reply') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Reply, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
    };
  }
  if (t === 'message') return { left: 'actor', right: 'none' };
  if (t === 'system' || t === 'app_update' || t === 'tip') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Bell, fg: T.INK_60, bg: T.NEUTRAL },
      isSystem: true,
    };
  }
  if (t === 'handicap_authority_live') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Flag, fg: T.AMBER_DEEP, bg: T.AMBER_SOFT },
      isSystem: true,
    };
  }

  // Unknown: safe fallback ----------------------------------------
  return { left: 'actor', right: 'none' };
}

/**
 * For comment/reply kinds where `message` holds the raw comment body,
 * compose `<b>{actor}</b> replied: "…"` (or `commented:` for non-replies).
 * Returns null when the row should render via the default body path
 * (i.e. plain comments whose message already starts with the actor name).
 */
export function composeCommentBody(row: {
  notif_type: string;
  message?: string | null;
  actor_display_name?: string | null;
}): React.ReactNode | null {
  const t = row.notif_type;
  const isReply = t === 'comment_reply' || t === 'top_ten_reply';
  const isComment = t === 'comment' || t === 'comment_post' || t === 'top_ten_comment';
  if (!isReply && !isComment) return null;
  const msg = (row.message ?? '').trim();
  if (!msg) return null;
  const actor = row.actor_display_name ?? '';
  // Plain comments whose message already leads with the actor name are
  // rendered by the default bold-prefix path — untouched.
  if (isComment && actor && msg.startsWith(actor)) return null;
  const verb = isReply ? ' replied: ' : ' commented: ';
  return (
    <>
      <span style={{ fontWeight: 700 }}>{actor || 'Someone'}</span>
      {verb}
      <span style={{ color: T.INK_45, fontStyle: 'italic' }}>{`\u201C${msg}\u201D`}</span>
    </>
  );
}

// icons that some rows expose to callers (e.g. verification tiles)
export const KindIcons = {
  Heart, MessageSquare, UserPlus, Users, Building2, Bell, Star, Reply, AtSign,
  BadgeCheck, XCircle, Trophy, Clock, MailQuestion, Ban, Flag,
};
