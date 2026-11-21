/** Members v3 analytics use only the complete overview and verified catalogue.
 * Bucket boundaries, eligibility and sorting live here; callers supply now so
 * rows and panels share one clock without fetching or inventing missing data. */
import type { ProMember } from '@/features/pro-verification/proMembersCache';
import { formatAgo } from './formatAgo';
import { londonDate } from './memberRadarDisplay';
import { CC3 } from '../components/InboxPanels';
import type { MembersOverview, MembersOverviewMember } from '../hooks/useMembersRadar';

const DAY = 86_400_000;
const WEEK = 7 * DAY;
export type MemberSort = 'seen' | 'joined' | 'index' | 'rounds';
export type LifecycleWeek = { start: number; end: number; new: number; back: number; kept: number; lost: number; active: number; previous: number };

export function completeMembership(overview: MembersOverview | undefined): boolean {
  return !!overview && overview.members.length === overview.total;
}
export function validWeeks(member: MembersOverviewMember): boolean {
  return Array.isArray(member.weeks_8) && member.weeks_8.length === 8 && member.weeks_8.every(x => typeof x === 'boolean');
}
export function membersLifecycle(members: readonly MembersOverviewMember[], now: number): LifecycleWeek[] {
  const valid = members.filter(validWeeks);
  return Array.from({ length: 7 }, (_, column) => {
    const i = column + 1;
    const start = now - (8 - i) * WEEK;
    const end = now - (7 - i) * WEEK;
    const week: LifecycleWeek = { start, end, new: 0, back: 0, kept: 0, lost: 0, active: 0, previous: 0 };
    for (const m of valid) {
      const active = m.weeks_8[i];
      const previous = m.weeks_8[i - 1];
      if (previous) week.previous++;
      if (active) {
        week.active++;
        const joined = Date.parse(m.created_at);
        if (joined > start && joined <= end) week.new++;
        else if (previous) week.kept++;
        else week.back++;
      } else if (previous) week.lost++;
    }
    return week;
  });
}
export function lifecycleSummary(week: LifecycleWeek) {
  return {
    keptPercent: week.previous ? `${Math.round(week.kept / week.previous * 100)}%` : '—',
    keptCaption: `${week.kept} of ${week.previous}`,
    lostCaption: week.lost ? `${((week.new + week.back) / week.lost).toFixed(1)} in per 1 out` : 'none lost',
  };
}
export function toConnect(m: MembersOverviewMember, proIds: ReadonlySet<string>, now: number): boolean {
  const joined = Date.parse(m.created_at);
  const seen = m.last_seen_at ? Date.parse(m.last_seen_at) : NaN;
  return !m.connected && !proIds.has(m.user_id) && joined <= now - 2 * DAY && seen >= now - 14 * DAY && seen <= now;
}
export function memberActivity(m: MembersOverviewMember, now: number): { active: number; eligible: number } {
  const joined = Date.parse(m.created_at);
  let active = 0;
  let eligible = 0;
  if (!validWeeks(m)) return { active, eligible };
  m.weeks_8.forEach((on, i) => {
    if (now - (7 - i) * WEEK > joined) { eligible++; if (on) active++; }
  });
  return { active, eligible };
}
export function resolveMemberSort(raw: string | null): MemberSort {
  return raw === 'joined' || raw === 'index' || raw === 'rounds' ? raw : 'seen';
}
export function sortMembers(members: readonly MembersOverviewMember[], sort: MemberSort, _now: number): MembersOverviewMember[] {
  const time = (iso: string | null) => { const n = iso ? Date.parse(iso) : NaN; return Number.isFinite(n) ? n : -Infinity; };
  const seen = (a: MembersOverviewMember, b: MembersOverviewMember) => a.last_seen_at === b.last_seen_at ? 0 : time(b.last_seen_at) - time(a.last_seen_at) || 0;
  return [...members].sort((a, b) => {
    if (sort === 'joined') return time(b.created_at) - time(a.created_at) || seen(a, b);
    if (sort === 'rounds') return b.rounds_total - a.rounds_total || seen(a, b);
    if (sort === 'index') {
      const ai = a.connected && a.index != null && Number.isFinite(a.index) ? a.index : Infinity;
      const bi = b.connected && b.index != null && Number.isFinite(b.index) ? b.index : Infinity;
      return ai - bi || seen(a, b);
    }
    return seen(a, b);
  });
}
const ROLE_LABEL: Record<string, string> = { full: 'Full', limited: 'Limited', moderator: 'Moderator' };
export function memberTags(m: MembersOverviewMember, pro?: ProMember, chip?: string | null): { label: string; tone: 'role' | 'good' | 'bad' | 'faint' }[] {
  const tags: { label: string; tone: 'role' | 'good' | 'bad' | 'faint' }[] = [];
  if (m.admin_role && ROLE_LABEL[m.admin_role]) tags.push({ label: ROLE_LABEL[m.admin_role], tone: 'role' });
  if (m.is_new && chip !== 'new_this_week') tags.push({ label: 'New', tone: 'good' });
  if (m.is_quiet && chip !== 'quiet') tags.push({ label: 'Quiet', tone: 'bad' });
  if (m.is_suspended) tags.push({ label: 'Suspended', tone: 'bad' });
  if (!m.connected && !pro && chip !== 'no_handicap' && chip !== 'to_connect') tags.push({ label: 'No hcp', tone: 'faint' });
  return tags.slice(0, 2);
}

export function memberSubline(m: MembersOverviewMember, pro: ProMember | undefined, chip: string | null | undefined, now: number): string {
  if (pro) return [m.home_club, pro.pro_kind === 'tour_pro' ? pro.pro_tour : 'Teaching pro'].filter(Boolean).join(' · ');
  if (chip === 'to_connect') {
    const { active, eligible } = memberActivity(m, now);
    return `joined ${formatAgo(m.created_at, { suffix: true, now })} · active ${active} of ${eligible} wk${eligible === 1 ? '' : 's'}`;
  }
  const handle = m.username ? `@${m.username}` : '—';
  if (m.is_quiet) return `was weekly · silent since ${londonDate(m.last_seen_at, { day: 'numeric', month: 'short' })}`;
  if (m.is_new) return `${m.home_club || 'no club'} · joined ${formatAgo(m.created_at, { suffix: true })}`;
  if (!m.home_club && m.rounds_total === 0) return `${handle} · no club`;
  return `${m.home_club || handle} · ${m.rounds_total} rds`;
}

export function lastSeenColor(m: MembersOverviewMember, now: number): string {
  if (!m.last_seen_at) return CC3.faint;
  const age = now - new Date(m.last_seen_at).getTime();
  if (age < DAY) return CC3.good;
  if (m.is_quiet) return CC3.bad;
  if (age <= 7 * DAY) return CC3.ink;
  return CC3.faint;
}

