import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
const h = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
import { cachedAmateurMember, invalidateAmateurMembers, readAmateurMembers } from '@/features/amateur-ranking/amateurMembersCache';
import { useAmateurMembers } from '@/features/amateur-ranking/useAmateurMembers';
function Row({ id }: { id: string }) {
  const { members, isLoading } = useAmateurMembers([id]);
  return <span data-testid={id} data-loading={isLoading}>{members.has(id) ? 'member' : ''}</span>;
}
beforeEach(() => { invalidateAmateurMembers(); h.rpc.mockReset(); h.rpc.mockImplementation(async (_name, args) => ({ data: args.p_user_ids.map((user_id: string) => ({ user_id })), error: null })); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('two sibling rows coalesce into one verified-amateur RPC', async () => {
  const view = render(<><Row id="a" /><Row id="b" /></>);
  await waitFor(() => expect(view.getByTestId('b')).toHaveTextContent('member'));
  expect(view.getByTestId('a')).toHaveTextContent('member');
  expect(h.rpc).toHaveBeenCalledTimes(1);
  expect(h.rpc).toHaveBeenCalledWith('get_verified_amateurs', { p_user_ids: ['a', 'b'] });
});
it('501 ids split into chunks of 500 and one', async () => {
  const ids = Array.from({ length: 501 }, (_, i) => `id-${i}`);
  expect((await readAmateurMembers(ids)).size).toBe(501);
  expect(h.rpc.mock.calls.map(call => call[1].p_user_ids.length)).toEqual([500, 1]);
});
it('missing identities are cached as null without another read', async () => {
  h.rpc.mockResolvedValue({ data: [], error: null });
  expect((await readAmateurMembers(['missing'])).size).toBe(0);
  expect(cachedAmateurMember('missing')).toBeNull();
  await readAmateurMembers(['missing']); expect(h.rpc).toHaveBeenCalledTimes(1);
});
it('invalidation clears cached identities and refetches mounted rows', async () => {
  const view = render(<Row id="a" />);
  await waitFor(() => expect(view.getByTestId('a')).toHaveTextContent('member'));
  h.rpc.mockResolvedValue({ data: [], error: null });
  act(() => invalidateAmateurMembers());
  await waitFor(() => expect(view.getByTestId('a')).toHaveAttribute('data-loading', 'false'));
  expect(view.getByTestId('a').textContent).toBe(''); expect(h.rpc).toHaveBeenCalledTimes(2);
});
it('a failed RPC settles without a badge or a UI exception', async () => {
  h.rpc.mockResolvedValue({ data: null, error: new Error('denied') });
  const view = render(<Row id="a" />);
  await waitFor(() => expect(view.getByTestId('a')).toHaveAttribute('data-loading', 'false'));
  expect(view.getByTestId('a').textContent).toBe('');
});
it('the stale window is exactly five minutes', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  await readAmateurMembers(['a']);
  clock.mockReturnValue(300999); expect(cachedAmateurMember('a')).toBe('a');
  clock.mockReturnValue(301000); expect(cachedAmateurMember('a')).toBeUndefined();
  await readAmateurMembers(['a']); expect(h.rpc).toHaveBeenCalledTimes(2);
});
it('a pre-invalidation in-flight response cannot restore an old badge', async () => {
  let finish: ((value: unknown) => void) | undefined;
  h.rpc.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = readAmateurMembers(['a']); await Promise.resolve();
  invalidateAmateurMembers();
  h.rpc.mockResolvedValue({ data: [], error: null }); await readAmateurMembers(['a']);
  finish?.({ data: [{ user_id: 'a' }], error: null });
  expect((await old).size).toBe(0); expect(cachedAmateurMember('a')).toBeNull();
});