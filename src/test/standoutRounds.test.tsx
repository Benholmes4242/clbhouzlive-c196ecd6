import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/courses.json';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { StandoutRounds } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { standoutRpcArgs, type StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { standoutSentenceParts } from '@/components/explore-tab-new/courseled/standoutSentence';
import { fmtToPar } from '@/components/explore-tab-new/courseled/BoardRows';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

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
function mount(over: Partial<React.ComponentProps<typeof StandoutRounds>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const props = { viewerId: 'viewer', filters: DEFAULT_FILTERS, enabled: true, onRowPress: vi.fn(), ...over };
  const wrap = (next: typeof props) => <QueryClientProvider client={client}><I18nextProvider i18n={i18n}><StandoutRounds {...next} /></I18nextProvider></QueryClientProvider>;
  const result = render(wrap(props));
  return { ...result, props, update: (next: Partial<typeof props>) => result.rerender(wrap({ ...props, ...next })) };
}
const rows = () => document.querySelectorAll('[data-standout-row]');
beforeEach(() => { f.rpc.mockReset(); f.rpc.mockResolvedValue({ data: [row()], error: null }); });

describe('SR1 standout rules', () => {
  it('passes every board axis and limit four without default tuning overrides', () => {
    expect(standoutRpcArgs('viewer', { ...DEFAULT_FILTERS, scope: 'circle', window: '90' })).toEqual({
      p_viewer: 'viewer', p_scope: 'circle', p_window: '90', p_region_kind: DEFAULT_FILTERS.regionKind,
      p_region_value: DEFAULT_FILTERS.regionValue, p_courses: DEFAULT_FILTERS.courses, p_course_id: DEFAULT_FILTERS.courseId,
      p_band: DEFAULT_FILTERS.band, p_competition: DEFAULT_FILTERS.competition, p_limit: 4,
    });
  });
  it('queries the supplied scope and window again rather than storing another filter state', async () => {
    const result = mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    result.update({ filters: { ...DEFAULT_FILTERS, scope: 'club', window: '30' } });
    await waitFor(() => expect(f.rpc).toHaveBeenLastCalledWith('get_standout_rounds', expect.objectContaining({ p_scope: 'club', p_window: '30', p_limit: 4 })));
  });
  it('keeps unresolved reads entirely absent until success', async () => {
    let settle: ((value: { data: StandoutRound[]; error: null }) => void) | undefined;
    f.rpc.mockReturnValue(new Promise((resolve) => { settle = resolve; }));
    const result = mount();
    expect(result.container.childElementCount).toBe(0);
    settle?.({ data: [row()], error: null });
    await waitFor(() => expect(rows()).toHaveLength(1));
  });
  it('renders nothing for successful empty responses', async () => {
    f.rpc.mockResolvedValue({ data: [], error: null });
    const result = mount();
    await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));
    expect(result.container.childElementCount).toBe(0);
  });
  it('does not query before the board is ready', () => {
    const result = mount({ enabled: false });
    expect(f.rpc).not.toHaveBeenCalled();
    expect(result.container.childElementCount).toBe(0);
  });
  it.each([1, 2, 3, 4])('renders exactly %i supplied rows', async (count) => {
    f.rpc.mockResolvedValue({ data: Array.from({ length: count }, (_, pos) => row({ pos, whs_score_id: `score-${pos}` })), error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(count));
  });
  it('renders competition only for explicit true, not false or null', async () => {
    f.rpc.mockResolvedValue({ data: [true, false, null].map((is_competition, pos) => row({ pos, whs_score_id: `s${pos}`, is_competition })), error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].querySelector('[data-standout-competition]')).not.toBeNull();
    expect(rows()[1].querySelector('[data-standout-competition]')).toBeNull();
    expect(rows()[2].querySelector('[data-standout-competition]')).toBeNull();
  });
  it('hands the described round to the supplied board callback exactly once', async () => {
    const result = mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    fireEvent.click(rows()[0]);
    expect(result.props.onRowPress).toHaveBeenCalledExactlyOnceWith(row());
  });
  it('selects best-ever first when no better round exists', () => {
    expect(standoutSentenceParts(row({ last_better: null }))).toMatchObject({ key: 'amateur.standout.bestEver', course: 'Full Course Name' });
  });
  it('selects best-since at 60 calendar days, but not at 59', () => {
    expect(standoutSentenceParts(row({ last_better: '2026-08-19' }))).toMatchObject({ key: 'amateur.standout.bestSince', month: 'August' });
    expect(standoutSentenceParts(row({ last_better: '2026-08-20' }))).toMatchObject({ key: 'amateur.standout.betterAverage', n: 4 });
  });
  it('appends the prior month year only across calendar years', () => {
    expect(standoutSentenceParts(row({ last_better: '2025-12-01' }))).toMatchObject({ month: 'December 2025' });
    expect(standoutSentenceParts(row({ last_better: '2026-05-01' }))).toMatchObject({ month: 'May' });
  });
  it('rounds the absolute delta to a whole shot', () => {
    expect(standoutSentenceParts(row({ last_better: '2026-10-01', delta: -3.6 }))).toMatchObject({ n: 4 });
    expect(standoutSentenceParts(row({ last_better: '2026-10-01', delta: 3.4 }))).toMatchObject({ n: 3 });
  });
  it('prints score minus par with explicit signs and a true minus', () => {
    expect(fmtToPar(69 - 71)).toBe('−2');
    expect(fmtToPar(73 - 72)).toBe('+1');
    expect(fmtToPar(72 - 72)).toBe('E');
  });
  it('prints no to-par when par is missing', async () => {
    f.rpc.mockResolvedValue({ data: [row({ course_par: null, net_score: 72, gross_score: 78 })], error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0].textContent).toContain('NET72GROSS78');
  });
  it('renders a level net to-par as E', async () => {
    f.rpc.mockResolvedValue({ data: [row({ net_score: 72, gross_score: 78, course_par: 72 })], error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0].textContent).toContain('NET72EGROSS78+6');
  });
});

describe('CB9 under-par tone sits on the to-par, never the figure', () => {
  const tone = (c: string) => { const el = document.createElement('span'); el.style.color = c; return el.style.color; };
  const columns = () => Array.from(rows()[0].querySelectorAll('span.tabular-nums')).map((fig) => {
    const fg = fig as HTMLElement; const suffix = fg.querySelector('span') as HTMLElement;
    return { figure: fg.style.color, suffix: suffix.style.color };
  });
  it('net under par: figure is A.INK and the to-par carries TOPAR_UNDER_DARK', async () => {
    mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    const [net, gross] = columns();
    expect(net).toEqual({ figure: tone(A.INK), suffix: tone(TOPAR_UNDER_DARK) });
    expect(gross).toEqual({ figure: tone(A.MUTE), suffix: tone(A.DIM) });
  });
  it('gross under par paints its own to-par red, figure stays A.MUTE', async () => {
    f.rpc.mockResolvedValue({ data: [row({ gross_score: 70, net_score: 64 })], error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    const [net, gross] = columns();
    expect(net.suffix).toBe(tone(TOPAR_UNDER_DARK));
    expect(gross).toEqual({ figure: tone(A.MUTE), suffix: tone(TOPAR_UNDER_DARK) });
  });
  it('level par (E) stays dim', async () => {
    f.rpc.mockResolvedValue({ data: [row({ gross_score: 80, net_score: 72 })], error: null });
    mount();
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(columns()[0]).toEqual({ figure: tone(A.INK), suffix: tone(A.DIM) });
  });
});
