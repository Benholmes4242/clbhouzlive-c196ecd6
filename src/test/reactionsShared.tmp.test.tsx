import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';

const rows: any[] = [];
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ in: async () => ({ data: rows, error: null }) }),
      insert: async (r: any) => { rows.push(r); return { error: null }; },
      delete: () => ({ eq: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
    }),
  },
}));

describe('reactions share one state across sections', () => {
  it('reacting in one window fills the other', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const seen: any = {};
    function A() {
      const r = useContentReactions([{ type: 'round', id: 'shared' }, { type: 'round', id: 'a-only' }]);
      seen.a = r; return null;
    }
    function B() {
      const r = useContentReactions([{ type: 'round', id: 'shared' }, { type: 'round', id: 'b-only' }]);
      seen.b = r; return null;
    }
    render(<QueryClientProvider client={qc}><A /><B /></QueryClientProvider>);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(seen.b.stateFor('round', 'shared')).toEqual({ count: 0, mine: false });
    await act(async () => { seen.a.toggle('round', 'shared'); await new Promise(r => setTimeout(r, 10)); });
    expect(seen.b.stateFor('round', 'shared')).toEqual({ count: 1, mine: true });
    expect(seen.b.stateFor('round', 'b-only')).toEqual({ count: 0, mine: false });
  });
});
