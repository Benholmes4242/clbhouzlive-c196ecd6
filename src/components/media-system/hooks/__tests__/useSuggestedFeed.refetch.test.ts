import { describe, it, expect, vi } from 'vitest';

const captured: any[] = [];
vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (opts: any) => { captured.push(opts); return { data: undefined, dataUpdatedAt: 0 }; },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('react', async (orig) => {
  const r: any = await orig();
  return { ...r, useEffect: () => {}, useRef: (v: any) => ({ current: v }), useMemo: (f: any) => f(), useCallback: (f: any) => f };
});

import { useSuggestedFeed } from '../useSuggestedFeed';

describe('useSuggestedFeed', () => {
  it('refetches on window focus (app default is false; staleTime 0 needs a trigger)', () => {
    useSuggestedFeed('u1');
    expect(captured[0].refetchOnWindowFocus).toBe(true);
  });
});
