import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const h = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn(), pros: new Set<string>(), ams: new Set<string>(), verified: new Set<string>(), fail: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, functions: { invoke: h.invoke }, from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) })) } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { ProMemberName } from '@/features/pro-verification/ProLabel';
import { ProOrVerifiedMark } from '@/features/pro-verification/ProOrVerifiedMark';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { cachedVerifiedMember, invalidateVerifiedMembers, readVerifiedMembers } from '@/features/pro-verification/verifiedMembersCache';
import { invalidateProMembers } from '@/features/pro-verification/proMembersCache';
import { invalidateAmateurMembers } from '@/features/amateur-ranking/amateurMembersCache';
import { useUserActions } from '@/hooks/admin/useUserDetails';

const rows = (ids: string[], set: Set<string>, extra = {}) => ids.filter(id => set.has(id)).map(user_id => ({ user_id, ...extra }));
beforeEach(() => {
  invalidateVerifiedMembers(); invalidateProMembers(); invalidateAmateurMembers();
  h.pros.clear(); h.ams.clear(); h.verified.clear(); h.fail = false; h.rpc.mockReset(); h.invoke.mockReset();
  h.rpc.mockImplementation(async (name: string, args: { p_user_ids: string[] }) => {
    if (name === 'get_verified_members') return h.fail ? { data: null, error: new Error('missing') } : { data: rows(args.p_user_ids, h.verified), error: null };
    if (name === 'get_pro_members') return { data: rows(args.p_user_ids, h.pros, { pro_kind: 'tour_pro' }), error: null };
    if (name === 'get_verified_amateurs') return { data: rows(args.p_user_ids, h.ams), error: null };
    return { data: null, error: null };
  });
});
afterEach(() => cleanup());

const settle = () => waitFor(() => expect(h.rpc.mock.calls.some(c => c[0] === 'get_verified_members')).toBe(true));
const flush = () => act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
const tick = (c: HTMLElement) => c.querySelector('.member-verified-tick');
const label = (c: HTMLElement) => c.querySelector('.pro-label');

it('useVerifiedMembers batches ids into one get_verified_members call and caches misses', async () => {
  h.verified.add('a');
  expect([...(await readVerifiedMembers(['a', 'b']))]).toEqual(['a']);
  const calls = h.rpc.mock.calls.filter(c => c[0] === 'get_verified_members');
  expect(calls).toHaveLength(1); expect(calls[0][1]).toEqual({ p_user_ids: ['a', 'b'] });
  expect(cachedVerifiedMember('b')).toBeNull();
  await readVerifiedMembers(['b']);
  expect(h.rpc.mock.calls.filter(c => c[0] === 'get_verified_members')).toHaveLength(1);
});

for (const [title, Comp] of [['InlineProMemberName', InlineProMemberName], ['ProMemberName', ProMemberName]] as const) {
  it(`${title}: verified tick, PRO only, AM only, nothing`, async () => {
    h.verified.add('v'); h.verified.add('p'); h.verified.add('m'); h.pros.add('p'); h.ams.add('m');
    const { container } = render(<>{['v', 'p', 'm', 'n'].map(id => <div key={id} data-id={id}><Comp userId={id}>Name</Comp></div>)}</>);
    const cell = (id: string) => container.querySelector(`[data-id="${id}"]`) as HTMLElement;
    await waitFor(() => expect(tick(cell('v'))).not.toBeNull());
    await waitFor(() => expect(label(cell('p'))).not.toBeNull());
    await waitFor(() => expect(label(cell('m'))).not.toBeNull());
    expect(label(cell('v'))).toBeNull();
    expect(tick(cell('p'))).toBeNull(); expect(cell('p').querySelector('.pro-label')?.getAttribute('data-kind')).toBe('pro');
    expect(tick(cell('m'))).toBeNull(); expect(cell('m').querySelector('.pro-label')?.getAttribute('data-kind')).toBe('am');
    expect(tick(cell('n'))).toBeNull(); expect(label(cell('n'))).toBeNull();
  });
}

it('ProOrVerifiedMark: tick from the cache with verified false, and from the prop with the cache empty', async () => {
  h.verified.add('v');
  const a = render(<ProOrVerifiedMark userId="v" verified={false} />);
  await waitFor(() => expect(a.container.querySelector('svg')).not.toBeNull());
  const b = render(<ProOrVerifiedMark userId="x" verified />);
  expect(b.container.querySelector('svg')).not.toBeNull();
});

it('ProfileCoverBand: a verified member shows an 18px tick in the identity-badges slot; a pro shows PRO only', async () => {
  h.verified.add('v'); h.verified.add('p');
  const v = render(<ProfileCoverBand coverUrl={null} subline={null} displayName="Darren Gough" avatar={null} badgeUserId="v" />);
  await waitFor(() => expect(v.container.querySelector('.identity-badges .member-verified-tick')).not.toBeNull());
  expect(v.container.querySelector('.identity-badges svg')?.getAttribute('width')).toBe('18');
  const p = render(<ProfileCoverBand coverUrl={null} subline={null} displayName="Pro" avatar={null} badgeUserId="p" isPro />);
  await settle(); await flush();
  expect(p.container.querySelector('.identity-badges .pro-label')).not.toBeNull();
  expect(p.container.querySelector('.member-verified-tick')).toBeNull();
});

it('the RPC erroring renders no tick and no error', async () => {
  h.fail = true;
  const { container } = render(<><InlineProMemberName userId="v">A</InlineProMemberName><ProfileCoverBand coverUrl={null} subline={null} displayName="A" avatar={null} badgeUserId="v" /></>);
  await settle(); await flush();
  expect(tick(container)).toBeNull();
  expect(container.textContent).toContain('A');
});

it('a successful verifyGolfer invalidates the cache', async () => {
  await readVerifiedMembers(['v']); expect(cachedVerifiedMember('v')).toBeNull();
  h.invoke.mockResolvedValue({ data: { ok: true }, error: null });
  const qc = new QueryClient();
  const { result } = renderHook(() => useUserActions(), { wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> });
  await act(async () => { await result.current.verifyGolfer('v'); });
  expect(cachedVerifiedMember('v')).toBeUndefined();
});
