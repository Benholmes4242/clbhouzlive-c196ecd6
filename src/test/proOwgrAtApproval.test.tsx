/**
 * BRIEF_PRO_OWGR_AT_APPROVAL — an unlinked tour pro needs his OWGR page at
 * approval (or one explicit confirmation), and the verified catalogue warns
 * when a tour pro has no results source. react-i18next mock copied in full
 * from profileCoursesRecord.test.tsx:34.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const f = vi.hoisted(() => ({
  rpc: vi.fn(),
  invoke: vi.fn(),
  fromCalls: [] as string[],
  fromData: {} as Record<string, { data: unknown; error: unknown }>,
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), info: vi.fn() }),
  reviewMutate: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({ toast: f.toast }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: f.rpc,
    functions: { invoke: f.invoke },
    from: (table: string) => {
      f.fromCalls.push(table);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        ilike: () => chain,
        maybeSingle: async () => ({ data: null, error: null }),
        then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve(f.fromData[table] ?? { data: [], error: null }).then(res, rej),
      };
      return chain;
    },
  },
}));
vi.mock('@/features/admin/hooks/useVerifications', () => ({
  useVerifications: () => ({
    data: [], isLoading: false, refetch: vi.fn(),
    counts: { all: 0, pending: 0, business: 0, golfer: 0, pro: 0, courseClaim: 0 },
    reviewMutation: { mutate: f.reviewMutate, isPending: false },
    revokeMutation: { mutate: vi.fn(), isPending: false },
    removeGolferMutation: { mutate: vi.fn(), isPending: false },
    setProPlayerLinkMutation: { mutate: vi.fn(), isPending: false },
  }),
  useProofConflict: () => ({ data: null }),
}));

import { VerificationsTab } from '@/features/admin/components/VerificationsReview';
import { AdminVerifiedCard } from '@/features/admin/components/AdminVerifiedCard';
import type { VerificationRow } from '@/features/admin/hooks/useVerifications';
import type { AdminVerified } from '@/features/admin/hooks/useAdminVerified';

const baseRow: VerificationRow = {
  id: 'r1', type: 'golfer', status: 'pending', requestedBy: 'u-gary',
  createdAt: '2026-11-01T10:00:00Z', reviewedAt: null,
  note: null, adminNote: null,
  kind: 'tour_pro', proTour: 'Tartan Pro Tour', proTourCode: null,
  proLink: null, proNoProfile: false, displayName: 'Gary Ward', username: 'gary',
} as VerificationRow;

const review = { mutate: f.reviewMutate, isPending: false } as unknown as Parameters<typeof VerificationsTab>[0]['review'];

function mountTab(row: VerificationRow) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <VerificationsTab data={[row]} loading={false} review={review} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText(row.displayName!).closest('button')!);
}

/** Simulate the verify mutation succeeding. */
function succeedVerify() {
  const opts = f.reviewMutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
  opts?.onSuccess?.();
}

beforeEach(() => {
  vi.clearAllMocks();
  f.fromCalls = [];
  f.fromData = {};
  f.rpc.mockResolvedValue({ data: null, error: null });
  f.invoke.mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

describe('the OWGR field', () => {
  it('shows for a pending tour_pro with no tour player, and hides when one is chosen', async () => {
    // A coded tour with a matching sr_players suggestion chooses a player.
    f.fromData['sr_players'] = { data: [{ id: 'sp1', full_name: 'Gary Ward', tour_codes: ['pga'] }], error: null };
    mountTab({ ...baseRow, proTour: 'PGA TOUR', proTourCode: 'pga' });
    expect(await screen.findByLabelText('OWGR profile link')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('OWGR profile link')).toBeNull());
  });
  it('shows for an uncoded tour and never for a teaching pro', async () => {
    mountTab(baseRow);
    expect(await screen.findByLabelText('OWGR profile link')).toBeInTheDocument();
    cleanup();
    mountTab({ ...baseRow, kind: 'teaching_pro', proBody: 'The PGA (GB&I)', proClub: 'Sunningdale' });
    await screen.findByRole('button', { name: 'Verify as pro' });
    expect(screen.queryByLabelText('OWGR profile link')).toBeNull();
  });
  it('pre-fills from an OWGR proLink and not from another tour link', async () => {
    mountTab({ ...baseRow, proLink: 'https://www.owgr.com/playerprofile/gary-ward-12345' });
    expect(await screen.findByLabelText('OWGR profile link')).toHaveValue('https://www.owgr.com/playerprofile/gary-ward-12345');
    cleanup();
    mountTab({ ...baseRow, proLink: 'https://tartanprotour.co.uk/oom' });
    expect(await screen.findByLabelText('OWGR profile link')).toHaveValue('');
  });
});

describe('verify as pro', () => {
  it('an invalid link blocks verify and shows the inline warning', async () => {
    mountTab(baseRow);
    fireEvent.change(await screen.findByLabelText('OWGR profile link'), { target: { value: 'https://example.com/player' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify as pro' }));
    expect(screen.getByText("That isn't an OWGR player page.")).toBeInTheDocument();
    expect(f.reviewMutate).not.toHaveBeenCalled();
  });
  it('an empty link opens the confirm and does not verify; confirming verifies', async () => {
    mountTab(baseRow);
    fireEvent.click(await screen.findByRole('button', { name: 'Verify as pro' }));
    expect(f.reviewMutate).not.toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'No OWGR page?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'He has no OWGR page — verify' }));
    expect(f.reviewMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1', type: 'golfer', decision: 'approved', playerId: null }),
      expect.anything(),
    );
  });
  it('cancel returns to the OWGR input without verifying', async () => {
    mountTab(baseRow);
    fireEvent.click(await screen.findByRole('button', { name: 'Verify as pro' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add OWGR page' }));
    expect(f.reviewMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'No OWGR page?' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('OWGR profile link'));
  });
  it('a valid link verifies, then admin_set_pro_owgr, then the sync invoke, in that order', async () => {
    mountTab(baseRow);
    fireEvent.change(await screen.findByLabelText('OWGR profile link'), { target: { value: 'https://www.owgr.com/playerprofile/gary-ward-12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify as pro' }));
    expect(f.reviewMutate).toHaveBeenCalledWith(expect.objectContaining({ decision: 'approved' }), expect.anything());
    succeedVerify();
    await waitFor(() => expect(f.invoke).toHaveBeenCalledWith('sync-pro-world-rankings', { body: { user_id: 'u-gary' } }));
    expect(f.rpc).toHaveBeenCalledWith('admin_set_pro_owgr', { p_user_id: 'u-gary', p_owgr_url: 'https://www.owgr.com/playerprofile/gary-ward-12345' });
    expect(f.rpc.mock.invocationCallOrder[0]).toBeLessThan(f.invoke.mock.invocationCallOrder[0]);
    expect(f.toast.error).not.toHaveBeenCalled();
  });
  it('an RPC or sync failure keeps the verification and shows the toast', async () => {
    f.rpc.mockResolvedValue({ data: { error: 'owgr refused' }, error: null });
    mountTab(baseRow);
    fireEvent.change(await screen.findByLabelText('OWGR profile link'), { target: { value: 'https://owgr.com/playerprofile/gary-ward-12345/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify as pro' }));
    succeedVerify();
    await waitFor(() => expect(f.toast.error).toHaveBeenCalledWith(
      "Verified, but his OWGR page couldn't be added: owgr refused. Add it from his World ranking card.",
    ));
    expect(f.reviewMutate).toHaveBeenCalled();
    expect(f.invoke).not.toHaveBeenCalled();
  });
});

describe('the safety net', () => {
  const pro = (over: Record<string, unknown>) => ({
    id: 'p1', display_name: 'Gary Ward', username: 'gary', avatar_url: null,
    verified_at: '2026-11-01T00:00:00Z', pro_kind: 'tour_pro', pro_tour: 'Tartan Pro Tour', pro_club: null, ...over,
  });
  const data = (pros: unknown[]): AdminVerified => ({ pros, pending: [], golfers: [], businesses: [] } as unknown as AdminVerified);
  const mountCard = (d: AdminVerified) => render(
    <MemoryRouter>
      <AdminVerifiedCard data={d} loading={false} error={false} onOpenMember={vi.fn()} />
    </MemoryRouter>,
  );

  it('shows "No results source" for an unlinked tour pro without a source row', async () => {
    f.fromData['pro_world_rank_sources'] = { data: [], error: null };
    mountCard(data([pro({})]));
    expect(await screen.findByText(/No results source/)).toBeInTheDocument();
  });
  it('shows no warning for an unlinked tour pro with a source row, or a linked one', async () => {
    f.fromData['pro_world_rank_sources'] = { data: [{ user_id: 'p1' }], error: null };
    mountCard(data([pro({})]));
    await waitFor(() => expect(f.fromCalls).toContain('pro_world_rank_sources'));
    expect(screen.queryByText(/No results source/)).toBeNull();
    cleanup();
    f.fromCalls = [];
    mountCard(data([pro({ pro_player_id: 'sp1' })]));
    expect(screen.queryByText(/No results source/)).toBeNull();
  });
  it('a failed sources read shows no warning', async () => {
    f.fromData['pro_world_rank_sources'] = { data: null, error: new Error('denied') };
    mountCard(data([pro({})]));
    await waitFor(() => expect(f.fromCalls).toContain('pro_world_rank_sources'));
    expect(screen.queryByText(/No results source/)).toBeNull();
  });
});
