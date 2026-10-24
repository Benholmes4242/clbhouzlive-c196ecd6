import type { BusinessInvite, BusinessMember } from '@/hooks/useBusinessTeam';

/** CB75: pure rules for summary; existing section-two pending rows are untouched. */
export function inviteName(invite: BusinessInvite): string {
  return invite.invitee_profile?.display_name || (invite.invitee_profile?.username ? `@${invite.invitee_profile.username}` : '') || invite.invitee_email || '';
}

export function teamInitials(name: string): string {
  return name.trim().replace(/^@/, '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
}

export function summaryInvites(invites: BusinessInvite[], team: BusinessMember[], now: Date) {
  const timestamp = now.getTime();
  const live = invites.filter(i => i.status === 'pending' && new Date(i.expires_at).getTime() > timestamp);
  const memberIds = new Set(team.map(m => m.user_profile_id));
  const expired = invites.filter(i => {
    const expiry = new Date(i.expires_at).getTime();
    return (i.status === 'expired' || i.status === 'pending') && expiry < timestamp && expiry >= timestamp - 14 * 86400000
      && !(i.invitee_user_id && memberIds.has(i.invitee_user_id))
      && !(i.invitee_profile?.id && memberIds.has(i.invitee_profile.id));
  });
  return { live, expired };
}

export function teamSummaryRule(canManage: boolean, requestCount: number, live: BusinessInvite[], expired: BusinessInvite[]) {
  if (canManage && requestCount > 0) return { kind: 'requests' as const, count: requestCount, name: '' };
  if (live.length) return { kind: 'live' as const, count: live.length, name: inviteName(live[0]) };
  if (expired.length) return { kind: 'expired' as const, count: expired.length, name: inviteName(expired[0]) };
  return null;
}

export function teamAvatarMembers(team: BusinessMember[]) {
  const order = { owner: 0, admin: 1, editor: 2, analyst: 3 };
  return [...team].sort((a, b) => order[a.role] - order[b.role]).slice(0, 4);
}

export function requestPlaysHere(clubId: string | null | undefined, requester: { primary_club_id: string | null; home_club_visibility: string | null }) {
  return !!clubId && requester.primary_club_id === clubId && requester.home_club_visibility === 'public';
}

export function requestWhen(createdAt: string, now: Date, locale = 'en-GB') {
  const date = new Date(createdAt);
  const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
  if (days === 0) return { key: 'today' as const, value: '' };
  if (days === 1) return { key: 'yesterday' as const, value: '' };
  if (days > 1 && days < 7) return { key: 'date' as const, value: date.toLocaleDateString(locale, { weekday: 'long' }) };
  return { key: 'date' as const, value: date.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) }) };
}