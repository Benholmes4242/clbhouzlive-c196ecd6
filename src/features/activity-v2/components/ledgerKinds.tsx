/**
 * Activity V2 kind router. Maps notif_type -> visual treatment.
 * See legacy typeSpec() in src/components/activity/notifications/InboxRow.tsx
 * for the tinted-tile taxonomy this file replaces.
 */

import React from 'react';
import {
  Heart, MessageSquare, UserPlus, Users, Building2, Bell,
  Star, Reply, AtSign, BadgeCheck, XCircle, Trophy, Clock,
  MailQuestion, Ban, Flag, Crown, TrendingUp, Flame, Swords, ShieldAlert, Award,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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
  bold?: 'course_name' | 'club_name' | 'business_name' | 'achievement_name' | 'badge_title';
  isSystem?: boolean;
}

/**
 * ACTIVITY DARK PALETTE (BRIEF_ACTIVITY_PAGE_DARK §1).
 *
 * This object was `T`, commented "dispatch light", and every one of its
 * sixteen values was tuned for ink on white. The page now runs on the app's
 * dark canvas, so the name and the comment were the first thing to fix: an
 * object whose name contradicts its contents is exactly what produced
 * DARK_BAND_GREEN sitting beside BAND_GREEN_DARK elsewhere in this tree.
 *
 * The ink ramp is SOURCED from the analytical A ramp rather than re-derived,
 * so Activity cannot drift from the rest of the dark app:
 *   INK    -> A.INK    (#F8FAFC)      the facts: names, what they did
 *   INK_60 -> A.BODY   (white 0.72)   supporting body copy
 *   INK_45 -> A.MUTE   (white 0.62)   chrome: timestamps, eyebrows (§5.1 floor)
 *   HAIR   -> A.BORDER (white 0.10)   was a BLACK-alpha rule, invisible on dark
 *
 * The _SOFT tints are RECOMPUTED against the dark panel, not carried across:
 * a 10% tint that reads on white disappears on #15171F, so each is lifted.
 */
export const ACT = {
  INK: A.INK,
  INK_60: A.BODY,
  INK_45: A.MUTE,
  /** The tile/row rule. White-alpha, because a black-alpha rule does nothing here. */
  HAIR: A.BORDER,
  /** Label colour for anything using INK as a FILL (§2.2). */
  CANVAS: A.CANVAS,
  AMBER: '#F7931E',
  /**
   * §1.4 COLLAPSED. #C97A10 was a fourth deep amber, and it existed only to
   * survive small type ON WHITE. On dark it is the FAILING value, so it now
   * resolves to AMBER — the same call Part A made for the analytical ramp.
   * The key is kept so no consumer needs editing.
   */
  AMBER_DEEP: '#F7931E',
  AMBER_SOFT: 'rgba(247,147,30,0.16)',
  GREEN: A.GREEN,
  GREEN_SOFT: 'rgba(52,215,127,0.14)',
  /**
   * §1.6 NOT the under-par red and deliberately not becoming it. Red here means
   * DECLINE / LOSS / REMOVAL — crown lost, streak broken, request rejected,
   * blocked. That is a different meaning from "under par is good", so it stays
   * a different value: the app's failure red, which is dark-tuned already.
   */
  RED: '#F0616D',
  RED_SOFT: 'rgba(240,97,109,0.14)',
  /** §1.7 Currently unreferenced — see the report. Kept, dark-legible. */
  BLUE: '#6AA6FF',
  BLUE_SOFT: 'rgba(106,166,255,0.14)',
  /** §1.3 A tile GROUND, not an ink: the raised panel step over the canvas. */
  NEUTRAL: 'rgba(255,255,255,0.08)',
  /**
   * §1.5 #B36B00 was neither of the app's golds — a brown-gold that existed to
   * hold contrast on white. It colours crowns, badges and achievements, i.e.
   * RARE / EARNED, so it resolves to the app's achievement gold.
   */
  GOLD: '#FFB800',
  GOLD_SOFT: 'rgba(255,184,0,0.14)',
} as const;

/**
 * Game family ("Crowns" chip). MUST match v_game_types in
 * public.get_activity_feed and the activityCopy() map in
 * supabase/functions/gam-evaluator/index.ts. These rows are excluded from the
 * All / New / Mentions / Friends filters server-side.
 */
export const GAME_NOTIF_TYPES = [
  'level_up',
  'level_near',
  'legend_earned',
  'legend_lost',
  'crown_taken',
  'crown_lost',
  'streak_at_risk',
  'streak_broken',
  'streak_freeze_applied',
  'status_at_risk',
  'status_reclaimed',
  'rival_played',
  'badge_earned',
] as const;

export function isGameNotifType(t: string): boolean {
  return (GAME_NOTIF_TYPES as readonly string[]).includes(t);
}

export function resolveKind(row: {
  notif_type: string;
  /** Present so the unknown fallback can tell "nobody did this" from "someone did". */
  actor_user_id?: string | null;
  liker_avatar_urls?: unknown;
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

  // DISCOVER REACTIONS ------------------------------------------------
  // Same shape as a post like: the actor's avatar, plus a thumb when the
  // feed row carries one. Previously fell through to the generic default.
  if (t === 'reaction') {
    return {
      left: 'actor',
      right: row.target_course_image || row.target_poster_url ? 'thumb' : 'none',
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

  // GAME / CROWNS ---------------------------------------------------
  if (t === 'crown_taken' || t === 'legend_earned') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Crown, fg: ACT.GOLD, bg: ACT.GOLD_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'crown_lost' || t === 'legend_lost') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Crown, fg: ACT.RED, bg: ACT.RED_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'level_up' || t === 'level_near') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: TrendingUp, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
    };
  }
  if (t === 'streak_broken' || t === 'streak_at_risk' || t === 'streak_freeze_applied') {
    return {
      left: 'tile',
      right: 'none',
      tile: {
        icon: Flame,
        fg: t === 'streak_broken' ? ACT.RED : ACT.AMBER_DEEP,
        bg: t === 'streak_broken' ? ACT.RED_SOFT : ACT.AMBER_SOFT,
      },
      isSystem: true,
    };
  }
  if (t === 'status_at_risk' || t === 'status_reclaimed') {
    return {
      left: 'tile',
      right: 'none',
      tile: {
        icon: ShieldAlert,
        fg: t === 'status_reclaimed' ? ACT.GREEN : ACT.AMBER_DEEP,
        bg: t === 'status_reclaimed' ? ACT.GREEN_SOFT : ACT.AMBER_SOFT,
      },
      isSystem: true,
    };
  }
  if (t === 'badge_earned') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Award, fg: ACT.GOLD, bg: ACT.GOLD_SOFT },
      isSystem: true,
      bold: 'badge_title',
    };
  }
  if (t === 'rival_played') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Swords, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
      bold: 'course_name',
    };
  }

  // ACHIEVEMENTS ----------------------------------------------------
  if (t === 'achievement' || t === 'achievement_unlocked' || t === 'milestone_reached') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Trophy, fg: ACT.GOLD, bg: ACT.GOLD_SOFT },
      bold: 'achievement_name',
      isSystem: true,
    };
  }

  // BUSINESS VERIFICATION ------------------------------------------
  if (t === 'business_verification_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: BadgeCheck, fg: ACT.GREEN, bg: ACT.GREEN_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_rejected') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Ban, fg: ACT.RED, bg: ACT.RED_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_needs_info' || t === 'business_verification_more_proof_requested') {
    return {
      left: 'tile',
      right: 'resolve',
      tile: { icon: MailQuestion, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_verification_submitted') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Clock, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
      bold: 'business_name',
    };
  }

  // COURSE CLAIMS --------------------------------------------------
  if (t === 'course_claim_needs_info') {
    return {
      left: 'tile',
      right: 'resolve',
      tile: { icon: MailQuestion, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_rejected') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Ban, fg: ACT.RED, bg: ACT.RED_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: BadgeCheck, fg: ACT.GREEN, bg: ACT.GREEN_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'course_claim_submitted') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Clock, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
      bold: 'course_name',
    };
  }

  // BUSINESS TEAM / MEMBERSHIP -------------------------------------
  if (t === 'business_member_added' || t === 'business_access_approved') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Building2, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_team_invited') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Users, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
      bold: 'business_name',
    };
  }
  if (t === 'business_team_joined' || t === 'business_team_member_joined') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Building2, fg: ACT.INK_60, bg: ACT.NEUTRAL },
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
      tile: { icon: Reply, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
    };
  }
  if (t === 'message') return { left: 'actor', right: 'none' };
  if (t === 'system' || t === 'app_update' || t === 'tip') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Bell, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
    };
  }
  if (t === 'handicap_authority_live') {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Flag, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
    };
  }
  if (t === 'rate_course_prompt') {
    // System-authored, no actor avatar — render the star tile that mirrors
    // in-app "rate this course" nudges so tap target and iconography agree.
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Star, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
      bold: 'course_name',
    };
  }
  if (t === 'golfer_verified') {
    // System-authored verification confirmation. Amber verified glyph tile,
    // no actor avatar (actor_id is NULL server-side).
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: BadgeCheck, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
    };
  }
  if (t === 'video_ready') {
    // System-authored outcome for the member (actor_id is NULL server-side),
    // so amber tile like golfer_verified / rate_course_prompt — not the
    // neutral Bell, which is reserved for announcements.
    return {
      left: 'tile',
      right: row.target_poster_url || row.target_course_image ? 'thumb' : 'none',
      tile: { icon: Video, fg: ACT.AMBER_DEEP, bg: ACT.AMBER_SOFT },
      isSystem: true,
    };
  }

  // Unknown: safe fallback ----------------------------------------
  // With no actor there is nobody to draw, and asking for one renders a
  // literal '?' via initials(). Degrade to the neutral Bell tile instead so a
  // future system-authored type is never a question mark.
  if (!row.actor_user_id) {
    return {
      left: 'tile',
      right: 'none',
      tile: { icon: Bell, fg: ACT.INK_60, bg: ACT.NEUTRAL },
      isSystem: true,
    };
  }
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
      <span style={{ color: ACT.INK_45, fontStyle: 'italic' }}>{`\u201C${msg}\u201D`}</span>
    </>
  );
}

// icons that some rows expose to callers (e.g. verification tiles)
export const KindIcons = {
  Heart, MessageSquare, UserPlus, Users, Building2, Bell, Star, Reply, AtSign,
  BadgeCheck, XCircle, Trophy, Clock, MailQuestion, Ban, Flag,
  Crown, TrendingUp, Flame, Swords, ShieldAlert, Award,
};
