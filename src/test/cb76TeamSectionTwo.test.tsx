import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/common.json';
import { TeamListSection } from '@/components/business/TeamListSection';
import { activityLine, activityWhen, memberMenu, sortTeam, type TeamActivity } from '@/components/business/teamList';
import type { BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(), activity: [] as unknown[], viewerRole: 'owner' as string }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: mocks.info } }));

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { common: en } }, defaultNS: 'common', interpolation: { escapeValue: false } });
const NOW = new Date(2026, 9, 24, 12);
const daysAgo = (n: number) => new Date(2026, 9, 24 - n, 10).toISOString();
const m = (id: string, role: BusinessRole, extra: Partial<BusinessMember> = {}): BusinessMember => ({ id, user_profile_id: id, role, created_at: daysAgo(100), is_public: true, job_title: null, user_profile: { id, display_name: `${id[0].toUpperCase()}${id.slice(1)} Smith`, username: id, profile_photo_url: null }, ...extra });
const act = (user_id: string, posts: number, replies: number, last: string | null): TeamActivity => ({ user_id, posts_30d: posts, replies_30d: replies, last_active_at: last });

function Route2() { const l = useLocation(); const n = useNavigationType(); return <output data-testid="route">{l.pathname}:{n}</output>; }
function Harness({ team, viewerId }: { team: BusinessMember[]; viewerId: string }) {
  const membership = useQuery({ queryKey: ['business-membership', 'biz', viewerId], queryFn: async () => ({ role: mocks.viewerRole as BusinessRole }) });
  return <TeamListSection businessId="biz" businessName="Royal Example Golf Club" team={team} viewerRole={membership.data?.role} viewerId={viewerId} loading={false} failed={false} onRetry={() => {}} />;
}
function mount(team: BusinessMember[], viewerId = 'olivia') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={['/business/biz/team']}>
    <Routes><Route path="/business/biz/team" element={<Harness team={team} viewerId={viewerId} />} /><Route path="*" element={<Route2 />} /></Routes>
  </MemoryRouter></QueryClientProvider></I18nextProvider>);
}
const row = (id: string) => document.querySelector(`[data-member-row="${id}"]`) as HTMLElement;
const openMenu = async (id: string) => { const b = await waitFor(() => { const x = row(id).querySelector('[data-team-more]'); expect(x).toBeTruthy(); return x as HTMLElement; }); fireEvent.click(b); return screen.getByRole('dialog'); };
const items = (dialog: HTMLElement) => [...dialog.querySelectorAll('[data-menu-item]')].map(e => e.getAttribute('data-menu-item'));

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW);
  mocks.viewerRole = 'owner'; mocks.activity = [];
  mocks.rpc.mockImplementation(async (fn: string) => fn === 'get_business_team_activity' ? { data: mocks.activity, error: null } : { data: { success: true }, error: null });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const team = [m('ed', 'editor', { created_at: daysAgo(10) }), m('ana', 'analyst'), m('adam', 'admin'), m('olivia', 'owner'), m('eve', 'editor', { created_at: daysAgo(50) })];

describe('CB76 rules', () => {
  it('sorts owner, admin, editor, analyst; same role by created_at', () => expect(sortTeam(team).map(x => x.id)).toEqual(['olivia', 'adam', 'eve', 'ed', 'ana']));
  it.each([[0, 'today'], [1, 'yesterday'], [7, 'lastWeek'], [13, 'lastWeek'], [14, 'weeksAgo']])('%s days is %s', (d, key) => expect(activityWhen(daysAgo(d), NOW).key).toBe(key));
  it('2-6 days give the weekday name', () => expect(activityWhen(daysAgo(3), NOW)).toEqual({ key: 'weekday', day: 'Wednesday' }));
  it('55 days is last active 7 weeks ago', () => expect(activityLine(m('e', 'editor'), act('e', 0, 0, daysAgo(55)), NOW)).toEqual({ kind: 'lastActive', when: { key: 'weeksAgo', count: 7 } }));
  it('56 days is not active in 8 weeks', () => expect(activityLine(m('e', 'editor'), act('e', 0, 0, daysAgo(56)), NOW)).toEqual({ kind: 'inactive', weeks: 8 }));
  it('owner never gets review access', () => expect(activityLine(m('o', 'owner'), act('o', 0, 0, daysAgo(90)), NOW)?.kind).toBe('lastActive'));
  it('analysts get no line', () => expect(activityLine(m('a', 'analyst'), act('a', 5, 0, daysAgo(0)), NOW)).toBeNull());
  it('null last active with no counts is never posted', () => expect(activityLine(m('e', 'editor'), act('e', 0, 0, null), NOW)?.kind).toBe('neverPosted'));
  const all = ['role', 'jobTitle', 'visibility', 'makeOwner', 'remove'];
  it.each([
    ['owner', 'adam', all], ['owner', 'ed', all], ['admin', 'eve', ['role', 'jobTitle', 'visibility', 'remove']], ['admin', 'olivia', []],
    ['editor', 'adam', []], ['analyst', 'ed', []],
  ] as const)('%s viewing %s', (viewer, target, expected) => expect(memberMenu(viewer, viewer === 'owner' ? 'olivia' : viewer === 'admin' ? 'adam' : 'x', team.find(x => x.id === target)!, team)).toEqual(expected));
  it('self gets job title, visibility and leave', () => expect(memberMenu('editor', 'ed', team[0], team)).toEqual(['jobTitle', 'visibility', 'leave']));
  it('the only owner cannot leave', () => expect(memberMenu('owner', 'olivia', team[3], team)).toEqual(['jobTitle', 'visibility']));
});

describe('CB76 rows', () => {
  it('owner badge has no amber; Hidden only when not public', () => {
    mount([m('olivia', 'owner'), m('ed', 'editor', { is_public: false })]);
    const badge = row('olivia').querySelector('[data-role-badge="owner"]') as HTMLElement;
    expect(badge.className).toContain('team-list-role--owner');
    expect(getComputedStyle(badge).color).not.toMatch(/247,\s*147,\s*30|#F7931E/i);
    expect(row('olivia').querySelector('[data-team-hidden]')).toBeNull();
    expect(row('ed').querySelector('[data-team-hidden]')).toBeTruthy();
  });
  it('title beats handle; Add job title link follows the matrix', async () => {
    mocks.viewerRole = 'admin';
    mount([m('olivia', 'owner'), m('adam', 'admin'), m('eve', 'editor', { job_title: 'Head Professional' }), m('ed', 'editor')], 'adam');
    await waitFor(() => expect(row('ed').querySelector('[data-team-add-title]')).toBeTruthy());
    expect(row('eve').querySelector('[data-team-meta]')?.textContent).toBe('Head Professional');
    expect(row('olivia').querySelector('[data-team-add-title]')).toBeNull();
    expect(row('olivia').querySelector('[data-team-more]')).toBeNull();
    expect(row('adam').querySelector('[data-team-add-title]')).toBeTruthy();
  });
  it('editor viewing others sees no link and no menu, but self does', async () => {
    mocks.viewerRole = 'editor';
    mount([m('olivia', 'owner'), m('ed', 'editor'), m('eve', 'editor')], 'ed');
    await waitFor(() => expect(row('ed').querySelector('[data-team-more]')).toBeTruthy());
    expect(row('ed').querySelector('[data-team-add-title]')).toBeTruthy();
    for (const id of ['olivia', 'eve']) { expect(row(id).querySelector('[data-team-more]')).toBeNull(); expect(row(id).querySelector('[data-team-add-title]')).toBeNull(); }
  });
  it('line 3 renders each case once activity settles, with You prefix and singulars', async () => {
    mocks.activity = [act('olivia', 6, 0, daysAgo(0)), act('adam', 1, 1, daysAgo(1)), act('eve', 0, 0, null), act('ed', 0, 0, daysAgo(56)), act('ana', 3, 0, daysAgo(0))];
    mount([m('olivia', 'owner'), m('adam', 'admin'), m('eve', 'editor'), m('ed', 'editor'), m('ana', 'analyst')]);
    expect(document.querySelector('[data-team-activity]')).toBeNull();
    await waitFor(() => expect(row('olivia').querySelector('[data-team-activity]')).toBeTruthy());
    expect(row('olivia').querySelector('[data-team-activity]')?.textContent).toContain('You · 6 posts · active today');
    expect(row('adam').querySelector('[data-team-activity]')?.textContent).toContain('1 post · 1 reply · active yesterday');
    expect(row('eve').querySelector('[data-team-activity]')?.textContent).toContain("Hasn't posted as Royal Example Golf Club yet");
    expect(row('ed').querySelector('[data-team-activity]')?.textContent).toContain('Not active in 8 weeks · Review access');
    expect(row('ana').querySelector('[data-team-activity]')).toBeNull();
    fireEvent.click(row('ed').querySelector('[data-team-review-access]') as HTMLElement);
    expect(screen.getByRole('dialog').querySelector('[data-team-menu]')).toBeTruthy();
  });
  it('failed activity read leaves rows without line 3', async () => {
    mocks.rpc.mockImplementation(async (fn: string) => fn === 'get_business_team_activity' ? { data: null, error: { message: 'denied', code: '42501' } } : { data: { success: true }, error: null });
    mount([m('olivia', 'owner'), m('ed', 'editor')]);
    await waitFor(() => expect(row('ed').querySelector('[data-team-more]')).toBeTruthy());
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-team-activity]')).toBeNull();
    expect(document.querySelectorAll('[data-member-row]')).toHaveLength(2);
  });
});

describe('CB76 menu and sheets', () => {
  it('owner menu lists every owner item; only-owner self has no Leave', async () => {
    mount([m('olivia', 'owner'), m('ed', 'editor')]);
    expect(items(await openMenu('ed'))).toEqual(['role', 'jobTitle', 'visibility', 'makeOwner', 'remove']);
    cleanup(); mount([m('olivia', 'owner'), m('ed', 'editor')]);
    expect(items(await openMenu('olivia'))).toEqual(['jobTitle', 'visibility']);
  });
  it('role sheet preselects and tags current, disabled until changed, sends lowercase role', async () => {
    mount([m('olivia', 'owner'), m('ed', 'editor')]);
    fireEvent.click((await openMenu('ed')).querySelector('[data-menu-item="role"]') as HTMLElement);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: /Editor/ })).toHaveAttribute('aria-checked', 'true');
    expect(dialog.querySelector('[data-current-role="editor"]')).toBeTruthy();
    const confirm = dialog.querySelector('[data-team-list-confirm]') as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole('radio', { name: /Analyst/ }));
    expect(confirm.disabled).toBe(false);
    expect(confirm.textContent).toBe('Make Ed an Analyst');
    fireEvent.click(confirm);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('update_business_member_role', { p_business_id: 'biz', p_member_user_id: 'ed', p_new_role: 'analyst' }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Ed is now an Analyst'));
  });
  it('job title has maxLength 40 and a counter; Remove sends empty', async () => {
    mount([m('olivia', 'owner'), m('ed', 'editor', { job_title: 'Coach' })]);
    fireEvent.click((await openMenu('ed')).querySelector('[data-menu-item="jobTitle"]') as HTMLElement);
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('textbox') as HTMLInputElement;
    expect(input.maxLength).toBe(40);
    expect(dialog.querySelector('[data-team-title-count]')?.textContent).toBe('5/40');
    fireEvent.change(input, { target: { value: 'Head Pro' } });
    expect(dialog.querySelector('[data-team-title-count]')?.textContent).toBe('8/40');
    fireEvent.click(dialog.querySelector('[data-team-title-remove]') as HTMLElement);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('set_member_job_title', { _business_id: 'biz', _member_user_id: 'ed', _job_title: '' }));
  });
  it('toggle sends the flipped value and flips back on error', async () => {
    mocks.rpc.mockImplementation(async (fn: string) => fn === 'set_member_public_visibility' ? { data: null, error: { message: 'Not allowed' } } : { data: mocks.activity, error: null });
    mount([m('olivia', 'owner'), m('ed', 'editor')]);
    const sw = (await openMenu('ed')).querySelector('[data-menu-item="visibility"]') as HTMLElement;
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('set_member_public_visibility', { _business_id: 'biz', _member_user_id: 'ed', _is_public: false }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Not allowed'));
    expect(screen.getByRole('dialog').querySelector('[data-menu-item="visibility"]')).toHaveAttribute('aria-checked', 'true');
  });
  it('make owner transfers, then membership is re-read and controls become an admin\'s', async () => {
    mocks.rpc.mockImplementation(async (fn: string) => {
      if (fn === 'transfer_business_ownership') { mocks.viewerRole = 'admin'; return { data: { success: true }, error: null }; }
      return { data: mocks.activity, error: null };
    });
    const people = [m('olivia', 'owner'), m('ed', 'editor'), m('adam', 'admin')];
    mount(people);
    expect(items(await openMenu('adam'))).toContain('makeOwner');
    fireEvent.click(screen.getByRole('dialog').querySelector('[data-menu-item="makeOwner"]') as HTMLElement);
    fireEvent.click(screen.getByRole('dialog').querySelector('[data-team-list-confirm]') as HTMLElement);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('transfer_business_ownership', { p_business_id: 'biz', p_new_owner_user_id: 'adam' }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Adam is now the owner'));
    // Viewer is now an admin: admin-on-admin menu has no Make owner.
    await waitFor(async () => expect(items(await openMenu('ed'))).toEqual(['role', 'jobTitle', 'visibility', 'remove']));
  });
  it('leave calls remove with own id and navigates with replace', async () => {
    mount([m('olivia', 'owner'), m('ed', 'editor')], 'ed');
    mocks.viewerRole = 'editor';
    fireEvent.click((await openMenu('ed')).querySelector('[data-menu-item="leave"]') as HTMLElement);
    fireEvent.click(screen.getByRole('dialog').querySelector('[data-team-list-confirm]') as HTMLElement);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('remove_business_member', { p_business_id: 'biz', p_member_user_id: 'ed' }));
    await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/businesses/manage:REPLACE'));
  });
  it('success:false toasts the message and keeps the sheet open', async () => {
    mocks.rpc.mockImplementation(async (fn: string) => fn === 'remove_business_member' ? { data: { success: false, error: 'Cannot remove' }, error: null } : { data: mocks.activity, error: null });
    mount([m('olivia', 'owner'), m('ed', 'editor')]);
    fireEvent.click((await openMenu('ed')).querySelector('[data-menu-item="remove"]') as HTMLElement);
    fireEvent.click(screen.getByRole('dialog').querySelector('[data-team-list-confirm]') as HTMLElement);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Cannot remove'));
    expect(screen.getByRole('dialog').querySelector('[data-team-remove-sheet]')).toBeTruthy();
    expect(row('ed')).toBeTruthy();
  });
});
