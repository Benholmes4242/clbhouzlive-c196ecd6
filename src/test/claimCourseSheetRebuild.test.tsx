/**
 * CLAIM SHEET REBUILD — ClaimCourseSheet presentation per
 * claim-sheet-signed-off.html. Structure only: the react-i18next mock returns
 * '' for every key, so assertions target data attributes and DOM order, never
 * words. The claim logic (request-course-claim body, create URL, states) is
 * unchanged and asserted here.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const db = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  memberships: [] as unknown[],
  membershipsLoading: false,
  rounds: 186 as number | null,
  holes: [] as { hole_no: number; par: number; avg_to_par: number }[],
  sample: [] as { id: string; user_id: string; rating: number }[],
  photos: 20,
  unanswered: 9,
  invokeBody: null as unknown,
  tracked: [] as { event: string; props: unknown }[],
}));

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: db.user }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({
  useMyBusinesses: () => ({ data: db.memberships, isLoading: db.membershipsLoading }),
}));
vi.mock('@/features/business/claimClub', () => ({
  fetchGolfClub: async (id: string) => ({ id, name: id === 'club-linked' ? 'Sundridge Park' : 'Yas Links Abu Dhabi' }),
}));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({
  useCourseStatsDetail: () => ({ data: db.rounds == null ? null : { rounds_tracked: db.rounds } }),
}));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({
  useCourseHoleAnalysis: () => ({ data: db.holes.length ? { available: true, total_rounds: 50, holes: db.holes } : null }),
}));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => ({ data: db.sample }) }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({
  useCourseMediaCounts: () => ({ data: { photos: db.photos, videos: 0, total: db.photos } }),
}));
vi.mock('@/hooks/useUnansweredReviewCount', () => ({
  useUnansweredReviewCount: () => ({ data: db.unanswered }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: async (_name: string, opts: { body: unknown }) => {
        db.invokeBody = opts.body;
        return { data: { ok: true }, error: null };
      },
    },
  },
}));
vi.mock('@/utils/analyticsEvents', () => ({
  analyticsEvents: { track: (event: string, props: unknown) => db.tracked.push({ event, props }) },
}));
vi.mock('@/lib/toast', () => ({ toast: { success: () => {}, error: () => {} } }));

import ClaimCourseSheet from '@/components/courses/course-detail/ClaimCourseSheet';

const golfBiz = (id: string, name: string, clubId: string | null) => ({
  id: `m-${id}`,
  role: 'owner',
  business: {
    id, name, slug: null, category: 'Golf Club', location: null,
    city: 'Abu Dhabi', region: null, country: null, logo_url: null,
    is_verified: false, is_deleted: false, club_id: clubId,
  },
  clubCourses: [],
});

const HOLES18 = Array.from({ length: 18 }, (_, i) => ({
  hole_no: i + 1,
  par: 4,
  yards: 400,
  stroke_index: i + 1,
  rounds: 50,
  avg_to_par: i === 6 ? 0.92 : 0.2 + (i % 5) * 0.05,
  avg_gross: 4.5,
  dist: { ace: 0, albatross: 0, eagle: 0, birdie: 1, par: 30, bogey: 15, double: 4 },
}));

function Loc() { const l = useLocation(); return <span data-loc="">{l.pathname}{l.search}</span>; }

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/courses/c1']}>
        <Routes>
          <Route path="/courses/c1" element={<><ClaimCourseSheet open onClose={() => {}} clubId="club-1" sourceCourseId="c1" /><Loc /></>} />
          <Route path="/business/create" element={<Loc />} />
          <Route path="/auth" element={<Loc />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const qa = (sel: string) => [...document.querySelectorAll(sel)];

afterEach(() => {
  cleanup();
  Object.assign(db, {
    user: { id: 'u1' }, memberships: [], membershipsLoading: false,
    rounds: 186, holes: [], sample: [], photos: 20, unanswered: 9,
    invokeBody: null, tracked: [],
  });
});

describe('claim sheet rebuild — claimable state', () => {
  it('renders the full layout in the mock order with step 1 ticked', async () => {
    db.memberships = [golfBiz('b1', 'Yas Links Golf', null)];
    mount();
    await waitFor(() => expect(q('[data-claim-actions]')).not.toBeNull());
    const order = ['[data-claim-header]', '[data-claim-panel]', '[data-claim-gains]', '[data-claim-steps]', '[data-claim-actions]']
      .map((s) => q(s))
      .filter((el): el is HTMLElement => !!el);
    expect(order).toHaveLength(5);
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const steps = qa('[data-claim-step]');
    expect(steps).toHaveLength(3);
    expect(steps[0].getAttribute('data-claim-step')).toBe('done');
    expect(steps[1].getAttribute('data-claim-step')).toBe('todo');
    expect(steps[2].getAttribute('data-claim-step')).toBe('todo');
    expect(qa('[data-claim-profile-card]')).toHaveLength(1);
    expect(q('[data-claim-selected="true"]')).not.toBeNull();
  });

  it('submits the claim with the same request-course-claim body as today', async () => {
    db.memberships = [golfBiz('b1', 'Yas Links Golf', null)];
    mount();
    await waitFor(() => expect(q('[data-claim-primary]')).not.toBeNull());
    fireEvent.click(q('[data-claim-primary]')!);
    await waitFor(() => expect(db.invokeBody).not.toBeNull());
    expect(db.invokeBody).toEqual({
      business_id: 'b1',
      club_id: 'club-1',
      club_key: null,
      source_course_id: 'c1',
      proof_note: null,
    });
  });

  it('tracks open, submit and setup-profile with club and course ids', async () => {
    db.memberships = [golfBiz('b1', 'Yas Links Golf', null)];
    mount();
    await waitFor(() => expect(db.tracked.some((c) => c.event === 'claim_sheet_open')).toBe(true));
    const open = db.tracked.find((c) => c.event === 'claim_sheet_open')!;
    expect(open.props).toMatchObject({ state: 'claimable', club_id: 'club-1', course_id: 'c1' });
    fireEvent.click(q('[data-claim-primary]')!);
    await waitFor(() => expect(db.tracked.some((c) => c.event === 'claim_sheet_submit')).toBe(true));
  });
});

describe('claim sheet rebuild — linked state', () => {
  it('shows the profile card and the button goes to the create URL', async () => {
    db.memberships = [golfBiz('b2', 'Sundridge Park Golf Club', 'club-linked')];
    mount();
    await waitFor(() => expect(q('[data-claim-profile-card]')).not.toBeNull());
    expect(qa('[data-claim-step]')[0].getAttribute('data-claim-step')).toBe('todo');
    fireEvent.click(q('[data-claim-primary]')!);
    await waitFor(() => expect(q('[data-loc]')!.textContent).toContain('/business/create'));
    expect(q('[data-loc]')!.textContent).toContain('clubId=club-1');
    expect(q('[data-loc]')!.textContent).toContain('sourceCourseId=c1');
    expect(db.tracked.some((c) => c.event === 'claim_sheet_setup_profile')).toBe(true);
  });
});

describe('claim sheet rebuild — no-profile and signed-out states', () => {
  it('no Golf Club profile: setup button goes to the create URL', async () => {
    db.memberships = [];
    mount();
    await waitFor(() => expect(q('[data-claim-primary]')).not.toBeNull());
    expect(q('[data-claim-profile-card]')).toBeNull();
    fireEvent.click(q('[data-claim-primary]')!);
    await waitFor(() => expect(q('[data-loc]')!.textContent).toContain('/business/create'));
  });

  it('signed out: sign-in button goes to /auth and no step is done', async () => {
    db.user = null;
    mount();
    await waitFor(() => expect(q('[data-claim-primary]')).not.toBeNull());
    expect(qa('[data-claim-step]')[0].getAttribute('data-claim-step')).toBe('todo');
    fireEvent.click(q('[data-claim-primary]')!);
    await waitFor(() => expect(q('[data-loc]')!.textContent).toBe('/auth'));
    expect(db.tracked.find((c) => c.event === 'claim_sheet_open')!.props).toMatchObject({ state: 'signed_out' });
  });
});

describe('claim sheet rebuild — proof panel', () => {
  it('is hidden when nothing has data', async () => {
    db.rounds = 0; db.photos = 0; db.unanswered = 0; db.sample = []; db.holes = [];
    mount();
    await waitFor(() => expect(q('[data-claim-gains]')).not.toBeNull());
    expect(q('[data-claim-panel]')).toBeNull();
  });

  it('shows EARLY DATA under 10 rounds and LIVE at 10 or more', async () => {
    db.rounds = 9;
    const first = mount();
    await waitFor(() => expect(q('[data-claim-panel-state]')).not.toBeNull());
    expect(q('[data-claim-panel-state]')!.getAttribute('data-claim-panel-state')).toBe('early');
    first.unmount();
    db.rounds = 10;
    mount();
    await waitFor(() => expect(q('[data-claim-panel-state]')!.getAttribute('data-claim-panel-state')).toBe('live'));
  });

  it('hides the hole strip under 9 holes', async () => {
    db.holes = HOLES18.slice(0, 9);
    mount();
    await waitFor(() => expect(q('[data-claim-hole-strip]')).not.toBeNull());
    cleanup();
    db.holes = HOLES18.slice(0, 8);
    mount();
    await waitFor(() => expect(q('[data-claim-panel]')).not.toBeNull());
    expect(q('[data-claim-hole-strip]')).toBeNull();
  });

  it('highlights and names the hardest hole, with no stroke index wording', async () => {
    db.holes = HOLES18;
    mount();
    await waitFor(() => expect(q('[data-claim-bar="hardest"]')).not.toBeNull());
    const bars = qa('[data-claim-hole-strip] > div');
    expect(bars).toHaveLength(18);
    expect(bars[6].getAttribute('data-claim-bar')).toBe('hardest');
    expect((bars[6] as HTMLElement).style.background).toBe('rgb(248, 250, 252)');
    const panel = q('[data-claim-panel]')!;
    expect(panel.textContent).toContain('7th');
    expect(panel.textContent).toContain('+0.92');
    expect(panel.textContent!.toLowerCase()).not.toContain('stroke index');
  });

  it('unanswered row: hidden at 0, present at 1 and above 1', async () => {
    db.unanswered = 0;
    mount();
    await waitFor(() => expect(q('[data-claim-panel]')).not.toBeNull());
    expect(q('[data-claim-unanswered]')).toBeNull();
    cleanup();
    db.unanswered = 1;
    mount();
    await waitFor(() => expect(q('[data-claim-unanswered]')).not.toBeNull());
    cleanup();
    db.unanswered = 4;
    mount();
    await waitFor(() => expect(q('[data-claim-unanswered]')).not.toBeNull());
  });
});
