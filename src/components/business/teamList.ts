import type { BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';

/** CB76: pure rules for the Team list (section two). The menu matrix mirrors the
 * live RPC permissions exactly; the server stays authoritative for every write. */

export interface TeamActivity { user_id: string; posts_30d: number; replies_30d: number; last_active_at: string | null }
export type MenuItem = 'role' | 'jobTitle' | 'visibility' | 'makeOwner' | 'remove' | 'leave';

const ROLE_ORDER: Record<BusinessRole, number> = { owner: 0, admin: 1, editor: 2, analyst: 3 };

export function sortTeam(team: BusinessMember[]): BusinessMember[] {
  const time = (m: BusinessMember) => (m.created_at ? new Date(m.created_at).getTime() : Number.POSITIVE_INFINITY);
  return [...team].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || time(a) - time(b));
}

export function memberFirstName(m: BusinessMember): string {
  const first = m.user_profile?.display_name?.trim().split(/\s+/)[0];
  return first || (m.user_profile?.username ? `@${m.user_profile.username}` : '');
}

export function memberMenu(viewerRole: BusinessRole | null | undefined, viewerId: string | null | undefined, m: BusinessMember, team: BusinessMember[]): MenuItem[] {
  if (!viewerRole || !viewerId) return [];
  if (m.user_profile_id === viewerId) {
    const owners = team.filter(t => t.role === 'owner').length;
    const onlyOwner = m.role === 'owner' && owners <= 1;
    return onlyOwner ? ['jobTitle', 'visibility'] : ['jobTitle', 'visibility', 'leave'];
  }
  if (viewerRole === 'owner') {
    // An owner row cannot be "made owner" again; every other owner item stands.
    return m.role === 'owner' ? ['role', 'jobTitle', 'visibility', 'remove'] : ['role', 'jobTitle', 'visibility', 'makeOwner', 'remove'];
  }
  if (viewerRole === 'admin' && m.role !== 'owner') return ['role', 'jobTitle', 'visibility', 'remove'];
  return [];
}

/** Local calendar-day difference between `iso` and `now`. */
export function calendarDays(iso: string, now: Date): number {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

export type When = { key: 'today' | 'yesterday' | 'lastWeek' } | { key: 'weekday'; day: string } | { key: 'weeksAgo'; count: number };

export function activityWhen(iso: string, now: Date, locale = 'en-GB'): When {
  const days = Math.max(0, calendarDays(iso, now));
  if (days === 0) return { key: 'today' };
  if (days === 1) return { key: 'yesterday' };
  if (days < 7) return { key: 'weekday', day: new Date(iso).toLocaleDateString(locale, { weekday: 'long' }) };
  if (days < 14) return { key: 'lastWeek' };
  return { key: 'weeksAgo', count: Math.floor(days / 7) };
}

export type ActivityLine =
  | { kind: 'counts'; posts: number; replies: number; when: When | null }
  | { kind: 'neverPosted' }
  | { kind: 'inactive'; weeks: number }
  | { kind: 'lastActive'; when: When };

export function activityLine(m: BusinessMember, a: TeamActivity | undefined, now: Date): ActivityLine | null {
  if (m.role === 'analyst' || !a) return null;
  if (a.posts_30d > 0 || a.replies_30d > 0) {
    return { kind: 'counts', posts: a.posts_30d, replies: a.replies_30d, when: a.last_active_at ? activityWhen(a.last_active_at, now) : null };
  }
  if (!a.last_active_at) return { kind: 'neverPosted' };
  const days = calendarDays(a.last_active_at, now);
  if (m.role !== 'owner' && days >= 56) return { kind: 'inactive', weeks: Math.floor(days / 7) };
  return { kind: 'lastActive', when: activityWhen(a.last_active_at, now) };
}
