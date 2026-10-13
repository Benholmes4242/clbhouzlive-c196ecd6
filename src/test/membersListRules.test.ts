import { describe, expect, it } from 'vitest';
import { memberTags, memberSubline, lastSeenColor, resolveListFilter, weekDashColors } from '@/features/admin/components/MembersList';
import { adminTheme as t } from '@/features/admin/theme';
import { WEEK_PREJOIN, WEEK_OFF } from '@/features/admin/lib/panels';
import type { MembersOverviewMember } from '@/features/admin/hooks/useMembersRadar';

const NOW = Date.parse('2026-10-13T08:00:00Z');
const m = (p: Partial<MembersOverviewMember>): MembersOverviewMember => ({
  user_id: 'u', display_name: 'A B', username: 'ab', photo_url: null, home_club: null, index: 5.5,
  created_at: '2025-01-01T00:00:00Z', last_seen_at: '2026-10-13T07:00:00Z', connected: true, rounds_total: 0,
  admin_role: null, is_new: false, is_quiet: false, is_suspended: false, is_verified: false, email: null,
  weeks_8: [true, true, true, true, true, true, true, true], ...p,
});

describe('Members list rules', () => {
  it('shows at most two tags in brief order', () => {
    expect(memberTags(m({ admin_role: 'full', is_new: true, is_quiet: true, connected: false })).map(x => x.label)).toEqual(['Full', 'New']);
    expect(memberTags(m({ is_suspended: true, connected: false })).map(x => x.label)).toEqual(['Suspended', 'No hcp']);
  });
  it('writes the subline for no club and no rounds as handle and no club', () => {
    expect(memberSubline(m({}))).toBe('@ab · no club');
    expect(memberSubline(m({ home_club: 'Sundridge Park GC', rounds_total: 12 }))).toBe('Sundridge Park GC · 12 rds');
  });
  it('colours last seen green under 24h and amber-warn when quiet', () => {
    expect(lastSeenColor(m({}), NOW)).toBe(t.okText);
    expect(lastSeenColor(m({ is_quiet: true, last_seen_at: '2026-09-18T08:00:00Z' }), NOW)).toBe(t.warnText);
    expect(lastSeenColor(m({ last_seen_at: '2026-09-18T08:00:00Z' }), NOW)).toBe(t.inkFaint);
  });
  it('keeps old ?filter= links working with no chip highlighted', () => {
    expect(resolveListFilter('eg_issues')).toEqual({ chip: null, linked: 'eg_issues' });
    expect(resolveListFilter('quiet')).toEqual({ chip: 'quiet', linked: null });
    expect(resolveListFilter(null)).toEqual({ chip: 'all', linked: null });
  });
  it('marks weeks before joining as pre-join', () => {
    const c = weekDashColors(m({ created_at: '2026-10-11T00:00:00Z', weeks_8: [false, false, false, false, false, false, false, true] }), NOW);
    expect(c.slice(0, 7)).toEqual(Array(7).fill(WEEK_PREJOIN));
    expect(weekDashColors(m({ weeks_8: [false, true, true, true, true, true, true, true] }), NOW)[0]).toBe(WEEK_OFF);
  });
});
