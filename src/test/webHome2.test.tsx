/** WEB_HOMEPAGE_2: the rebuilt public homepage at "/". Structure and live-data rules only. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const h = vi.hoisted(() => ({ rpc: vi.fn(), context: null as unknown, track: vi.fn(), links: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/pages/gate/useGateContext', () => ({ useGateContext: () => ({ data: h.context }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/lib/storeLinks', () => ({ FALLBACK_STORE_URL: 'https://apps.apple.com/fallback', FALLBACK_PLAY_URL: 'https://play.google.com/fallback', fetchStoreLinks: h.links }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
import AppDownloadGate from '@/pages/AppDownloadGate';

const card = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: `Course ${id}`, area: 'Kent, England', rating_avg: null, ratings_count: 0, quote: null, rounds: 0, hole_rounds: 0, plays_vs_par: null, read_available: false, hardest_hole: null, card_hardest_hole: null, top_holes: [], ...extra });
let data: Record<string, unknown>;
let cards: Record<string, unknown>;
beforeEach(() => {
  h.context = null;
  cards = { a: card('a'), b: card('b', { ratings_count: 2 }), c: card('c', { read_available: true, rounds: 12, hole_rounds: 14, plays_vs_par: 3.2, hardest_hole: { hole_no: 4, avg_to_par: 0.8, stroke_index: 3 }, top_holes: [{ hole_no: 4, avg_to_par: 0.8, stroke_index: 3 }] }), null: card('featured', { name: 'Featured Course' }) };
  data = { get_web_home_figures: [{ courses_total: 23305, rounds_total: 4442, holes_total: 79407, courses_30d: 12, rounds_30d: 0, holes_30d: 900 }], get_web_recent_courses: [{ id: 'r1', name: 'Recent One' }, { id: 'r2', name: 'Recent Two' }], get_web_popular_courses: [{ id: 'a', name: 'Course a' }, { id: 'b', name: 'Course b' }, { id: 'c', name: 'Course c' }], search_golf_courses: [{ id: 's1', name: 'Royal Search' }] };
  h.links.mockResolvedValue({ appStore: 'https://apps.apple.com/live', play: 'https://play.google.com/live', business: null });
  h.rpc.mockImplementation(async (name: string, args?: { p_course_id?: string | null }) => {
    if (name === 'get_web_course_card') return { data: cards[String(args?.p_course_id ?? null)] ?? null, error: null };
    const v = data[name]; return v instanceof Error ? { data: null, error: v } : { data: v ?? [], error: null };
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); localStorage.clear(); });
function mount(path = '/') { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><AppDownloadGate/></MemoryRouter></QueryClientProvider>); }
const lede = (c: HTMLElement) => c.querySelector('.hero .lede')?.textContent;

describe('WEB_HOMEPAGE_2', () => {
  it.each([
    ['/', null, 'A global platform for golf, used by the golfers who play it and the businesses behind it.', 'Post your rounds, follow golfers and creators, and see how every course really plays. Free on iPhone and Android.'],
    ['/i/code', { found: true, first_name: 'Danny' }, 'Danny invited you to clbhouz.', "Join free and land straight in Danny's circle: see each other's rounds, compare on the same courses, and find who else plays where you play."],
    ['/join', null, "You're invited to clbhouz.", "Join free and see each other's rounds, compare on the same courses, and find who else plays where you play."],
    ['/profile/name', { found: true, display_name: 'A Very Long Display Name Indeed' }, 'A Very Long Display Name Indeed is on clbhouz.', 'Follow their rounds, see where they play, and compare on the courses you share. Free on iPhone and Android.'],
    ['/profile/missing', { found: false }, 'A global platform for golf, used by the golfers who play it and the businesses behind it.', 'Post your rounds, follow golfers and creators, and see how every course really plays. Free on iPhone and Android.'],
  ])('hero for %s', (path, context, head, text) => { h.context = context; const { container } = mount(path); expect(container.querySelector('h1')?.textContent).toBe(head); expect(lede(container)).toBe(text); expect(container.querySelector('h1 .dot')).not.toBeNull(); });
  it('stashes the invite code', () => { mount('/i/hello'); expect(localStorage.getItem('clbhouz_invite_ref')).toBe('hello'); });
  it('two badge rows with fetched hrefs and placement on taps', async () => {
    const { container } = mount(); await waitFor(() => expect(container.querySelector('a[href="https://apps.apple.com/live"]')).not.toBeNull());
    const rows = [...container.querySelectorAll('[data-store-badges]')]; expect(rows).toHaveLength(2);
    rows.forEach((row, i) => { expect([...row.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['https://apps.apple.com/live', 'https://play.google.com/live']); fireEvent.click(row.querySelectorAll('a')[1]); expect(h.track).toHaveBeenCalledWith('store_link_tapped', { surface: 'download_gate', store: 'play_store', placement: i === 0 ? 'hero' : 'final' }); });
  });
  it('five hero phones, each a /web-home/ screenshot, only the centre eager', () => {
    const { container } = mount(); const imgs = [...container.querySelectorAll('[data-hero-fan] img')];
    expect(imgs.map(i => i.getAttribute('src'))).toEqual(['/web-home/club.webp', '/web-home/scorecard.webp', '/web-home/feed.webp', '/web-home/course.webp', '/web-home/explore.webp']);
    expect(imgs.map(i => i.getAttribute('loading'))).toEqual(['lazy', 'lazy', 'eager', 'lazy', 'lazy']);
    expect(imgs.every(i => i.getAttribute('width') === '750' && i.getAttribute('height') === '1626' && i.getAttribute('alt') === '')).toBe(true);
  });
  it('belt uses recent courses', async () => { const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-belt]')?.textContent).toContain('Recent One')); expect(h.rpc).toHaveBeenCalledWith('get_web_recent_courses', { p_limit: 12 }); });
  it('belt falls back to popular when recent is empty', async () => { data.get_web_recent_courses = []; const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-belt]')?.textContent).toContain('Course a')); expect(h.rpc).toHaveBeenCalledWith('get_web_popular_courses', { p_limit: 10 }); });
  it('belt hides when recent and popular are both empty', async () => { data.get_web_recent_courses = new Error('x'); data.get_web_popular_courses = []; const { container } = mount(); await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_web_popular_courses', { p_limit: 10 })); await act(async () => {}); expect(container.querySelector('[data-web-belt]')).toBeNull(); });
  it('lookup opens on the first popular course with a read, below unread ones', async () => {
    const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-course-card="c"]')).not.toBeNull());
    const hits = [...container.querySelectorAll('.lhits button.hit')]; expect(hits.map(b => b.classList.contains('on'))).toEqual([false, false, true]);
  });
  it('lookup shows the featured card with no row highlighted when none has a read', async () => {
    cards.c = card('c'); const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-course-card="featured"]')).not.toBeNull());
    expect(container.querySelector('.lhits .hit.on')).toBeNull();
  });
  it('search waits for the debounce and sends the trimmed query', async () => {
    const { container } = mount(); const input = container.querySelector('.lsearch input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: ' roy ' } }); expect(h.rpc).not.toHaveBeenCalledWith('search_golf_courses', expect.anything());
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('search_golf_courses', { search_query: 'roy', limit_count: 5 }));
    await waitFor(() => expect(container.querySelector('.hitlabel')).toBeNull());
  });
  it('fires web_course_card_viewed only on a click', async () => {
    const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-course-card="c"]')).not.toBeNull());
    expect(h.track).not.toHaveBeenCalledWith('web_course_card_viewed', expect.anything());
    fireEvent.click(container.querySelectorAll('.lhits button.hit')[0]); expect(h.track).toHaveBeenCalledWith('web_course_card_viewed', { course_id: 'a', source: 'popular' });
  });
  it('shows a delta line only for positive 30-day values', async () => {
    const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-proof]')).not.toBeNull());
    const deltas = [...container.querySelectorAll('[data-web-delta]')].map(d => d.textContent); expect(deltas).toEqual(['12 last 30 days', '900 last 30 days']);
    expect(container.querySelector('[data-web-proof]')?.textContent).toContain('23,305');
  });
  it.each(['error', 'zero'])('hides the proof panel on %s and uses unnumbered search copy', async kind => {
    data.get_web_home_figures = kind === 'error' ? new Error('x') : [{ courses_total: 0, rounds_total: 3, holes_total: 3 }];
    const { container } = mount(); await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_web_home_figures', undefined)); await act(async () => {});
    expect(container.querySelector('[data-web-proof]')).toBeNull(); await waitFor(() => expect((container.querySelector('.lsearch input') as HTMLInputElement).placeholder).toBe('Search courses'));
  });
  it('hides the quotes panel with no quotes, shows it with one', async () => {
    const first = mount(); await waitFor(() => expect(first.container.querySelector('[data-web-course-card]')).not.toBeNull()); expect(first.container.querySelector('[data-web-quotes]')).toBeNull(); cleanup();
    cards.a = card('a', { quote: 'Fast greens' }); const { container } = mount(); await waitFor(() => expect(container.querySelector('[data-web-quotes]')?.textContent).toContain('Course a'));
  });
  it('Why steps advance on click', () => { const { container } = mount(); const steps = container.querySelectorAll('.why .step'); fireEvent.click(steps[2]); expect(container.querySelectorAll('.why .step')[2].classList.contains('on')).toBe(true); expect(container.querySelector('.whyphone img')?.getAttribute('src')).toBe('/web-home/club.webp'); });
  it('FAQ answers the handicap question', () => { const { container } = mount(); const b = [...container.querySelectorAll('.qa button')].find(x => x.textContent === 'Which handicap can I connect?') as HTMLElement; expect(b.getAttribute('aria-expanded')).toBe('false'); fireEvent.click(b); expect(b.getAttribute('aria-expanded')).toBe('true'); expect(container.querySelector(`#${b.getAttribute('aria-controls')}`)?.textContent).toBe('Today you can connect an England Golf handicap, the one you use in MyEG, iPlay or iGolf. France and the United States are coming next, with more countries to follow.'); });
  it('prints the legal line with the current year', () => { const { container } = mount(); expect(container.querySelector('[data-web-legal]')?.textContent).toBe(`© ${new Date().getFullYear()} CLBHOUZ LTD. Registered in England and Wales, company number 16529152. 60 Cannon Street, London EC4N 6NP.`); });
  it.each([[false, 1], [true, 0]])('reduced motion %s: Why auto-advance', (reduced, expected) => {
    vi.useFakeTimers(); const mm = vi.fn().mockReturnValue({ matches: reduced, addEventListener() {}, removeEventListener() {} }); Object.defineProperty(window, 'matchMedia', { configurable: true, value: mm });
    const { container } = mount(); act(() => { vi.advanceTimersByTime(6100); });
    expect([...container.querySelectorAll('.why .step')].findIndex(s => s.classList.contains('on'))).toBe(expected);
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});
