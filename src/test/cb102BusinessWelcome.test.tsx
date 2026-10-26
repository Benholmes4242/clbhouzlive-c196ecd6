/**
 * CB102 — Your businesses welcome (no business yet).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/components/ui/VerifiedBadge', () => ({ VerifiedBadge: () => <span data-verified-badge="" /> }));

import { BusinessEmptyState } from '@/components/business/BusinessEmptyState';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';

const ok = (rounds_delta = 45, reviews_delta = 0) =>
  rpc.mockResolvedValue({ data: { rounds: 3985, rounds_delta, golfers: 26, golfers_delta: 4, reviews: 213, reviews_delta }, error: null });

function mount(onCreate = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(<QueryClientProvider client={qc}><BusinessEmptyState onCreate={onCreate} /></QueryClientProvider>);
  return { ...utils, onCreate };
}
const titles = (c: HTMLElement, card: string, sel: string) =>
  Array.from(c.querySelectorAll(`[data-card="${card}"] ${sel} b`)).map((b) => b.childNodes[0]?.textContent);

beforeEach(() => rpc.mockReset());

describe('CB102 business welcome', () => {
  it('opening copy and two pills, both calling onCreate', () => {
    ok();
    const { container, onCreate } = mount();
    expect(container.querySelector('[data-card="opening"] h2')?.textContent).toBe('Reach golfers who track every round. And know exactly who they are.');
    const pills = container.querySelectorAll('[data-create-pill]');
    expect(pills).toHaveLength(2);
    expect(container.querySelector('[data-card="opening"] [data-create-pill]')).not.toBeNull();
    expect(container.querySelector('[data-card="foot"] [data-create-pill]')).not.toBeNull();
    pills.forEach((p) => fireEvent.click(p));
    expect(onCreate).toHaveBeenCalledTimes(2);
  });

  it('four What every business gets rows in order', () => {
    ok();
    const { container } = mount();
    expect(titles(container, 'gets', '[data-row]')).toEqual(['A profile golfers can find', 'Posts in the Clubhouse feed', 'Golfers can message you', 'Insights from real golfers']);
  });

  it('Sample card shows fixed values and makes no request', () => {
    ok();
    const { container } = mount();
    const card = container.querySelector('[data-card="sample"]')!;
    expect(Array.from(card.querySelectorAll('[data-value]')).map((e) => e.textContent)).toEqual(['46', '12', '5']);
    expect(Array.from(card.querySelectorAll('[data-count]')).map((e) => e.textContent)).toEqual(['3', '6', '4', '1']);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('get_platform_reach_v2');
  });

  it('six business-type rows in order', () => {
    ok();
    const { container } = mount();
    expect(titles(container, 'types', '[data-row]')).toEqual(['Golf clubs', 'Ranges, academies, coaches and colleges', 'Shops and club fitters', 'Resorts and hotels', 'Restaurants, cafes and bars', 'Brands and creators']);
  });

  it('three steps, VerifiedBadge inside step 3', () => {
    ok();
    const { container } = mount();
    const steps = container.querySelectorAll('[data-card="steps"] [data-step]');
    expect(steps).toHaveLength(3);
    expect(steps[2].querySelector('b [data-verified-badge]')).not.toBeNull();
    expect(steps[0].querySelector('[data-verified-badge]')).toBeNull();
    expect(container.querySelectorAll('[data-verified-badge]')).toHaveLength(1);
  });

  it('figures read get_platform_reach_v2: two rows, green +n only above zero', async () => {
    ok(45, 0);
    const { container } = mount();
    await waitFor(() => expect(container.querySelectorAll('[data-figure-row]')).toHaveLength(2));
    const rows = container.querySelectorAll('[data-figure-row]');
    expect(rows[0].textContent).toContain('3,985');
    expect(rows[0].querySelector('[data-delta]')?.textContent).toBe('+45');
    expect(rows[1].textContent).toContain('213');
    expect(rows[1].querySelector('[data-delta]')).toBeNull();
    expect(container.textContent).not.toContain('26');
  });

  it('a failed read hides card and footnote', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { container } = mount();
    await waitFor(() => expect(container.querySelector('[data-card="figures"]')).toBeNull());
    expect(container.querySelector('[data-figures-footnote]')).toBeNull();
    expect(screen.queryAllByText(/./).length).toBeGreaterThan(0);
  });

  it('Driving Range sits directly after Golf Academy', () => {
    const i = BUSINESS_CATEGORIES.indexOf('Golf Academy');
    expect(BUSINESS_CATEGORIES[i + 1]).toBe('Driving Range');
  });
});
