import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MembersOverview, MembersOverviewMember } from '@/features/admin/hooks/useMembersRadar';
const h = vi.hoisted(() => ({ rpc: vi.fn(), pros: new Set<string>() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-verification/useProMembers', () => ({ useProMembers: (ids: string[]) => ({ members: new Map(ids.filter(id => h.pros.has(id)).map(id => [id, { user_id: id, pro_kind: 'tour_pro' }])), isLoading: false }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/features/admin/hooks/useUsers', () => ({ useEgIssueUserIds: () => ({ data: [] }) }));
vi.mock('@/features/admin/hooks/useAdminVerified', () => ({ useAdminVerified: () => ({ data: undefined }), adminVerifiedCount: () => 0 }));
vi.mock('@/features/admin/components/AdminVerifiedCard', () => ({ AdminVerifiedCard: () => null }));
import { invalidateAmateurMembers } from '@/features/amateur-ranking/amateurMembersCache';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { ProMemberName } from '@/features/pro-verification/ProLabel';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import MembersList from '@/features/admin/components/MembersList';
beforeEach(() => {
  invalidateAmateurMembers(); h.pros = new Set(['pro', 'both']); h.rpc.mockReset();
  h.rpc.mockImplementation(async (_name, args) => ({ data: args.p_user_ids.filter((id: string) => ['am', 'both'].includes(id)).map((user_id: string) => ({ user_id })), error: null }));
});
afterEach(cleanup);
describe('shared verified marks', () => {
  it.each([
    ['pro', true, 'pro', false], ['am', true, 'am', false], ['plain', true, null, true],
    ['plain', false, null, false], ['both', true, 'pro', false],
  ] as const)('%s verified=%s selects one authoritative mark', async (id, verified, kind, tick) => {
    const view = render(<ProOrVerifiedMark userId={id} verified={verified} />);
    await waitFor(() => expect(h.rpc).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(view.container.querySelector('.pro-label')?.getAttribute('data-kind') ?? null).toBe(kind));
    expect(view.container.querySelectorAll('.pro-label')).toHaveLength(kind ? 1 : 0);
    expect(view.container.querySelector('svg') !== null).toBe(tick);
  });
});
for (const Component of [InlineProMemberName, ProMemberName]) {
  describe(Component.name, () => {
    it.each([['pro', 'pro'], ['am', 'am'], ['plain', null], ['both', 'pro']] as const)('%s selects only %s', async (id, kind) => {
      const view = render(<Component userId={id}><span data-testid="original-name" /></Component>);
      await waitFor(() => expect(h.rpc).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(view.container.querySelector('.pro-label')?.getAttribute('data-kind') ?? null).toBe(kind));
      expect(view.container.querySelectorAll('.pro-label')).toHaveLength(kind ? 1 : 0);
      expect(view.getByTestId('original-name')).toBeInTheDocument();
    });
    it('no member id never reads amateur identity', () => {
      const view = render(<Component><span /></Component>);
      expect(h.rpc).not.toHaveBeenCalled(); expect(view.container.querySelector('.pro-label')).toBeNull();
    });
  });
}
it('cover-band AM occupies the large badge slot before Creator', () => {
  const view = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Member" subline={null} isAmateur isCreator />);
  const group = view.container.querySelector('.identity-badges');
  expect(group?.firstElementChild).toHaveAttribute('data-kind', 'am');
  expect(group?.firstElementChild).toHaveAttribute('data-size', 'large');
  expect(group?.lastElementChild).toHaveClass('profile-creator-label');
});
it('plain cover-band members have no badge group', () => {
  const view = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Member" subline={null} />);
  expect(view.container.querySelector('.identity-badges')).toBeNull();
});
it('cover-band PRO wins when both identities are supplied', () => {
  const view = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Member" subline={null} isAmateur isPro />);
  expect(view.container.querySelectorAll('.pro-label')).toHaveLength(1);
  expect(view.container.querySelector('.pro-label')).toHaveAttribute('data-kind', 'pro');
});
it('the admin list reads the visible ids and gives an amateur AM while preserving the index', async () => {
  const member: MembersOverviewMember = { user_id: 'am', display_name: 'Member', username: 'member', photo_url: null, home_club: null, index: 5.5, created_at: '2025-01-01', last_seen_at: null, connected: true, rounds_total: 0, admin_role: null, is_new: false, is_quiet: false, is_suspended: false, is_verified: false, email: null, weeks_8: Array(8).fill(false) };
  const overview: MembersOverview = { total: 1, recency: { d1: 0, d7: 0, d14: 0, d30: 0, older: 1 }, connected: 1, no_handicap: 0, new_7d: 0, quiet: 0, members: [member], team: [], invites: [], computed_at: '' };
  const view = render(<MemoryRouter><MembersList overview={overview} loading={false} onOpenMember={vi.fn()} /></MemoryRouter>);
  await waitFor(() => expect(view.container.querySelector('.pro-label')).toHaveAttribute('data-kind', 'am'));
  expect(view.container.querySelector('.pro-label')).toHaveAttribute('data-size', 'small');
  expect(h.rpc).toHaveBeenCalledWith('get_verified_amateurs', { p_user_ids: ['am'] });
  expect(view.container.textContent).toContain('5.5');
});