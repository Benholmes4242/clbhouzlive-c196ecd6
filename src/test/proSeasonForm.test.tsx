import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProResultRow, ProSeasonSection } from '@/features/pro-profile/ProSeasonSection';
import { finishClass, finishLabel, type ProEvent, type ProRound } from '@/features/pro-profile/proProfileRules';
import { ProfileTourTab } from '@/features/pro-verification/ProfileTourTab';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ events: [] as ProEvent[] }));
vi.mock('@/features/pro-profile/useProProfile', () => ({ useProEvents: () => ({ isSuccess: true, isError: false, data: state.events }) }));
vi.mock('@/features/tourhub/player-v2/data/usePlayerData', () => ({ usePlayerSeasonResults: () => ({ isSuccess: true, isError: false, data: [] }) }));

const event = (id: string, overrides: Partial<ProEvent> = {}): ProEvent => ({ id, user_id: 'pro', source: 'owgr', event_name: `Event ${id}`, start_date: '2026-11-01', end_date: '2026-11-02', country: 'China', venue: null, tour_name: 'Alps Tour', finish: 'T28', total_strokes: 144, to_par: null, scheduled_rounds: 2, tee_time: null, tee_hole: null, owgr_event_id: id, owgr_points: null, owgr_rank_before: null, owgr_rank_after: null, owgr_year: 2026, owgr_week: 44, created_at: '', updated_at: '', rounds: [], ...overrides });
const round = (round_no: number, strokes: number | null): ProRound => ({ event_id: 'rounds', round_no, strokes, to_par: null, source: 'owgr', posted_at: '', holes_played: 18 });
const mount = (node: React.ReactNode) => render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider></MemoryRouter>);
const season = (events: ProEvent[]) => mount(<ProSeasonSection events={events} year={2026} first="Mason" linked={false} />);
const chips = (container: HTMLElement) => [...container.querySelectorAll<HTMLButtonElement>('.pro-season-form-chip')];
afterEach(cleanup);

describe('Season shared finish classification', () => {
  it.each([['MC','out'], ['WD','out'], ['DQ','out'], ['1st','win'], ['T2','top'], ['T10','top'], ['T11','made'], ['T28','made']] as const)('%s is %s', (finish, classification) => {
    expect(finishClass(finish)).toBe(classification);
  });
});

describe('Season last-ten form', () => {
  it('form chips carry no ghost variant classes', () => {
    const { container } = season(['T28', 'T3', '1st', 'MC'].map((finish, i) => event(String(i), { finish })));
    const formChips = chips(container);
    expect(formChips).toHaveLength(4);
    formChips.forEach(chip => {
      expect(chip).not.toHaveClass('bg-transparent');
      expect(chip).not.toHaveClass('text-muted-foreground');
    });
  });
  it('caps at ten newest finished events across years using See all ordering', () => {
    const events = Array.from({ length: 12 }, (_, i) => event(`e${i}`, { start_date: `${2026-i}-11-01` })).reverse();
    events.push(event('unfinished', { start_date: '2026-12-01', finish: null }));
    const { container } = season(events);
    expect(chips(container).map(b => b.getAttribute('aria-label'))).toEqual(Array.from({ length: 10 }, (_, i) => `T28, Event e${i}`));
  });
  it.each([0,1,2])('hides with %i finished events', count => {
    const { container } = season(Array.from({ length: count }, (_, i) => event(String(i))));
    expect(container.querySelector('.pro-season-form')).toBeNull();
  });
  it('renders three populated chips without inventing seven events', () => {
    const { container } = season([event('a'),event('b'),event('c')]);
    expect(chips(container)).toHaveLength(3);
    expect(container.querySelector('.pro-season-form-strip')?.childElementCount).toBe(3);
  });
  it('each chip class and aria-label use the shared finish rules', () => {
    const events = ['MC','1st','T2','T28'].map((finish,i) => event(String(i), { finish }));
    const { container } = season(events);
    chips(container).forEach((chip,i) => {
      expect(chip).toHaveClass(`pro-finish-${finishClass(events[i].finish)}`);
      expect(chip).toHaveAccessibleName(`${finishLabel(events[i].finish)}, ${events[i].event_name}`);
    });
  });
  it('a form chip opens ResultDetail for that event, including an older year', () => {
    season([event('current'),event('older', { start_date: '2025-11-01' }),event('oldest', { start_date: '2024-11-01' })]);
    fireEvent.click(screen.getByRole('button', { name: 'T28, Event older' }));
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Event older' })).toBeInTheDocument();
  });
});

describe('Shared pro result row', () => {
  it.each([['MC','out'], ['WD','out'], ['DQ','out'], ['1st','win'], ['T2','top'], ['T10','top'], ['T11','made'], ['T28','made']] as const)('%s row uses %s finish chip', (finish, classification) => {
    const { container } = mount(<ProResultRow event={event('a', { finish })} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-profile-finish')).toHaveClass(`pro-finish-${classification}`);
  });
  it('OWGR rounds show total and 72 72 in round order, omitting null strokes', () => {
    const { container } = mount(<ProResultRow event={event('rounds', { rounds: [round(2,72),round(1,72),round(3,null)] })} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-profile-gross')).toHaveTextContent('144');
    expect(container.querySelector('.pro-result-round-strokes')?.textContent).toBe('72 72');
  });
  it('OWGR without rounds shows only its total', () => {
    const { container } = mount(<ProResultRow event={event('a')} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-profile-gross')).toHaveTextContent('144');
    expect(container.querySelector('.pro-result-round-strokes')).toBeNull();
  });
  it.each([[1.24,'1.24 pts'], [0.003,'<0.01 pts']] as const)('points %s render %s', (owgr_points, label) => {
    const { container } = mount(<ProResultRow event={event('a', { owgr_points })} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-result-points')?.textContent).toBe(label);
  });
  it.each([null,0])('points %s have no span', owgr_points => {
    const { container } = mount(<ProResultRow event={event('a', { owgr_points })} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-result-points')).toBeNull();
  });
  it('non-OWGR retains signed under-par and added tag with no rounds line', () => {
    const { container } = mount(<ProResultRow event={event('a', { source: 'pro', to_par: -2, rounds: [round(1,72)] })} first="Mason" open={vi.fn()} />);
    expect(container.querySelector('.pro-profile-under')?.textContent).toBe('−2');
    expect(container.querySelector('.pro-profile-added')).toBeInTheDocument();
    expect(container.querySelector('.pro-result-round-strokes')).toBeNull();
  });
  it('ProfileTourTab inherits the same OWGR finish chip and round line', () => {
    state.events = [event('tab', { finish: 'T2', rounds: [round(1,72),round(2,72)] })];
    const { container } = mount(<ProfileTourTab pro={{ user_id:'pro', pro_kind:'tour_pro', pro_player_id:null, pro_club:null, pro_tour:'Alps Tour', pro_tour_code:null }} displayName="Mason Essam" isOwner={false} />);
    expect(container.querySelector('.pro-profile-finish')).toHaveClass('pro-finish-top');
    expect(container.querySelector('.pro-result-round-strokes')?.textContent).toBe('72 72');
  });
});