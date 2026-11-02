import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  breakdown, dropRate, footLine, isVisible, segmentColours, signed, shotsLost, AMBER_SEG, SEG_LARGE, SEG_SMALL,
  type MyScoring, type TourAverages,
} from '@/features/tourhub/players-v2/you/youAndTourRules';
import { surname } from '@/features/tourhub/players-v2/playersRules';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({ user: null as { id: string } | null, mine: null as unknown, tour: null as unknown }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user, session: null, loading: false }) }));
vi.mock('@/features/tourhub/players-v2/you/useYouAndTour', () => ({
  useTourHoleAverages: () => ({ data: h.tour }),
  useMyHoleScoring: () => ({ data: h.mine }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const ME: MyScoring = { rounds: 20, holes_par3: 80, holes_par4: 200, holes_par5: 80, par3: 0.82, par4: 0.86, par5: 0.71, bogey_rate: 0.62 };
const TOUR: TourAverages = { players: 70, par3: -0.004, par4: -0.062, par5: -0.508, bogey_rate: 0.137 };

describe('youAndTourRules maths', () => {
  it('reproduces the mock: 3.3 / 9.2 / 4.9, total 17.4, par 4s costliest', () => {
    const b = breakdown(ME, TOUR);
    expect(b.lost.p3.toFixed(1)).toBe('3.3');
    expect(b.lost.p4.toFixed(1)).toBe('9.2');
    expect(b.lost.p5.toFixed(1)).toBe('4.9');
    expect(b.total.toFixed(1)).toBe('17.4');
    expect(b.costliest).toBe('p4');
  });
  it('clamps negative gaps to zero', () => {
    expect(shotsLost({ ...ME, par5: -0.9 }, TOUR, 'p5')).toBe(0);
  });
  it('switches "1 in x" to "z in 10" at 0.5', () => {
    expect(dropRate(0.137)).toBe('1 hole in 7');
    expect(dropRate(0.49)).toBe('1 hole in 2');
    expect(dropRate(0.5)).toBe('5 in 10');
    expect(dropRate(0.62)).toBe('6 in 10');
  });
  it('formats signed values with a true minus and 0.00', () => {
    expect(signed(0.82)).toBe('+0.82');
    expect(signed(-0.062)).toBe('\u22120.06');
    expect(signed(-0.004)).toBe('0.00');
    expect(signed(0.004)).toBe('0.00');
  });
  it('colours: costliest amber, smaller other 0.45, larger other 0.75', () => {
    const b = breakdown(ME, TOUR);
    const c = segmentColours(b.lost, b.costliest);
    expect(c.p4).toBe(AMBER_SEG);
    expect(c.p3).toBe(SEG_SMALL);
    expect(c.p5).toBe(SEG_LARGE);
  });
});

describe('visibility', () => {
  it('needs signed in, 5+ rounds and tour players > 0', () => {
    expect(isVisible({ signedIn: false, mine: ME, tour: TOUR })).toBe(false);
    expect(isVisible({ signedIn: true, mine: { ...ME, rounds: 4 }, tour: TOUR })).toBe(false);
    expect(isVisible({ signedIn: true, mine: ME, tour: { ...TOUR, players: 0 } })).toBe(false);
    expect(isVisible({ signedIn: true, mine: ME, tour: null })).toBe(false);
    expect(isVisible({ signedIn: true, mine: { ...ME, rounds: 5 }, tour: TOUR })).toBe(true);
  });
});

describe('foot', () => {
  const join = (s: { text: string }[]) => s.map((x) => x.text).join('');
  it('leads with the leader when they have 30+ rounds', () => {
    const t = join(footLine({ leaderName: 'Scottie Scheffler', leaderBogey: 0.092, leaderRounds: 60, tourBogey: 0.137, myBogey: 0.62 }, surname));
    expect(t.startsWith('Scheffler drops a shot on 1 hole in 11. The tour, 1 in 7. You, 6 in 10.')).toBe(true);
  });
  it('drops the leader sentence under 30 rounds', () => {
    const t = join(footLine({ leaderName: 'Scottie Scheffler', leaderBogey: 0.092, leaderRounds: 29, tourBogey: 0.137, myBogey: 0.62 }, surname));
    expect(t.startsWith('The tour drops a shot on 1 hole in 7. You, 6 in 10.')).toBe(true);
  });
});

describe('card placement', () => {
  beforeEach(() => { h.user = null; h.mine = null; h.tour = null; });
  async function renderCard() {
    const { YouAndTourCard } = await import('@/features/tourhub/players-v2/you/YouAndTourCard');
    const data = { tour: 'pga', isPga: true, title: 'FedExCup', players: [], race: null, stakes: [], events: [], scorecard: undefined, form: [], live: {}, updatedAt: null, season: 2027 } as never;
    return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><YouAndTourCard data={data} /></MemoryRouter></QueryClientProvider>);
  }
  it('renders nothing for a guest', async () => {
    h.mine = ME; h.tour = TOUR;
    const { container } = await renderCard();
    expect(container.querySelector('[data-front-card="you_and_tour"]')).toBeNull();
  });
  it('renders nothing under 5 rounds or with no tour averages', async () => {
    h.user = { id: 'u1' }; h.mine = { ...ME, rounds: 4 }; h.tour = TOUR;
    const a = await renderCard();
    expect(a.container.querySelector('[data-front-card="you_and_tour"]')).toBeNull();
    a.unmount();
    h.mine = ME; h.tour = { ...TOUR, players: 0 };
    const b = await renderCard();
    expect(b.container.querySelector('[data-front-card="you_and_tour"]')).toBeNull();
  });
  it('renders three rows and three segments when shown', async () => {
    h.user = { id: 'u1' }; h.mine = ME; h.tour = TOUR;
    const { container } = await renderCard();
    expect(container.querySelector('[data-front-card="you_and_tour"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-you-row]').length).toBe(3);
    expect(container.querySelector('[data-seg="p4"]')?.getAttribute('data-seg-colour')).toBe(AMBER_SEG);
  });
});
