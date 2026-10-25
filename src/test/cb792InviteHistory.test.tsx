import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const f = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, functions: { invoke: f.invoke } } }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { canManage: true, role: 'owner' }, isPending: false }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { name: 'Club', club_name: 'Club' } }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: { user: { id: 'owner' } }, user: { id: 'owner' }, loading: false }) }));
vi.mock('@/hooks/useBusinessTeam', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useBusinessTeam')>(),
  useBusinessTeam: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useBusinessInvites: () => ({ data: [], isPending: false }),
}));
vi.mock('@/hooks/useBusinessAccessRequests', () => ({ useBusinessAccessRequests: () => ({ data: [], isPending: false }) }));
vi.mock('@/components/business/AccessRequestsSection', () => ({ AccessRequestsSection: () => null }));
vi.mock('@/components/business/TeamSummary', () => ({ TeamSummary: () => null, TeamSubtitle: () => null }));
vi.mock('@/components/business/TeamListSection', () => ({ TeamListSection: () => null }));
vi.mock('@/components/business/TeamInvitesSection', () => ({ TeamInvitesSection: () => null }));
vi.mock('@/components/business/TeamRolesActivity', () => ({ TeamRoleTable: () => null, TeamActivityCard: () => null }));
vi.mock('@/components/manage/ManagePageShell', () => ({ ManagePageShell: ({ onBack, right, children }: { onBack?: () => void; right?: React.ReactNode; children: React.ReactNode }) => {
  const navigate = useNavigate();
  return <div><button onClick={onBack ?? (() => navigate(-1))} aria-label="Page back">Back</button>{right}{children}</div>;
} }));

import BusinessInvitePage from '@/pages/BusinessInvitePage';
import BusinessTeamPage from '@/pages/BusinessTeamPage';
import { toast } from '@/lib/toast';

function HistoryState() {
  const location = useLocation();
  const action = useNavigationType();
  const navigate = useNavigate();
  return <><output data-testid="history">{location.pathname}:{action}:{String(location.state?.fromTeam ?? false)}</output><button onClick={() => navigate(-1)}>History back</button><button onClick={() => navigate(1)}>History forward</button></>;
}
function mount(cold = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={cold ? ['/businesses/manage', '/business/b/team/invite'] : ['/businesses/manage', '/business/b/team']} initialIndex={1}>
    <HistoryState /><Toaster />
    <Routes><Route path="/businesses/manage" element={<div>Manage destination</div>} /><Route path="/business/:businessId/team" element={<BusinessTeamPage />} /><Route path="/business/:businessId/team/invite" element={<BusinessInvitePage />} /></Routes>
  </MemoryRouter></QueryClientProvider>);
  return { invalidate };
}
async function enterInvite() {
  fireEvent.click(screen.getByRole('button', { name: '' }));
  await screen.findByRole('textbox');
  expect(screen.getByTestId('history')).toHaveTextContent('/business/b/team/invite:PUSH:true');
}
beforeEach(() => {
  vi.clearAllMocks();
  f.rpc.mockImplementation(async (name: string) => name === 'get_business_invite_suggestions'
    ? { data: [{ user_id: 'ed', display_name: 'Ed Example', username: 'ed', reason: 'follower', profile_photo_url: null }], error: null }
    : { data: { success: true, invite_id: 'invite' }, error: null });
  f.invoke.mockResolvedValue({ error: null });
});
afterEach(() => { toast.dismiss(); cleanup(); });
describe('CB79.2 invite history', () => {
  it('Team Invite pushes fromTeam, page back returns Team and its next back returns Manage without a loop', async () => {
    mount(); await enterInvite();
    fireEvent.click(screen.getByRole('button', { name: 'Page back' }));
    expect(screen.getByTestId('history')).toHaveTextContent('/business/b/team:POP:false');
    fireEvent.click(screen.getByRole('button', { name: 'Page back' }));
    expect(screen.getByText('Manage destination')).toBeInTheDocument();
  });
  it('successful send pops to Team with one persistent toast, invalidations unchanged, then back returns Manage', async () => {
    const { invalidate } = mount(); await enterInvite();
    fireEvent.click(await screen.findByText('Ed Example'));
    fireEvent.click(screen.getByText('Admin'));
    fireEvent.click(screen.getByRole('button', { name: 'Invite Ed as an Admin' }));
    await waitFor(() => expect(screen.getByTestId('history')).toHaveTextContent('/business/b/team:POP:false'));
    expect(await screen.findByText('Invite sent to Ed')).toBeInTheDocument();
    expect(screen.getAllByText('Invite sent to Ed')).toHaveLength(1);
    expect(f.rpc).toHaveBeenCalledWith('invite_business_member_by_user', { p_business_id: 'b', p_invitee_user_id: 'ed', p_role: 'admin' });
    expect(invalidate.mock.calls.map(call => call[0]?.queryKey)).toEqual([['business-invites', 'b'], ['business-invite-suggestions', 'b'], ['business-team-feed', 'b']]);
    fireEvent.click(screen.getByRole('button', { name: 'Page back' }));
    expect(screen.getByText('Manage destination')).toBeInTheDocument();
  });
  it('cold Invite back replaces Team so Invite is absent when stepping forward again', async () => {
    mount(true); await screen.findByRole('textbox');
    fireEvent.click(screen.getByRole('button', { name: 'Page back' }));
    expect(screen.getByTestId('history')).toHaveTextContent('/business/b/team:REPLACE:false');
    fireEvent.click(screen.getByRole('button', { name: 'Page back' }));
    expect(screen.getByText('Manage destination')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(screen.getByTestId('history')).toHaveTextContent('/business/b/team:POP:false');
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});