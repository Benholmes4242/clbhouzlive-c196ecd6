import type { BusinessInvite, BusinessMember } from '@/hooks/useBusinessTeam';
import { summaryInvites } from './teamSummary';
import { calendarDays } from './teamList';

/** CB77: pure rules for section three (invites). Which invites show comes from
 * summaryInvites so the section-one summary and this card can never disagree. */

/** Same accept link the invite email builds — see supabase/functions/send-business-invite. */
export const INVITE_ACCEPT_BASE = 'https://www.clbhouz.co.uk/business/invite/accept?token=';
export const inviteLink = (token: string) => `${INVITE_ACCEPT_BASE}${encodeURIComponent(token)}`;

export function cardInvites(invites: BusinessInvite[], team: BusinessMember[], now: Date) {
  const { live, expired } = summaryInvites(invites, team, now);
  const at = (i: BusinessInvite) => new Date(i.expires_at).getTime();
  return [
    ...[...live].sort((a, b) => at(a) - at(b)).map(invite => ({ invite, expired: false })),
    ...[...expired].sort((a, b) => at(b) - at(a)).map(invite => ({ invite, expired: true })),
  ];
}

export const isEmailInvite = (i: BusinessInvite) => !i.invitee_user_id;

/** First name for toasts and copy: first word of the display name, else @username, else email. */
export function inviteFirstName(i: BusinessInvite): string {
  const first = i.invitee_profile?.display_name?.trim().split(/\s+/)[0];
  return first || (i.invitee_profile?.username ? `@${i.invitee_profile.username}` : '') || i.invitee_email || '';
}

export type Ago = { key: 'today' | 'yesterday' } | { key: 'days' | 'weeks'; count: number };
/** Local calendar days since `iso`: today, yesterday, 2–13 days, then whole weeks. */
export function agoBucket(iso: string, now: Date): Ago {
  const n = Math.max(0, calendarDays(iso, now));
  if (n === 0) return { key: 'today' };
  if (n === 1) return { key: 'yesterday' };
  if (n < 14) return { key: 'days', count: n };
  return { key: 'weeks', count: Math.floor(n / 7) };
}

export type Until = { key: 'today' | 'tomorrow' } | { key: 'days'; count: number };
/** Local calendar days until `iso`. */
export function untilBucket(iso: string, now: Date): Until {
  const n = Math.max(0, -calendarDays(iso, now));
  if (n === 0) return { key: 'today' };
  if (n === 1) return { key: 'tomorrow' };
  return { key: 'days', count: n };
}

/** Inviter's first name only when someone other than the viewer sent it and is on the team. */
export function inviterMember(i: BusinessInvite, team: BusinessMember[], viewerId: string | null | undefined) {
  if (!i.invited_by || i.invited_by === viewerId) return null;
  return team.find(m => m.user_profile_id === i.invited_by) ?? null;
}
