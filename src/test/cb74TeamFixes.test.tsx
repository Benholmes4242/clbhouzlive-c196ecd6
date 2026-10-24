import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), invoke: vi.fn(), from: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(),
  membership: { data: { role: 'owner', canManage: true } as { role: string; canManage: boolean } | null, isLoading: false },
  invites: [] as Array<Record<string, unknown>>,
  mutate: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, functions: { invoke: mocks.invoke }, from: mocks.from } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: mocks.info } }));
vi.mock('@/lib/logger', () => ({ AppLog: { debug: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/i18n/format', () => ({ formatRelativeAgoLong: () => '1 day ago' }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => mocks.membership }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { name: 'clbhouz' } }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'owner' } }) }));
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

const request = { id: 'request-1', business_id: 'biz', requester_user_profile_id: 'sam', requested_role: 'manager', message: null, status: 'pending', created_at: '2026-10-23T10:00:00Z' };
function RouteState() {
  const location = useLocation();
  const navigation = useNavigationType();
  return <output data-testid="route-state">{location.pathname}:{navigation}</output>;
}
function mount(kind: 'requests' | 'team' | 'invite') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/business/biz/team${kind === 'invite' ? '/invite' : ''}`]}>
    <RouteState />
    <Routes>
      <Route path="/business/:businessId/team" element={kind === 'requests' ? <AccessRequestsSection businessId="biz" businessName="clbhouz" canManage /> : kind === 'team' ? <BusinessTeamPage /> : <div data-testid="team-destination" />} />
      <Route path="/business/:businessId/team/invite" element={<BusinessInvitePage />} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
  return { client, invalidate };
}
async function decide(action: 'Approve' | 'Decline') {
  fireEvent.click(await screen.findByRole('button', { name: action }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: action }));
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.membership = { data: { role: 'owner', canManage: true }, isLoading: false };
  mocks.invites = [];
  mocks.rpc.mockResolvedValue({ data: { success: true, status: 'approved', role: 'admin' }, error: null });
  mocks.from.mockImplementation((table: string) => {
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
    expect(mocks.rpc).toHaveBeenCalledWith('decide_business_access_request', { p_request_id: 'request-1', p_decision: decision, p_role: null });
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
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(11));
    for (const key of ['business-access-requests', 'business-team-members', 'business-team', 'business-invites', 'business-pending-requests-count', 'business-members', 'business-membership']) {
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
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(6));
    expect(mocks.info).toHaveBeenCalledWith('Request already declined');
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it.each([['manager', 'Admin'], ['team_member', 'Editor'], ['analyst', 'Analyst'], ['admin', 'Admin']])('requested %s is granted %s', (role, label) => {
    expect(getRoleLabel(role)).toBe(label);
  });
});

describe('CB74 elapsed pending invite rows', () => {
  it.each([[-1, 'Expired'], [1, 'Pending']] as const)('an invite expiring %s day from now retains its row and revoke action', (offset, status) => {
    mocks.invites = [{ id: 'invite-1', status: 'pending', role: 'admin', expires_at: new Date(Date.now() + offset * 86400000).toISOString(), invitee_email: 'invitee@example.test' }];
    mount('team');
    expect(screen.getByText(`${status} · Admin`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(mocks.mutate).toHaveBeenCalledWith('invite-1');
  });
});

describe('CB74 invite membership guard', () => {
  it.each(['editor', 'analyst', 'non-member'])('%s redirects with replace and never renders the form', (role) => {
    mocks.membership.data = role === 'non-member' ? null : { role, canManage: false };
    mount('invite');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send invite' })).toBeNull();
    expect(screen.getByTestId('team-destination')).toBeTruthy();
    expect(screen.getByTestId('route-state').textContent).toBe('/business/biz/team:REPLACE');
  });
  it.each(['owner', 'admin'])('%s can see the form', (role) => {
    mocks.membership.data = { role, canManage: true };
    mount('invite');
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeTruthy();
    expect(screen.queryByTestId('team-destination')).toBeNull();
  });
  it('loading membership shows the existing page skeleton, not the form or a redirect', () => {
    mocks.membership = { data: null, isLoading: true };
    mount('invite');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('team-destination')).toBeNull();
    expect(screen.getByTestId('route-state').textContent).toBe('/business/biz/team/invite:POP');
    expect(document.querySelector('.page-with-header')).toBeTruthy();
  });
});