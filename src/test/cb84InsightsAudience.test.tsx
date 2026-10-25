/**
 * CB84 — Insights section 3 "Your golfers". The i18n mock returns
 * defaultValue or '' so these assert structure (data attributes, counts,
 * styles), never translated words.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

vi.mock('@/hooks/useBusinessProfile', () => ({
  useBusinessProfile: () => ({ data: { id: 'b1', name: 'Pro Shop', club_id: null }, isLoading: false }),
}));
vi.mock('@/hooks/useBusinessMembership', () => ({
  useBusinessMembership: () => ({ data: { role: 'owner', canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }),
}));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => ({ data: [], isFetched: true, isPlaceholderData: false, isError: false }) }));
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio: vi.fn() }) } }));

import {
  parseAudience, bandLabel, largestBand, formatMedian, type BusinessAudience,
} from '@/hooks/useBusinessAudience';
import { InsightsAudienceSection } from '@/components/business/insights/InsightsAudienceSection';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';

const audience = (o: Partial<BusinessAudience> = {}): BusinessAudience => ({
  followers_total: 94,
  with_handicap: 26,
  state: 'ready',
  median: 13.8,
  bands: [
    { from: 0, to: 1, count: 13 },
    { from: 2, to: 2, count: 8 },
    { from: 3, to: 3, count: 5 },
  ],
  regions: [
    { region: 'Kent', count: 9 },
    { region: 'Surrey', count: 7 },
    { region: 'Northern Ireland', count: 5 },
  ],
  elsewhere: 15,
  ...o,
});

const renderCard = (a: BusinessAudience) => {
  rpc.mockResolvedValue({ data: a, error: null });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InsightsAudienceSection businessId="b1" businessName="Pro Shop" />
    </QueryClientProvider>,
  );
};

describe('CB84 band labels', () => {
  it('names every {from, to} pair the server can return', () => {
    expect(bandLabel(0, 0)).toBe('Plus to 5');
    expect(bandLabel(0, 1)).toBe('Plus to 12');
    expect(bandLabel(0, 2)).toBe('Plus to 20');
    expect(bandLabel(0, 3)).toBe('All handicaps');
    expect(bandLabel(1, 1)).toBe('6 to 12');
    expect(bandLabel(1, 2)).toBe('6 to 20');
    expect(bandLabel(1, 3)).toBe('6 and up');
    expect(bandLabel(2, 2)).toBe('13 to 20');
    expect(bandLabel(2, 3)).toBe('13 and up');
    expect(bandLabel(3, 3)).toBe('21 and up');
  });
  it('title band is the largest; a tie goes to the lower band', () => {
    expect(largestBand([{ from: 0, to: 0, count: 5 }, { from: 1, to: 2, count: 9 }])).toMatchObject({ from: 1, to: 2 });
    expect(largestBand([{ from: 0, to: 1, count: 9 }, { from: 2, to: 3, count: 9 }])).toMatchObject({ from: 0, to: 1 });
  });
});

describe('CB84 median formatting', () => {
  it('one decimal; a plus handicap (stored negative) shows + and the absolute value', () => {
    expect(formatMedian(13.8)).toBe('13.8');
    expect(formatMedian(-1.2)).toBe('+1.2');
    expect(formatMedian(14)).toBe('14.0');
  });
});

describe('CB84 parseAudience', () => {
  it('parses a jsonb string and never reshapes bands or regions', () => {
    const a = parseAudience(JSON.stringify(audience()));
    expect(a.state).toBe('ready');
    expect(a.bands).toHaveLength(3);
    expect(a.regions.map(r => r.region)).toEqual(['Kent', 'Surrey', 'Northern Ireland']);
    expect(a.elsewhere).toBe(15);
  });
  it('unknown state falls back to none; missing arrays are empty', () => {
    const a = parseAudience({});
    expect(a.state).toBe('none');
    expect(a.bands).toEqual([]);
    expect(a.elsewhere).toBeNull();
  });
});

describe('CB84 ready card', () => {
  it('renders the returned bands exactly, in order, with fills against the largest', async () => {
    const { container } = renderCard(audience());
    await waitFor(() => expect(container.querySelector('[data-card="audience"]')).not.toBeNull());
    expect(container.querySelector('[data-card="audience"]')!.getAttribute('data-state')).toBe('ready');
    expect(container.querySelector('[data-title]')!.getAttribute('data-title')).toBe('most');
    expect(container.querySelector('[data-title]')!.getAttribute('data-band')).toBe('Plus to 12');
    const rows = [...container.querySelectorAll('[data-rows="bands"] .insights-audience-row')];
    expect(rows.map(r => r.getAttribute('data-band'))).toEqual(['0-1', '2-2', '3-3']);
    expect(rows.map(r => r.getAttribute('data-count'))).toEqual(['13', '8', '5']);
    const fills = rows.map(r => (r.querySelector('i') as HTMLElement).style.width);
    expect(fills[0]).toBe('100%');
    expect(parseFloat(fills[1])).toBeCloseTo((8 / 13) * 100, 1);
  });
  it('one band only switches the title to the one-band variant', async () => {
    const { container } = renderCard(audience({ bands: [{ from: 0, to: 3, count: 26 }] }));
    await waitFor(() => expect(container.querySelector('[data-title]')).not.toBeNull());
    expect(container.querySelector('[data-title]')!.getAttribute('data-title')).toBe('one-band');
  });
  it('tiles carry with_handicap and the formatted median', async () => {
    const { container } = renderCard(audience({ median: -1.2 }));
    await waitFor(() => expect(container.querySelector('[data-tile="median"]')).not.toBeNull());
    expect(container.querySelector('[data-tile="handicap"]')!.getAttribute('data-value')).toBe('26');
    expect(container.querySelector('[data-tile="median"]')!.textContent).toContain('+1.2');
  });
  it('regions render in order, Elsewhere last and dim, fills against the largest including Elsewhere', async () => {
    const { container } = renderCard(audience());
    await waitFor(() => expect(container.querySelector('[data-rows="regions"]')).not.toBeNull());
    const rows = [...container.querySelectorAll('[data-rows="regions"] .insights-audience-row')];
    expect(rows.map(r => r.getAttribute('data-region'))).toEqual(['Kent', 'Surrey', 'Northern Ireland', 'elsewhere']);
    const last = rows[3];
    expect(last.hasAttribute('data-elsewhere')).toBe(true);
    expect((last.querySelector('i') as HTMLElement).style.width).toBe('100%');
  });
  it('Elsewhere is omitted when 0', async () => {
    const { container } = renderCard(audience({ elsewhere: 0 }));
    await waitFor(() => expect(container.querySelector('[data-rows="regions"]')).not.toBeNull());
    expect(container.querySelector('[data-region="elsewhere"]')).toBeNull();
    expect(container.querySelectorAll('[data-rows="regions"] .insights-audience-row')).toHaveLength(3);
  });
  it('the whole regions block is absent when elsewhere is null', async () => {
    const { container } = renderCard(audience({ elsewhere: null }));
    await waitFor(() => expect(container.querySelector('[data-card="audience"]')).not.toBeNull());
    expect(container.querySelector('[data-rows="regions"]')).toBeNull();
    expect(container.querySelector('[data-rows="bands"]')).not.toBeNull();
  });
});

describe('CB84 not_enough and none', () => {
  it('not_enough renders the inset, the lead variant and the progress fill', async () => {
    const { container } = renderCard(audience({ state: 'not_enough', with_handicap: 6, bands: [], regions: [], elsewhere: null, median: null }));
    await waitFor(() => expect(container.querySelector('[data-state="not_enough"]')).not.toBeNull());
    expect(container.querySelector('[data-title]')!.getAttribute('data-title')).toBe('not-enough');
    expect(container.querySelector('.insights-audience-wait')!.getAttribute('data-with-handicap')).toBe('6');
    expect((container.querySelector('.insights-audience-progress i') as HTMLElement).style.width).toBe('60%');
    expect(container.querySelector('[data-tile="handicap"]')).toBeNull();
  });
  it('not_enough at 0 uses the zero lead and an empty fill', async () => {
    const { container } = renderCard(audience({ state: 'not_enough', with_handicap: 0, bands: [], regions: [], elsewhere: null, median: null }));
    await waitFor(() => expect(container.querySelector('[data-state="not_enough"]')).not.toBeNull());
    expect((container.querySelector('.insights-audience-progress i') as HTMLElement).style.width).toBe('0%');
  });
  it('none renders the none title and no inset', async () => {
    const { container } = renderCard(audience({ state: 'none', followers_total: 0, with_handicap: 0, bands: [], regions: [], elsewhere: null, median: null }));
    await waitFor(() => expect(container.querySelector('[data-state="none"]')).not.toBeNull());
    expect(container.querySelector('[data-title]')!.getAttribute('data-title')).toBe('none');
    expect(container.querySelector('.insights-audience-wait')).toBeNull();
  });
  it('a failed read renders no card', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}><InsightsAudienceSection businessId="b1" businessName="Pro Shop" /></QueryClientProvider>,
    );
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 20));
    expect(container.querySelector('[data-card="audience"]')).toBeNull();
  });
});

describe('CB84 page', () => {
  beforeEach(() => {
    rpc.mockClear();
    rpc.mockImplementation((name: string) => {
      if (name === 'get_business_audience') return Promise.resolve({ data: audience(), error: null });
      if (name === 'get_business_insights_funnel') {
        return Promise.resolve({
          data: { period_days: 30, saw: { value: 1, prev: 1 }, opened: { value: 1, prev: 1, visits: 1 }, followed: { value: 1, prev: 1, total: 1 }, tapped: { value: 1, prev: 1 }, top_post: null },
          error: null,
        });
      }
      return Promise.resolve({ data: {}, error: null });
    });
  });
  const renderPage = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/business/b1/insights']}>
          <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('the old "Who\'s viewing you" card is gone; the other cards still render', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-card="audience"]')).not.toBeNull());
    expect(container.querySelector('[data-card="audience"]')!.getAttribute('data-state')).toBe('ready');
    expect(container.querySelector('[data-card="visits"]')).not.toBeNull();
  });

  it('the card does not refetch when the 7/30/90 picker changes', async () => {
    const { container, getByText } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-card="audience"]')).not.toBeNull());
    const calls = () => rpc.mock.calls.filter(c => c[0] === 'get_business_audience').length;
    expect(calls()).toBe(1);
    fireEvent.click(getByText('7 days'));
    fireEvent.click(getByText('90 days'));
    await new Promise(r => setTimeout(r, 20));
    expect(calls()).toBe(1);
  });
});
