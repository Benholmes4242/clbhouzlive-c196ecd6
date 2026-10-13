import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), navigate: vi.fn(), toast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.toast } }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({ useMessagingActor: () => ({ actorType: 'business', actorId: 'business' }) }));
describe('Member personal conversation handoff', () => {
  beforeEach(() => vi.clearAllMocks());
  it('opens the returned 1:1 as the admin personal account without sending a message', async () => {
    mocks.rpc.mockResolvedValue({ data: 'existing-thread', error: null });
    const { result } = renderHook(() => useStartConversation());
    await act(() => result.current.start({ actorType: 'personal', actorId: 'member' }, undefined, {
      asActor: { actorType: 'personal', actorId: 'admin-account' }, focusComposer: true, returnTo: '/admin-v2/users?member=member',
    }));
    expect(mocks.rpc.mock.calls).toEqual([['msg_start_direct', { p_as_actor_type: 'personal', p_as_actor_id: 'admin-account', p_target_actor_type: 'personal', p_target_actor_id: 'member' }]]);
    expect(mocks.navigate).toHaveBeenCalledWith('/messages/existing-thread', { state: { draft: undefined, focusComposer: true, returnTo: '/admin-v2/users?member=member' } });
  });
  it('uses the usual refusal and never navigates when normal messaging refuses', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'blocked' } });
    const { result } = renderHook(() => useStartConversation());
    await act(() => result.current.start({ actorType: 'personal', actorId: 'member' }, undefined, { asActor: { actorType: 'personal', actorId: 'admin-account' } }));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith('Could not start conversation');
  });
});