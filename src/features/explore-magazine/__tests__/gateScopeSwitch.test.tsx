import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', async () => {
  /* Resolves against the real English catalogue: call sites carry no fallbacks. */
  const en = (await import('../../../../public/locales/en/courses.json')).default as Record<string, unknown>;
  const look = (k: string) => k.split('.').reduce<unknown>((o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined), en);
  const t = (k: string, o?: unknown) => {
    const opts = (typeof o === 'object' && o) ? (o as Record<string, unknown>) : {};
    let v = typeof opts.count === 'number' ? look(`${k}_${opts.count === 1 ? 'one' : 'other'}`) ?? look(k) : look(k);
    if (typeof v !== 'string') v = typeof o === 'string' ? o : k;
    return (v as string).replace(/\{\{(\w+)\}\}/g, (_m, n) => String(opts[n] ?? ''));
  };
  return { useTranslation: () => ({ t }), initReactI18next: { type: '3rdParty', init: () => {} }, Trans: ({ children }: { children?: React.ReactNode }) => children ?? null };
});

const rpcRows: { current: unknown[] } = { current: [] };
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(async (name: string) => ({ data: name === 'get_board_page' ? rpcRows.current : [], error: null })),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));
vi.mock('@/features/explore-magazine/useFeatsWindow', () => ({ useFeatsWindow: () => ({ data: [], isSuccess: true }) }));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: () => ({ data: [] }) }));
const conn: { current: unknown } = { current: null };
vi.mock('@/lib/whs/hooks', async (orig) => ({ ...(await orig<object>()), useWhsConnection: () => ({ isSuccess: true, isLoading: false, data: conn.current }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { ScoresLeaderboardsPage } from '@/features/explore-magazine/ScoresLeaderboardsPage';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { DEFAULT_FILTERS, type BoardKey } from '@/components/explore-tab-new/courseled/boardFilters';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { fireEvent, waitFor } from '@testing-library/react';
import { FiltersPill } from '@/features/explore-magazine/ScoresFilterHead';
import { OFFERED_RANKING_BOARD_KEYS, boardValueIsFigure } from '@/components/explore-tab-new/courseled/boardFilters';
import { makeBoardState } from '@/test/factories/boardState';
import { MemoryRouter } from 'react-router-dom';

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const state = makeBoardState({ page: { data: { rows: [], total: 0, pool: { rounds: 0, courses: 0, members: 0 } }, isSuccess: true, isPending: false } as never });
  return rtlRender(<MemoryRouter><QueryClientProvider client={client}>
    <ScoresLeaderboardsPage userId="viewer" state={state} onOpenFilters={vi.fn()} onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />
  </QueryClientProvider></MemoryRouter>);
}

describe('CB39 scope switch', () => {
  /* CB44 — the page holds until In form's read settles, so each case waits
     for the hold to release before asserting the settled page. */
  it('is absent in the gated state', async () => {
    conn.current = null;
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-rounds-hold]')).toBeNull());
    expect(container.querySelector('[data-rounds-gate]')).not.toBeNull();
    expect(container.querySelector('[data-scores-control-row]')).toBeNull();
  });
  it('still renders for a connected member', async () => {
    conn.current = { id: 'c' };
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-rounds-hold]')).toBeNull());
    expect(container.querySelector('[data-rounds-gate]')).toBeNull();
    expect(container.querySelector('[data-scores-control-row]')).not.toBeNull();
  });
  it('still renders for a signed-out viewer', async () => {
    conn.current = null;
    const client = new QueryClient();
    const state = makeBoardState({});
    const { container } = rtlRender(<MemoryRouter><QueryClientProvider client={client}>
      <ScoresLeaderboardsPage userId={undefined} state={state} onOpenFilters={vi.fn()} onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />
    </QueryClientProvider></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('[data-rounds-hold]')).toBeNull());
    expect(container.querySelector('[data-scores-control-row]')).not.toBeNull();
  });
});
