import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { MembersOverview, MembersOverviewMember } from '@/features/admin/hooks/useMembersRadar';
import type { AdminVerified } from '@/features/admin/hooks/useAdminVerified';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ verified: undefined as AdminVerified | undefined, pending: false, failed: false }));
vi.mock('@/features/admin/hooks/useAdminVerified', async orig => ({ ...(await orig<Record<string, unknown>>()), useAdminVerified: () => ({ data: h.verified, isPending: h.pending, isError: h.failed }) }));
vi.mock('@/features/admin/hooks/useUsers', () => ({ useEgIssueUserIds: () => ({ data: [] }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: () => ({ members: new Map() }) }));
vi.mock('@/features/amateur-ranking/useAmateurMembers', () => ({ useAmateurMembers: () => ({ members: new Map() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: async () => ({ data: null, error: null }),
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }), in: async () => ({ data: [], error: null }) }) }),
  functions: { invoke: async () => ({ data: null, error: null }) },
} }));

import MembersList, { memberSubline, memberTags, lastSeenColor, resolveListFilter } from '@/features/admin/components/MembersList';
import { completeMembership, membersLifecycle, lifecycleSummary, memberActivity, toConnect, sortMembers } from '@/features/admin/lib/membersLifecycle';

const NOW = Date.parse('2026-11-21T12:00:00Z');
const DAY = 86_400_000;
const iso = (days: number) => new Date(NOW - days * DAY).toISOString();
const member = (p: Partial<MembersOverviewMember> = {}): MembersOverviewMember => ({
  user_id: 'member', display_name: 'Member', username: 'member', photo_url: null, home_club: null,
  index: null, connected: false, rounds_total: 0, created_at: iso(100), last_seen_at: iso(1),
  admin_role: null, is_new: false, is_quiet: false, is_suspended: false, is_verified: false, email: null,
  weeks_8: Array(8).fill(false), ...p,
});
const overview = (members: MembersOverviewMember[], total = members.length): MembersOverview => ({
  total, members, recency: { d1: 0, d7: members.length, d14: 0, d30: 0, older: 0 },
  connected: members.filter(m => m.connected).length, no_handicap: members.filter(m => !m.connected).length,
  new_7d: members.filter(m => m.is_new).length, quiet: members.filter(m => m.is_quiet).length,
  team: [], invites: [], computed_at: new Date(NOW).toISOString(),
});
const lifecycleFixture = () => [
  member({ user_id: 'kept', weeks_8: Array(8).fill(true) }),
  member({ user_id: 'back', weeks_8: [false, true, false, true, false, true, false, true] }),
  member({ user_id: 'lost', weeks_8: [true, false, true, false, true, false, true, false] }),
  member({ user_id: 'new', created_at: iso(3), weeks_8: [false, false, false, false, false, false, false, true] }),
];
const sortedFixture = () => [
  member({ user_id: 'a', display_name: 'A', created_at: iso(50), last_seen_at: iso(1), connected: true, index: 5, rounds_total: 10 }),
  member({ user_id: 'b', display_name: 'B', created_at: iso(3), last_seen_at: iso(2), connected: true, index: 2, rounds_total: 20 }),
  member({ user_id: 'c', display_name: 'C', created_at: iso(1), last_seen_at: null, index: -9, rounds_total: 0 }),
  member({ user_id: 'd', display_name: 'D', created_at: iso(10), last_seen_at: iso(1 / 24), connected: true, index: null, rounds_total: 20 }),
];
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function mount(o: MembersOverview | undefined, url = '/admin-v2/users', loading = false) {
  return render(<MemoryRouter initialEntries={[url]}><MembersList overview={o} loading={loading} onOpenMember={vi.fn()} /><Location /></MemoryRouter>);
}
const rowIds = (container: HTMLElement) => [...container.querySelectorAll('[data-member-id]')].map(x => x.getAttribute('data-member-id'));
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  h.verified = { pros: [], pending: [], golfers: [], businesses: [] }; h.pending = false; h.failed = false;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Members v3 lifecycle', () => {
  it('classifies known weekly new back kept lost and conserves both active sets', () => {
    const weeks = membersLifecycle(lifecycleFixture(), NOW);
    expect(weeks).toHaveLength(7);
    weeks.forEach((w, i) => {
      expect(w).toMatchObject({ new: i === 6 ? 1 : 0, back: 1, kept: 1, lost: 1, active: i === 6 ? 3 : 2, previous: 2 });
      expect(w.active).toBe(w.new + w.back + w.kept);
      expect(w.kept + w.lost).toBe(w.previous);
    });
  });
  it('kept percentage and in-per-out ratio use the latest previous active denominator', () => {
    const latest = membersLifecycle(lifecycleFixture(), NOW)[6];
    expect(lifecycleSummary(latest)).toEqual({ keptPercent: '50%', keptCaption: '1 of 2', lostCaption: '2.0 in per 1 out' });
  });
  it('no losses reports none lost and no previous active members reports an em dash', () => {
    const latest = membersLifecycle([member({ created_at: iso(3), weeks_8: [false, false, false, false, false, false, false, true] })], NOW)[6];
    expect(lifecycleSummary(latest)).toEqual({ keptPercent: '—', keptCaption: '0 of 0', lostCaption: 'none lost' });
  });
  it('new membership uses exclusive start and inclusive end bucket boundaries', () => {
    const atStart = member({ created_at: iso(7), weeks_8: [false, false, false, false, false, false, false, true] });
    const atEnd = member({ user_id: 'end', created_at: iso(0), weeks_8: atStart.weeks_8 });
    expect(membersLifecycle([atStart, atEnd], NOW)[6]).toMatchObject({ new: 1, back: 1, active: 2 });
  });
  it('skips activity arrays not exactly eight booleans', () => {
    const invalid = [member({ weeks_8: [true] }), member({ weeks_8: Array(9).fill(true) }), member({ weeks_8: [true, true, true, true, true, true, true, 1] as unknown as boolean[] })];
    expect(membersLifecycle(invalid, NOW).map(w => w.active)).toEqual(Array(7).fill(0));
  });
  it('empty membership gives seven zero weeks without throwing', () => {
    expect(membersLifecycle([], NOW).map(({ new: n, back, kept, lost, active, previous }) => [n, back, kept, lost, active, previous])).toEqual(Array.from({ length: 7 }, () => [0, 0, 0, 0, 0, 0]));
  });
  it('incomplete membership suppresses lifecycle active and to-connect figures', () => {
    const o = overview(lifecycleFixture(), 20);
    expect(completeMembership(o)).toBe(false);
    const v = mount(o);
    const lifecycle = screen.getByRole('region', { name: 'Lifecycle' });
    expect([...lifecycle.querySelectorAll('[data-figure]')].map(x => x.textContent)).toEqual(['—', '—', '—', '—']);
    expect(lifecycle.querySelectorAll('[title]')).toHaveLength(0);
    expect(within(lifecycle).getAllByText('incomplete data')).toHaveLength(4);
    expect(v.container.querySelector('[data-stat="Active 7d"] [data-figure]')).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: 'To connect —' })).toBeInTheDocument();
  });
  it('complete membership renders latest active figures and delta through tone markers', () => {
    const v = mount(overview(lifecycleFixture()));
    const active = v.container.querySelector('[data-stat="Active 7d"]');
    expect(active?.querySelector('[data-figure]')).toHaveTextContent('3');
    expect(active?.querySelector('[data-tone="mu"]')).toHaveTextContent('+1');
    expect(v.container.querySelector('[data-stat="Lost"] [data-figure]')).toHaveAttribute('data-tone', 'bad');
  });
  it('loading lifecycle keeps em dashes without partial bar titles', () => {
    mount(undefined, '/admin-v2/users', true);
    const panel = screen.getByRole('region', { name: 'Lifecycle' });
    expect([...panel.querySelectorAll('[data-figure]')].map(x => x.textContent)).toEqual(['—', '—', '—', '—']);
    expect(panel.querySelectorAll('[title]')).toHaveLength(0);
  });
});

describe('Members v3 to-connect eligibility', () => {
  it('includes unconnected non-pro members at the two-day and fourteen-day boundaries', () => {
    expect(toConnect(member({ created_at: iso(2), last_seen_at: iso(14) }), new Set(), NOW)).toBe(true);
  });
  it('excludes connected members', () => { expect(toConnect(member({ connected: true }), new Set(), NOW)).toBe(false); });
  it('excludes verified pros', () => { expect(toConnect(member(), new Set(['member']), NOW)).toBe(false); });
  it('excludes members joined under two days ago', () => { expect(toConnect(member({ created_at: iso(1.99) }), new Set(), NOW)).toBe(false); });
  it('excludes members last seen over fourteen days ago', () => { expect(toConnect(member({ last_seen_at: iso(14.01) }), new Set(), NOW)).toBe(false); });
  it('excludes never-seen members', () => { expect(toConnect(member({ last_seen_at: null }), new Set(), NOW)).toBe(false); });
  it('keeps the to-connect count absent until the verified payload settles', () => {
    h.pending = true;
    mount(overview([member()]));
    expect(screen.getByRole('button', { name: 'To connect —' })).toBeInTheDocument();
  });
  it('a failed verified read never publishes a stale to-connect count', () => {
    h.failed = true;
    mount(overview([member()]));
    expect(screen.getByRole('button', { name: 'To connect —' })).toBeInTheDocument();
  });
});

describe('Members v3 ordering and filters', () => {
  it.each([
    ['seen', ['d', 'a', 'b', 'c']], ['joined', ['c', 'b', 'd', 'a']],
    ['index', ['b', 'a', 'd', 'c']], ['rounds', ['d', 'b', 'a', 'c']],
  ] as const)('%s sorts the whole membership before paging', (sort, ids) => {
    const original = sortedFixture();
    expect(sortMembers(original, sort, NOW).map(x => x.user_id)).toEqual(ids);
    expect(original.map(x => x.user_id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('the sort URL drives row order and retains linked filter intent', () => {
    const v = mount(overview(sortedFixture()), '/admin-v2/users?sort=joined&filter=admin');
    expect(rowIds(v.container)).toEqual([]);
    expect(screen.getByText('newest first')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rounds' }));
    expect(screen.getByTestId('location')).toHaveTextContent('?sort=rounds&filter=admin');
    expect(screen.getByText('most first')).toBeInTheDocument();
  });
  it('a joined sort URL actually renders newest members first', () => {
    const v = mount(overview(sortedFixture()), '/admin-v2/users?sort=joined');
    expect(rowIds(v.container)).toEqual(['c', 'b', 'd', 'a']);
  });
  it('sorting precedes the existing twenty-five-row paging', () => {
    const members = Array.from({ length: 26 }, (_, i) => member({ user_id: String(i), display_name: `Member ${i}`, rounds_total: i }));
    const v = mount(overview(members), '/admin-v2/users?sort=rounds');
    expect(rowIds(v.container)).toEqual(Array.from({ length: 25 }, (_, i) => String(25 - i)));
    fireEvent.click(screen.getByRole('button', { name: '1 more' }));
    expect(rowIds(v.container)).toHaveLength(26);
  });
  it('chip order is All Verified Connected To connect No handicap Quiet New and wraps', () => {
    const v = mount(overview([]));
    const chips = v.container.querySelector('[data-member-chips]');
    expect([...chips?.querySelectorAll('button') ?? []].map(x => x.textContent?.trim())).toEqual(['All 0', 'Verified 0', 'Connected 0', 'To connect 0', 'No handicap 0', 'Quiet 0', 'New 0']);
    expect((chips as HTMLElement).style.flexWrap).toBe('wrap');
    expect(resolveListFilter('to_connect')).toEqual({ chip: 'to_connect', linked: null });
  });
  it('tapping an active chip returns to All without removing the sort', () => {
    mount(overview([member({ is_quiet: true })]), '/admin-v2/users?filter=quiet&sort=joined');
    fireEvent.click(screen.getByRole('button', { name: 'Quiet 1' }));
    expect(screen.getByTestId('location')).toHaveTextContent('?sort=joined');
    expect(screen.getByRole('button', { name: 'All 1' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('typing on Verified switches to All and preserves the search', () => {
    mount(overview([member()]), '/admin-v2/users?filter=verified');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search members' }), { target: { value: 'Member' } });
    expect(screen.getByRole('button', { name: 'All 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('searchbox')).toHaveValue('Member');
  });
});

describe('Members v3 row display rules', () => {
  it.each([
    ['new_this_week', { is_new: true }, 'New'], ['quiet', { is_quiet: true }, 'Quiet'],
    ['no_handicap', {}, 'No hcp'], ['to_connect', {}, 'No hcp'],
  ] as const)('%s drops its own tag before the two-tag limit', (chip, flags, omitted) => {
    const tags = memberTags(member({ admin_role: 'full', ...flags }), undefined, chip);
    expect(tags.map(x => x.label)).not.toContain(omitted);
    expect(tags[0]).toEqual({ label: 'Full', tone: 'role' });
  });
  it('dropping New happens before limiting tags so Quiet remains visible', () => {
    expect(memberTags(member({ admin_role: 'full', is_new: true, is_quiet: true }), undefined, 'new_this_week').map(x => x.label)).toEqual(['Full', 'Quiet']);
  });
  it('to-connect activity ignores all pre-join buckets', () => {
    const m = member({ created_at: iso(10), weeks_8: Array(8).fill(true) });
    expect(memberActivity(m, NOW)).toEqual({ active: 2, eligible: 2 });
    expect(memberSubline(m, undefined, 'to_connect', NOW)).toBe('joined 10 d ago · active 2 of 2 wks');
  });
  it('to-connect activity uses singular wk for one eligible bucket', () => {
    const m = member({ created_at: iso(3), weeks_8: Array(8).fill(true) });
    expect(memberSubline(m, undefined, 'to_connect', NOW)).toBe('joined 3 d ago · active 1 of 1 wk');
  });
  it('to-connect pros retain their canonical pro subline', () => {
    expect(memberSubline(member({ home_club: 'Club' }), { user_id: 'member', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: null, pro_club: null, pro_player_id: null }, 'to_connect', NOW)).toBe('Club · Alps Tour');
  });
  it('negative indexes render a true minus and quiet rows carry the bad tone marker', () => {
    const v = mount(overview([member({ connected: true, index: -2.7, is_quiet: true, last_seen_at: iso(10) })]));
    const row = v.container.querySelector('[data-member-id]');
    expect(row).toHaveTextContent('−2.7');
    expect(row?.querySelector('[data-tone="bad"]')).toBeInTheDocument();
    expect(row?.querySelectorAll('[data-tone="bad"]')).toHaveLength(2);
    expect(lastSeenColor(member({ last_seen_at: iso(3) }), NOW)).toBe('var(--cc3-ink)');
  });
});

describe('Members v3 source restrictions', () => {
  it('scoped presentation contains no forbidden colour weight size or truncation patterns', () => {
    const read = (path: string) => readFileSync(`src/features/admin/${path}`, 'utf8');
    const ranking = read('components/AdminProWorldRanking.tsx');
    const users = read('pages/UsersPage.tsx');
    const sources = [read('components/MembersList.tsx'), read('components/AdminVerifiedCard.tsx'), read('components/adminVerified.css'), ranking.slice(ranking.indexOf("if (variant === 'v3')"), ranking.indexOf('  return <section aria-label="World ranking"')), users.slice(users.indexOf('const TEAM_ROW:'), users.indexOf('function MenuItem('))];
    for (const source of sources) {
      expect(source.match(/fontWeight\s*:\s*(?:[89]\d\d|[1-9]\d{3,})|font-weight\s*:\s*(?:[89]\d\d|[1-9]\d{3,})/g) ?? []).toEqual([]);
      expect(source.match(/fontSize\s*:\s*(?:[0-9](?:\.\d+)?)\b(?!\d)|font-size\s*:\s*(?:[0-9](?:\.\d+)?)px/g) ?? []).toEqual([]);
      expect(source.match(/\bt\.(?:warn|warnText|warnSoft|brand|brandText|brandSoft)\b|--admin-verified-warn|#F7931E|#F2C14E/gi) ?? []).toEqual([]);
      expect(source.match(/textOverflow|text-overflow\s*:\s*ellipsis/g) ?? []).toEqual([]);
    }
  });
});