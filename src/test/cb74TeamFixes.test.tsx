import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), invoke: vi.fn(), from: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(),
  session: { session: { user: { id: 'owner' } } as { user: { id: string } } | null, loading: false },
  membershipResult: Promise.resolve({ data: { role: 'owner' } as { role: string } | null, error: null }),
  membershipRead: vi.fn(),
  routeChanges: [] as string[], formCommits: [] as boolean[],
  invites: [] as Array<Record<string, unknown>>,
  mutate: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, functions: { invoke: mocks.invoke }, from: mocks.from } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: mocks.info } }));
vi.mock('@/lib/logger', () => ({ AppLog: { debug: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/i18n/format', () => ({ formatRelativeAgoLong: () => '1 day ago' }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { name: 'clbhouz' } }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ ...mocks.session, user: mocks.session.session?.user ?? null }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/components/manage/ManagePageShell', () => ({ ManagePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/hooks/useBusinessTeam', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useBusinessTeam')>();
  const mutation = () => ({ mutate: mocks.mutate, mutateAsync: mocks.mutate, isPending: false });
  return { ...actual, useBusinessTeam: () => ({ data: [], isLoading: false, isError: false }),
    useBusinessInvites: () => ({ data: mocks.invites }), useRemoveMember: mutation,
    useUpdateMemberRole: mutation, useRevokeInvite: mutation, useSetMemberVisibility: mutation,
    useSetMemberJobTitle: mutation, useCreateInvite: mutation, useCreateInviteByUser: mutation };
});

import { AccessRequestsSection, getRoleLabel } from '@/components/business/AccessRequestsSection';
import BusinessTeamPage from '@/pages/BusinessTeamPage';
import BusinessInvitePage from '@/pages/BusinessInvitePage';

const request = { id: 'request-1', business_id: 'biz', requester_user_profile_id: 'sam', requested_role: 'team_member', message: null, status: 'pending', created_at: '2026-10-23T10:00:00Z' };
function RouteState() {
  const location = useLocation();
  const navigation = useNavigationType();
  React.useEffect(() => { mocks.routeChanges.push(`${location.pathname}:${navigation}`); }, [location.pathname, navigation]);
  return <output data-testid="route-state">{location.pathname}:{navigation}</output>;
}
function mount(kind: 'requests' | 'team' | 'invite') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const tree = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={[`/business/biz/team${kind === 'invite' ? '/invite' : ''}`]}>
    <RouteState />
    <Routes>
      <Route path="/business/:businessId/team" element={kind === 'requests' ? <AccessRequestsSection businessId="biz" businessName="clbhouz" canManage /> : kind === 'team' ? <BusinessTeamPage /> : <div data-testid="team-destination" />} />
      <Route path="/business/:businessId/team/invite" element={<React.Profiler id="invite" onRender={() => mocks.formCommits.push(!!document.querySelector('input[type="text"]'))}><BusinessInvitePage /></React.Profiler>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>;
  const view = render(tree());
  return { client, invalidate, refresh: () => view.rerender(tree()) };
}
async function decide(action: 'Approve' | 'Decline') {
  const entry = await waitFor(() => {
    const button = document.querySelector(`[data-request-action="${action.toLowerCase()}"]`);
    expect(button).toBeTruthy();
    return button;
  });
  if (!entry) throw new Error('Missing request action');
  fireEvent.click(entry);
  const confirm = screen.getByRole('dialog').querySelector('[data-team-confirm]');
  if (!confirm) throw new Error('Missing decision confirmation');
  fireEvent.click(confirm);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session = { session: { user: { id: 'owner' } }, loading: false };
  mocks.membershipResult = Promise.resolve({ data: { role: 'owner' }, error: null });
  mocks.routeChanges = []; mocks.formCommits = [];
  mocks.invites = [];
  mocks.rpc.mockResolvedValue({ data: { success: true, status: 'approved', role: 'admin' }, error: null });
  mocks.from.mockImplementation((table: string) => {
    if (table === 'business_members') {
      const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: mocks.membershipRead };
      chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
      mocks.membershipRead.mockImplementation(() => mocks.membershipResult);
      return chain;
    }
    if (table === 'business_access_requests') {
      const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: [request], error: null }) };
      chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); return chain;
    }
    return { select: () => ({ in: () => Promise.resolve({ data: [{ id: 'sam', display_name: 'Sam', username: 'sam', profile_photo_url: null }], error: null }) }) };
  });
});
afterEach(() => cleanup());

describe('CB74 authoritative access decisions', () => {
  it.each([['Approve', 'approve'], ['Decline', 'decline']] as const)('%s uses the RPC arguments and never invokes the edge function', async (action, decision) => {
    const { invalidate } = mount('requests');
    await decide(action);
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(mocks.rpc).toHaveBeenCalledWith('decide_business_access_request', { p_request_id: 'request-1', p_decision: decision, p_role: decision === 'approve' ? 'editor' : null });
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it.each(['Approve', 'Decline'] as const)('%s refusal shows the server message and never invalidates success queries', async (action) => {
    mocks.rpc.mockResolvedValue({ data: { success: false, error: 'Only managers can decide this request' }, error: null });
    const { invalidate } = mount('requests');
    await decide(action);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Only managers can decide this request'));
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled(); expect(mocks.info).not.toHaveBeenCalled();
  });
  it.each(['Approve', 'Decline'] as const)('%s transport error skips every success invalidation', async (action) => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('Connection failed') });
    const { invalidate } = mount('requests');
    await decide(action);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Connection failed'));
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('successful approval preserves all invalidations and adds team and invites', async () => {
    const { invalidate } = mount('requests');
    await decide('Approve');
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(12));
    for (const key of ['business-access-requests', 'business-team-members', 'business-team', 'business-invites', 'business-pending-requests-count', 'business-members', 'business-membership', 'business-team-feed']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key, 'biz'] });
    }
    for (const key of ['activity-feed', 'activity-unread-count', 'notifications', 'unread-notifications-count']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });
  it('already resolved retains the existing status toast', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: true, already_resolved: true, status: 'declined' }, error: null });
    const { invalidate } = mount('requests');
    await decide('Decline');
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(7));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['business-team-feed', 'biz'] });
    expect(mocks.info).toHaveBeenCalledTimes(1);
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it.each([['manager', 'Admin'], ['team_member', 'Editor'], ['analyst', 'Analyst'], ['admin', 'Admin']])('requested %s is granted %s', (role, label) => {
    expect(getRoleLabel(role)).toBe(label);
  });
});

describe('CB74 elapsed pending invite rows', () => {
  it.each([[-1, 'expired'], [1, 'live']] as const)('an invite expiring %s day from now retains its row in the CB77 invites card', async (offset, state) => {
    mocks.invites = [{ id: 'invite-1', status: 'pending', role: 'admin', created_at: new Date(Date.now() - 86400000).toISOString(), expires_at: new Date(Date.now() + offset * 86400000).toISOString(), invitee_email: 'invitee@example.test', invitee_user_id: null }];
    mount('team');
    const row = await waitFor(() => { const r = document.querySelector('[data-invite-row="invite-1"]'); expect(r).toBeTruthy(); return r as HTMLElement; });
    expect(row.querySelector(`[data-invite-when="${state}"]`)).toBeTruthy();
    expect(row.querySelector('[data-invite-resend]')).toBeTruthy();
    fireEvent.click(row.querySelector('[data-invite-more]') as HTMLElement);
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-invite-item="cancel"]')).toBeTruthy();
    expect(!!dialog.querySelector('[data-invite-item="copy"]')).toBe(state === 'live');
  });
});

describe('CB74 invite membership guard', () => {
  it.each(['editor', 'analyst', 'non-member'])('%s redirects with replace and never renders the form', async (role) => {
    mocks.membershipResult = Promise.resolve({ data: role === 'non-member' ? null : { role }, error: null });
    mount('invite');
    await screen.findByTestId('team-destination');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Choose someone to invite' })).toBeNull();
    expect(screen.getByTestId('team-destination')).toBeTruthy();
    expect(screen.getByTestId('route-state').textContent).toBe('/business/biz/team:REPLACE');
    await waitFor(() => expect(mocks.routeChanges.filter(value => value === '/business/biz/team:REPLACE')).toHaveLength(1));
    expect(mocks.formCommits).not.toContain(true);
  });
  it.each(['owner', 'admin'])('%s waits for session and membership before seeing the form without any redirect', async (role) => {
    mocks.session = { session: null, loading: true };
    let resolveMembership: (result: { data: { role: string } | null; error: null }) => void = () => {};
    mocks.membershipResult = new Promise(resolve => { resolveMembership = resolve; });
    const { refresh } = mount('invite');
    expect(document.querySelector('.page-with-header')).toBeTruthy();
    expect(mocks.membershipRead).not.toHaveBeenCalled();
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
    mocks.session = { session: { user: { id: 'owner' } }, loading: false };
    refresh();
    await waitFor(() => expect(mocks.membershipRead).toHaveBeenCalledTimes(1));
    expect(document.querySelector('.page-with-header')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
    await act(async () => { resolveMembership({ data: { role }, error: null }); });
    expect(await screen.findByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose someone to invite' })).toBeTruthy();
    expect(screen.queryByTestId('team-destination')).toBeNull();
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
  });
  it('resolving session shows the existing page skeleton, not the form or a redirect', () => {
    mocks.session = { session: null, loading: true };
    mount('invite');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('team-destination')).toBeNull();
    expect(screen.getByTestId('route-state').textContent).toBe('/business/biz/team/invite:POP');
    expect(document.querySelector('.page-with-header')).toBeTruthy();
    expect(mocks.membershipRead).not.toHaveBeenCalled();
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
  });
  it('session resolves to editor before membership denial redirects exactly once with no form commit', async () => {
    mocks.session = { session: null, loading: true };
    let resolveMembership: (result: { data: { role: string } | null; error: null }) => void = () => {};
    mocks.membershipResult = new Promise(resolve => { resolveMembership = resolve; });
    const { refresh } = mount('invite');
    mocks.session = { session: { user: { id: 'editor-user' } }, loading: false };
    refresh();
    await waitFor(() => expect(mocks.membershipRead).toHaveBeenCalledTimes(1));
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
    await act(async () => { resolveMembership({ data: { role: 'editor' }, error: null }); });
    await screen.findByTestId('team-destination');
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP', '/business/biz/team:REPLACE']);
    expect(mocks.formCommits).not.toContain(true);
  });
  it('session settles signed out and redirects once without rendering the form', async () => {
    mocks.session = { session: null, loading: true };
    const { refresh } = mount('invite');
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP']);
    mocks.session = { session: null, loading: false };
    refresh();
    await screen.findByTestId('team-destination');
    expect(mocks.routeChanges).toEqual(['/business/biz/team/invite:POP', '/business/biz/team:REPLACE']);
    expect(mocks.membershipRead).not.toHaveBeenCalled();
    expect(mocks.formCommits).not.toContain(true);
  });
});