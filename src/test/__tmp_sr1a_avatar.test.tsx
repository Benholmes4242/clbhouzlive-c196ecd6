import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/courses.json';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { StandoutRounds } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { type StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';

const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
const i18n = createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['courses'], defaultNS: 'courses', resources: { en: { courses: en } }, interpolation: { escapeValue: false } });

function row(over: Partial<StandoutRound> = {}): StandoutRound {
  return { pos: 1, user_id: 'member', display_name: 'Member', profile_photo_url: null,
    whs_score_id: 'score', play_date: '2026-10-18', course_id: 'course', course_name: 'Full Course Name',
    gross_score: 75, course_par: 72, net_score: 69, course_handicap: 6, is_competition: true,
    prior_n: 12, avg_topar: 6, best_topar: 0, last_better: '2026-05-01', delta: -3.6, ...over };
}

describe('SR1a temp verification', () => {
  beforeEach(() => { f.rpc.mockReset(); f.rpc.mockResolvedValue({ data: [row()], error: null }); });

  it('renders the canonical squircle avatar with its hairline ring and no override hook', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}>
      <StandoutRounds viewerId="viewer" filters={DEFAULT_FILTERS} enabled onRowPress={vi.fn()} />
    </I18nextProvider></QueryClientProvider>);
    await waitFor(() => expect(document.querySelectorAll('[data-standout-row]')).toHaveLength(1));
    const rowEl = document.querySelector('[data-standout-row]')!;
    expect(rowEl.querySelector('[data-standout-avatar]')).toBeNull();
    const box = rowEl.querySelector('.overflow-hidden') as HTMLElement;
    expect(box.style.borderRadius).toBe('34%');
    expect(box.style.aspectRatio).toBe('1 / 1.05');
    expect(box.style.width).toBe('36px');
    const ring = rowEl.querySelector('.pointer-events-none') as HTMLElement;
    expect(ring.style.borderRadius).toBe('34%');
    expect(ring.style.getPropertyValue('border-top-width')).toBe('1px');
    expect(ring.style.getPropertyValue('border-top-style')).toBe('solid');
  });
});
