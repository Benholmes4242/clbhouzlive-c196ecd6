import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), error: vi.fn(), success: vi.fn(),
  orFilter: '' as string,
  createUser: vi.fn(), createEmail: vi.fn(),
  members: [] as Array<{ user_profile_id: string }>,
  invites: [] as Array<Record<string, unknown>>,
  suggestions: undefined as unknown,
  routeChanges: [] as string[],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, functions: { invoke: vi.fn() }, from: mocks.from } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ AppLog: { debug: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { name: 'Hartwell Heath', club_name: 'Hartwell Heath' } }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: { user: { id: 'owner' } }, loading: false, user: { id: 'owner' } }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: 'owner', canManage: true }, isPending: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/components/manage/ManagePageShell', () => ({ ManagePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/hooks/useBusinessTeam', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useBusinessTeam')>();
  return {
    ...actual,
    useBusinessTeam: () => ({ data: mocks.members, isLoading: false, isError: false }),
    useBusinessInvites: () => ({ data: mocks.invites }),
    useCreateInvite: () => ({ mutateAsync: mocks.createEmail, isPending: false }),
    useCreateInviteByUser: () => ({ mutateAsync: mocks.createUser, isPending: false }),
  };
});

import BusinessInvitePage from '@/pages/BusinessInvitePage';

const SUGGESTIONS = [
  { user_id: 'u-olivia', display_name: 'Olivia Brennan', username: 'oliviab', profile_photo_url: null, reason: 'home_club', followed_at: null },
  { user_id: 'u-kate', display_name: 'Kate Sims', username: 'katesims', profile_photo_url: null, reason: 'follower', followed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { user_id: 'u-priya', display_name: 'Priya Nair', username: 'priyanair', profile_photo_url: null, reason: 'follower', followed_at: '2025-08-10T12:00:00Z' },
];

function RouteState() {
  const location = useLocation();
  const navigation = useNavigationType();
  React.useEffect(() => { mocks.routeChanges.push(`${location.pathname}:${navigation}`); }, [location.pathname, navigation]);
  return <output data-testid="route-state">{location.pathname}:{navigation}</output>;
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/business/biz/team/invite']}>
        <RouteState />
        <Routes>
          <Route path="/business/:businessId/team" element={<div data-testid="team-destination" />} />
          <Route path="/business/:businessId/team/invite" element={<BusinessInvitePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { invalidate };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.members = [];
  mocks.invites = [];
  mocks.suggestions = SUGGESTIONS;
  mocks.routeChanges = [];
  mocks.orFilter = '';
  mocks.rpc.mockImplementation(async (name: string) => {
    if (name === 'get_business_invite_suggestions') return { data: mocks.suggestions, error: null };
    return { data: null, error: null };
  });
  mocks.from.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.or = (filter: string) => { mocks.orFilter = filter; return chain; };
    chain.limit = async () => ({
      data: [
        { id: 'u-jack', username: 'jackmarsh', display_name: 'Jack Marsh', profile_photo_url: null },
        { id: 'u-james', username: 'jprice', display_name: 'James Price', profile_photo_url: null },
        { id: 'u-jamie', username: 'jamiereed', display_name: 'Jamie Reed', profile_photo_url: null },
      ],
      error: null,
    });
    return chain;
  });
  mocks.createUser.mockResolvedValue({ success: true, invite_id: 'inv-1' });
  mocks.createEmail.mockResolvedValue({ id: 'inv-2' });
});
afterEach(cleanup);

describe('CB79 suggestions', () => {
  it('draws the home club group before the follower group, each with its rows', async () => {
    mount();
    const headings = await screen.findAllByRole('heading');
    const texts = headings.map((h) => h.textContent);
    expect(texts).toEqual(['Home club: Hartwell Heath', 'Follow Hartwell Heath']);
    expect(screen.getByText('Olivia Brennan')).toBeTruthy();
    expect(screen.getByText('@oliviab · plays here')).toBeTruthy();
    // CB79.1: follower rows carry only the handle; the heading says why.
    expect(screen.getByText('@katesims')).toBeTruthy();
    expect(screen.getByText('@priyanair')).toBeTruthy();
  });

  it('keeps the server order within each group without re-sorting', async () => {
    mocks.suggestions = [
      { user_id: 'u-b', display_name: 'Beta', username: 'beta', profile_photo_url: null, reason: 'home_club', followed_at: null },
      { user_id: 'u-a', display_name: 'Alpha', username: 'alpha', profile_photo_url: null, reason: 'home_club', followed_at: null },
      { user_id: 'u-z', display_name: 'Zulu', username: 'zulu', profile_photo_url: null, reason: 'follower', followed_at: null },
      { user_id: 'u-m', display_name: 'Mike', username: 'mike', profile_photo_url: null, reason: 'follower', followed_at: null },
    ];
    mount();
    await screen.findByText('Alpha');
    const names = Array.from(document.querySelectorAll('main section span span')).map((el) => el.textContent);
    const order = ['Beta', 'Alpha', 'Zulu', 'Mike'].map((n) => names.indexOf(n));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('skips a group with nobody in it', async () => {
    mocks.suggestions = SUGGESTIONS.filter((s) => s.reason === 'follower');
    mount();
    await screen.findByText('Follow Hartwell Heath');
    expect(screen.queryByText('Home club: Hartwell Heath')).toBeNull();
  });

  it('shows nothing under the search field when there are no suggestions', async () => {
    mocks.suggestions = [];
    mount();
    await screen.findByRole('textbox');
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('get_business_invite_suggestions', { p_business_id: 'biz' }));
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

describe('CB79 search', () => {
  it('marks team members and live invites as not selectable', async () => {
    mocks.members = [{ user_profile_id: 'u-james' }];
    mocks.invites = [{ id: 'i1', status: 'pending', invitee_user_id: 'u-jamie', expires_at: new Date(Date.now() + 86400000).toISOString() }];
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'ja' } });
    expect(await screen.findByText('On the team')).toBeTruthy();
    expect(screen.getByText('Invite pending')).toBeTruthy();
    expect((screen.getByText('James Price').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('Jamie Reed').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('Jack Marsh').closest('button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('strips PostgREST filter characters from the query', async () => {
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'ja,(%*\\' } });
    await waitFor(() => expect(mocks.orFilter).toBe('username.ilike.%ja%,display_name.ilike.%ja%'));
  });

  it('shows only the preselected Invite by email row for a full email address', async () => {
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'bar@hartwellheath.co.uk' } });
    expect(await screen.findByText('Invite by email')).toBeTruthy();
    expect(screen.getByText('bar@hartwellheath.co.uk')).toBeTruthy();
    expect(screen.queryByText('Jack Marsh')).toBeNull();
  });
});

describe('CB79 choosing and footer', () => {
  it('replaces the search with the chip and Change restores the text', async () => {
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'ja' } });
    fireEvent.click(await screen.findByText('Jack Marsh'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Change')).toBeTruthy();
    fireEvent.click(screen.getByText('Change'));
    expect((await screen.findByRole('textbox') as HTMLInputElement).value).toBe('ja');
  });

  it('preselects no role and walks the three footer states', async () => {
    mount();
    const footer = await screen.findByRole('button', { name: 'Choose someone to invite' });
    expect((footer as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(await screen.findByText('Olivia Brennan'));
    const chooseRole = screen.getByRole('button', { name: 'Choose a role' });
    expect((chooseRole as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Editor'));
    const send = screen.getByRole('button', { name: 'Invite Olivia as an Editor' });
    expect((send as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('They get a clbhouz notification and an email. Invites last 14 days.')).toBeTruthy();
  });

  it('shows the email fine print for an email invite', async () => {
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'bar@hartwellheath.co.uk' } });
    expect(await screen.findByText('They get an email with a link to join. Anyone with the link can use it, so send it only to the right address. It lasts 14 days.')).toBeTruthy();
    fireEvent.click(screen.getByText('Analyst'));
    expect(screen.getByRole('button', { name: 'Invite by email as an Analyst' })).toBeTruthy();
  });
});

describe('CB79 sending', () => {
  it('invites a golfer by user id with the chosen role, then replaces to the team page', async () => {
    const { invalidate } = mount();
    fireEvent.click(await screen.findByText('Olivia Brennan'));
    fireEvent.click(screen.getByText('Admin'));
    fireEvent.click(screen.getByRole('button', { name: 'Invite Olivia as an Admin' }));
    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledWith({ userId: 'u-olivia', role: 'admin' }));
    await screen.findByTestId('team-destination');
    expect(screen.getByTestId('route-state').textContent).toBe('/business/biz/team:REPLACE');
    const keys = invalidate.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0]);
    expect(keys).toContain('business-invite-suggestions');
    expect(keys).toContain('business-team-feed');
  });

  it('sends an email invite with the chosen role', async () => {
    mount();
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'bar@hartwellheath.co.uk' } });
    fireEvent.click(await screen.findByText('Editor'));
    fireEvent.click(screen.getByRole('button', { name: 'Invite by email as an Editor' }));
    await waitFor(() => expect(mocks.createEmail).toHaveBeenCalledWith({ email: 'bar@hartwellheath.co.uk', role: 'editor' }));
    await screen.findByTestId('team-destination');
  });

  it('keeps the screen exactly as it was on a refusal', async () => {
    mocks.createUser.mockRejectedValue(new Error('Invite already pending'));
    mount();
    fireEvent.click(await screen.findByText('Olivia Brennan'));
    fireEvent.click(screen.getByText('Editor'));
    fireEvent.click(screen.getByRole('button', { name: 'Invite Olivia as an Editor' }));
    await waitFor(() => expect(mocks.createUser).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Olivia Brennan')).toBeTruthy());
    expect(screen.queryByTestId('team-destination')).toBeNull();
    expect(screen.getByRole('button', { name: 'Invite Olivia as an Editor' })).toBeTruthy();
  });
});
