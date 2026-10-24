import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/common.json';
import { TeamSummary } from '@/components/business/TeamSummary';
import { inviteName, requestPlaysHere, requestWhen, summaryInvites, teamAvatarMembers, teamSummaryRule } from '@/components/business/teamSummary';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import type { AccessRequest } from '@/hooks/useBusinessAccessRequests';
import type { BusinessInvite, BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';
import BusinessTeamPage from '@/pages/BusinessTeamPage';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(), role: 'owner' as BusinessRole, requests: [] as AccessRequest[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: mocks.info } }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: mocks.role, canManage: mocks.role === 'owner' || mocks.role === 'admin' } }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { name: 'X', club_id: 'club' } }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessAccessRequests', () => ({ useBusinessAccessRequests: () => ({ data: mocks.requests, isPending: false, isError: false }) }));
vi.mock('@/hooks/useBusinessTeam', async importOriginal => {
  const actual = await importOriginal<typeof import('@/hooks/useBusinessTeam')>();
  const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return { ...actual, useBusinessTeam: () => ({ data: [], isLoading: false, isError: false }), useBusinessInvites: () => ({ data: [], isPending: false, isError: false }), useRemoveMember: mutation, useUpdateMemberRole: mutation, useRevokeInvite: mutation, useSetMemberVisibility: mutation, useSetMemberJobTitle: mutation };
});

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { common: en } }, defaultNS: 'common', interpolation: { escapeValue: false } });
const now = new Date('2026-10-24T12:00:00Z');
const member = (id: string, role: BusinessRole = 'editor'): BusinessMember => ({ id, user_profile_id: id, role, created_at: now.toISOString(), is_public: true, job_title: null, user_profile: { id, display_name: `Person ${id}`, username: id, profile_photo_url: null } });
const invite = (days: number, status: BusinessInvite['status'] = 'pending', userId: string | null = 'invitee'): BusinessInvite => ({ id: 'invite', business_id: 'biz', invited_by: 'owner', invitee_email: 'invitee@example.test', invitee_user_id: userId, role: 'editor', status, created_at: now.toISOString(), expires_at: new Date(now.getTime() + days * 86400000).toISOString(), token: null, invitee_profile: { id: userId ?? 'invitee', display_name: 'Andrew', username: 'andrew', profile_photo_url: null } });
const request: AccessRequest = { id: 'request', business_id: 'biz', requester_user_profile_id: 'sam', requested_role: 'team_member', message: null, status: 'pending', created_at: now.toISOString(), requester: { id: 'sam', display_name: 'Sam Smith', username: 'sam', profile_photo_url: null, primary_club_id: 'club', home_club_visibility: 'public' } };
function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['business-access-requests', 'biz'], mocks.requests);
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={['/business/biz/team']}>{node}</MemoryRouter></QueryClientProvider></I18nextProvider>);
}
beforeEach(() => { vi.clearAllMocks(); mocks.role = 'owner'; mocks.requests = [request]; mocks.rpc.mockResolvedValue({ data: { success: true }, error: null }); });
afterEach(cleanup);

describe('CB75 summary rules', () => {
  it.each([1, 3])('counts every member for %s-member summary', count => {
    mount(<TeamSummary team={Array.from({ length: count }, (_, i) => member(`${i}`))} invites={[]} businessName="X" loading={false} failed={false} waitingSettled canManage requestCount={0} />);
    expect(document.querySelector('[data-team-summary]')?.textContent).toContain(count === 1 ? '1 person runs X' : '3 people run X');
  });
  it('requests beat live invites', () => expect(teamSummaryRule(true, 2, [invite(1)], [invite(-1)] )?.kind).toBe('requests'));
  it('live invites beat expired', () => expect(teamSummaryRule(true, 0, [invite(1)], [invite(-1)])?.kind).toBe('live'));
  it('editors never get a request clause', () => expect(teamSummaryRule(false, 2, [], [])).toBeNull());
  it('twenty-day-old expiry is omitted', () => expect(summaryInvites([invite(-20)], [], now).expired).toHaveLength(0));
  it('invitee now on the team is omitted', () => expect(summaryInvites([invite(-1)], [member('invitee')], now).expired).toHaveLength(0));
  it('recent expired status is included', () => expect(summaryInvites([invite(-1, 'expired')], [], now).expired).toHaveLength(1));
  it('live requires pending status and future expiry', () => expect(summaryInvites([invite(1, 'revoked'), invite(-1)], [], now).live).toHaveLength(0));
  it('invite display name wins over username and email', () => expect(inviteName(invite(1))).toBe('Andrew'));
  it('invite username fallback has @', () => { const i = invite(1); if (i.invitee_profile) i.invitee_profile.display_name = null; expect(inviteName(i)).toBe('@andrew'); });
  it('invite email fallback is retained', () => { const i = invite(1); i.invitee_profile = null; expect(inviteName(i)).toBe('invitee@example.test'); });
  it('role order is stable within a role', () => expect(teamAvatarMembers([member('a'), member('b', 'owner'), member('c'), member('d', 'admin')]).map(m => m.id)).toEqual(['b', 'd', 'a', 'c']));
  it('six members give four avatars and two overflow', () => {
    mount(<TeamSummary team={Array.from({ length: 6 }, (_, i) => member(`${i}`))} invites={[]} businessName="X" loading={false} failed={false} waitingSettled canManage requestCount={0} />);
    expect(document.querySelectorAll('[data-team-member-avatar]')).toHaveLength(4);
    expect(document.querySelector('[data-team-overflow]')?.textContent).toBe('+2');
  });
  it('two members and one live invite give a dashed invite tile', () => {
    const future = invite(1); future.expires_at = new Date(Date.now() + 86400000).toISOString();
    mount(<TeamSummary team={[member('1'), member('2')]} invites={[future]} businessName="X" loading={false} failed={false} waitingSettled canManage requestCount={0} />);
    expect(document.querySelectorAll('[data-team-member-avatar]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-team-invite-avatar]')).toHaveLength(1);
  });
  it('waiting clause waits for both reads', () => {
    mount(<TeamSummary team={[member('1')]} invites={[invite(1)]} businessName="X" loading={false} failed={false} waitingSettled={false} canManage requestCount={2} />);
    expect(document.querySelector('[data-team-waiting]')).toBeNull();
  });
});
describe('CB75 public club and dates', () => {
  it('matching public club permits affiliation', () => expect(requestPlaysHere('club', request.requester)).toBe(true));
  it.each(['followers', 'private'])('%s home club is not disclosed', visibility => expect(requestPlaysHere('club', { ...request.requester, home_club_visibility: visibility })).toBe(false));
  it('business without club never claims affiliation', () => expect(requestPlaysHere(null, request.requester)).toBe(false));
  it('different club never claims affiliation', () => expect(requestPlaysHere('different', request.requester)).toBe(false));
  it.each([['2026-10-24', 'today', ''], ['2026-10-23', 'yesterday', ''], ['2026-10-20', 'date', 'Tuesday'], ['2026-10-12', 'date', '12 Oct'], ['2025-10-12', 'date', '12 Oct 2025']])('%s formats as %s %s', (date, key, value) => expect(requestWhen(`${date}T10:00:00Z`, now)).toEqual({ key, value }));
});
describe('CB75 request decisions and header', () => {
  it('no requests means no card', () => { mocks.requests = []; mount(<AccessRequestsSection businessId="biz" businessName="X" canManage />); expect(document.querySelector('[data-team-requests]')).toBeNull(); });
  it('pending request displays its live count', () => { mount(<AccessRequestsSection businessId="biz" businessName="X" canManage />); expect(document.querySelector('.team-request-count')?.textContent).toBe('1'); });
  it('requested Editor is selected and changing to Analyst sends analyst', async () => {
    mount(<AccessRequestsSection businessId="biz" businessName="X" canManage />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(screen.getByRole('radio', { name: /Editor/ })).toHaveAttribute('aria-checked', 'true');
    expect(document.querySelector('[data-requested-role="editor"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /Analyst/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add as Analyst' }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('decide_business_access_request', { p_request_id: 'request', p_decision: 'approve', p_role: 'analyst' }));
  });
  it('refusal preserves the sheet and request row', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: false, error: 'Not allowed' }, error: null });
    mount(<AccessRequestsSection businessId="biz" businessName="X" canManage />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add as Editor' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Not allowed'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.querySelector('[data-request-id="request"]')).toBeTruthy();
  });
  it('in-flight decision disables only its own row', async () => {
    mocks.requests = [request, { ...request, id: 'other' }];
    mocks.rpc.mockReturnValue(new Promise(() => {}));
    mount(<AccessRequestsSection businessId="biz" businessName="X" canManage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Add as Editor' }));
    await waitFor(() => expect(document.querySelector('[data-request-id="request"] [data-request-action="approve"]')).toBeDisabled());
    expect(document.querySelector('[data-request-id="other"] [data-request-action="approve"]')).not.toBeDisabled();
  });
  it.each(['owner', 'admin', 'editor', 'analyst'] as const)('%s has the authorised header Invite visibility', role => {
    mocks.role = role;
    // Real page uses route params; provide a matching route rather than a navigation mock.
    mount(<TeamPageWithRoute />);
    expect(document.querySelectorAll('.team-header-invite')).toHaveLength(role === 'owner' || role === 'admin' ? 1 : 0);
    expect(document.querySelector('main .fixed')).toBeNull();
  });
});

import { Route, Routes } from 'react-router-dom';
function TeamPageWithRoute() { return <Routes><Route path="/business/:businessId/team" element={<BusinessTeamPage />} /></Routes>; }