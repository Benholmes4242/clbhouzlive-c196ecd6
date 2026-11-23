import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import tourhub from '@/locales/en/tourhub.json';
import type { PickRecord } from '@/features/tourhub/hooks/usePickInsights';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const state = vi.hoisted(() => ({ record: null as PickRecord | null, error: false }));
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({
  useOurPickRecord: () => ({ data: state.record, isError: state.error, isPending: false, isFetching: false }),
  useBeatTheModel: () => ({ data: [] }),
  useMyPickOdds: () => ({ data: null }),
}));
import { RecapOurRecord } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', ns: ['tourhub'], defaultNS: 'tourhub', resources: { en: { tourhub } }, interpolation: { escapeValue: false } });
function mount(tour: TourId = 'champ') {
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><RecapOurRecord tour={tour} year={2026} /></MemoryRouter></QueryClientProvider></I18nextProvider>);
}
beforeEach(() => {
  state.error = false;
  state.record = { tours: ['champ'], picks: 30, event_count: 10, won: 3, top10: 15, avg_percentile: null, first_event_date: null, events: [] };
});
describe('recap Our picks', () => {
  it('keeps the heading and sheet action in one heading row', () => {
    const { container } = mount();
    const head = container.querySelector('[data-recap-record] [data-hero-head]');
    expect(head?.querySelectorAll('h2')).toHaveLength(1);
    expect(head?.querySelector('h2')?.hasAttribute('data-hero-head-title')).toBe(true);
    const action = head?.querySelector('[data-hero-head-action]');
    expect(action?.tagName).toBe('BUTTON');
    expect(action?.textContent).toBe('How we pick ›');
  });
  it('preserves event_count, won and top10 as the three published figures', () => {
    const { container } = mount();
    expect([...container.querySelectorAll('.recap-record-figs b')].map(node => node.textContent)).toEqual(['10', '3', '15']);
    expect(container.querySelectorAll('.recap-record-figs .cw-cell')).toHaveLength(3);
  });
  it('opens the existing OurRecordSheet when the heading action is tapped', () => {
    const { container } = mount();
    expect(document.querySelector('[data-our-record-sheet]')).toBeNull();
    const action = container.querySelector<HTMLButtonElement>('[data-recap-record] [data-hero-head] [data-hero-head-action]');
    if (!action) throw new Error('Missing record action');
    fireEvent.click(action);
    expect(document.querySelector('[data-our-record-sheet]')).not.toBeNull();
    expect([...document.querySelectorAll('.pick-record-three b')].map(node => node.textContent)).toEqual(['10', '3', '15']);
  });
  it.each(['euro', 'pgad'] as const)('hides the block for disabled picks tour %s even with a record', (tour) => {
    const { container } = mount(tour);
    expect(container.querySelector('[data-recap-record]')).toBeNull();
  });
  it('hides the block when the published event count is zero', () => {
    state.record = state.record ? { ...state.record, event_count: 0 } : null;
    const { container } = mount();
    expect(container.querySelector('[data-recap-record]')).toBeNull();
  });
  it('hides the block when the published event count is absent', () => {
    state.record = state.record ? { ...state.record, event_count: undefined } : null;
    const { container } = mount();
    expect(container.querySelector('[data-recap-record]')).toBeNull();
  });
  it('hides the block without a published record', () => {
    state.record = null;
    const { container } = mount();
    expect(container.querySelector('[data-recap-record]')).toBeNull();
  });
  it('suppresses a stale record after a failed read', () => {
    state.error = true;
    const { container } = mount();
    expect(container.querySelector('[data-recap-record]')).toBeNull();
  });
});