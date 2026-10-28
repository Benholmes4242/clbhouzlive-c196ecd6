import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * BC2 — Create-a-business step 2. The supabase client is mocked with a
 * filter-aware chainable (eq/ilike/in/limit/maybeSingle) so the real hooks
 * (useClubSearch, useNearbyCourseStats) and the branch guard effects run
 * against fixture tables. Heavy modals and the address autocomplete are
 * stubbed at their export surface; CountrySelector stays real.
 */
const s = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  tables: {} as Record<string, Record<string, unknown>[]>,
  rpcs: {} as Record<string, unknown>,
  fetchClub: vi.fn(),
}));

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

vi.mock('@/integrations/supabase/client', () => {
  class Builder {
    private filters: ((r: Record<string, unknown>) => boolean)[] = [];
    private lim: number | null = null;
    private singleMode = false;
    constructor(private table: string) {}
    select() { return this; }
    eq(col: string, val: unknown) { this.filters.push(r => r[col] === val); return this; }
    in(col: string, vals: unknown[]) { this.filters.push(r => vals.includes(r[col])); return this; }
    ilike(col: string, pat: string) {
      const re = new RegExp('^' + pat.split('%').map(esc).join('.*') + '$', 'i');
      this.filters.push(r => re.test(String(r[col] ?? '')));
      return this;
    }
    order() { return this; }
    limit(n: number) { this.lim = n; return this; }
    maybeSingle() { this.singleMode = true; return this; }
    single() { this.singleMode = true; return this; }
    private rows() {
      let out = (s.tables[this.table] ?? []).filter(r => this.filters.every(f => f(r)));
      if (this.lim != null) out = out.slice(0, this.lim);
      return out;
    }
    then(onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) {
      const rows = this.rows();
      const payload = this.singleMode ? { data: rows[0] ?? null, error: null } : { data: rows, error: null };
      return Promise.resolve(payload).then(onFulfilled);
    }
  }
  return {
    supabase: {
      from: (t: string) => new Builder(t),
      rpc: (n: string, args: unknown) => {
        const v = s.rpcs[n];
        if (v instanceof Error) return Promise.resolve({ data: null, error: v });
        return Promise.resolve({ data: typeof v === 'function' ? (v as (a: unknown) => unknown)(args) : v ?? [], error: null });
      },
    },
  };
});

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: s.user, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/features/business/claimClub', () => ({
  fetchGolfClub: s.fetchClub,
  clubRowToSelected: (row: Record<string, unknown>) => ({ ...row }),
}));
vi.mock('@/components/business/RequestClubModal', async () => {
  const { createElement: h } = await import('react');
  return { RequestClubModal: (p: { open: boolean; initialName?: string }) => (p.open ? h('div', { 'data-testid': 'request-club-modal', 'data-initial': p.initialName ?? '' }) : null) };
});
vi.mock('@/components/business/RequestAccessModal', async () => {
  const { createElement: h } = await import('react');
  return { RequestAccessModal: (p: { open: boolean; businessId: string; businessName: string }) => (p.open ? h('div', { 'data-testid': 'request-access-modal', 'data-business-id': p.businessId, 'data-business-name': p.businessName }) : null) };
});
vi.mock('@/components/business/PinDropModal', async () => {
  const { createElement: h } = await import('react');
  return {
    PinDropModal: (p: { open: boolean; onConfirm: (v: unknown) => void }) =>
      p.open
        ? h('button', { type: 'button', 'data-testid': 'pin-drop-modal', onClick: () => p.onConfirm({ label: 'Dropped pin', lat: 51.4, lng: 0.02, precision: 'pin' }) })
        : null,
  };
});
vi.mock('@/components/business/AddressAutocomplete', async () => {
  const { createElement: h } = await import('react');
  return {
    dbLocationPrecision: (p: string | null | undefined) => p ?? null,
    AddressAutocomplete: (p: { value: { label: string } | null; onChange: (v: unknown) => void; countryCode: string; disabled?: boolean }) =>
      h('div', { 'data-testid': 'address-autocomplete', 'data-country': p.countryCode, 'data-disabled': (p.disabled || !p.countryCode) ? 'true' : 'false' },
        p.value ? h('span', { 'data-testid': 'address-value' }, p.value.label) : null,
        h('button', { type: 'button', 'data-testid': 'address-pick', onClick: () => p.onChange({ label: 'Hayes Lane, Bromley BR2', lat: 51.376, lng: 0.015, precision: 'address', countryCode: p.countryCode }) }),
      ),
  };
});

import BusinessCreate from '@/pages/BusinessCreate';

const CLUB = { id: 'c1', name: 'Sundridge Park Golf Club', country: 'United Kingdom', region: 'Kent', sub_country: 'Bromley', continent: 'Europe', club_key: 'sundridgeparkgolfclub', latitude: 51.4, longitude: 0.02 };

function renderAt(entries: (string | { pathname: string; search?: string; state?: unknown })[], index?: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={entries} initialIndex={index}>
        <Routes>
          <Route path="/business/create-v2" element={<BusinessCreate />} />
          <Route path="/auth" element={<p>auth page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Step 1 → pick category → Continue. */
function toStep2(category: string) {
  fireEvent.click(document.querySelector(`[data-value="${category}"]`) as HTMLButtonElement);
  fireEvent.click(screen.getByTestId('bizc-continue'));
}

const clubSearchInput = () => screen.getByTestId('bizc-club-search').querySelector('input') as HTMLInputElement;

afterEach(() => {
  cleanup();
  s.user = { id: 'me' };
  s.tables = {};
  s.rpcs = {};
  s.fetchClub.mockReset();
});

describe('BC2 club branch', () => {
  it('searches, lists results and picking shows the club card', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['golf_courses'] = [
      { id: 'co1', name: 'Sundridge Park (East)', thumbnail_image: 'https://img/east.jpg', club_id: 'c1' },
      { id: 'co2', name: 'Sundridge Park (West)', thumbnail_image: null, club_id: 'c1' },
    ];
    s.rpcs['get_course_stats_batch'] = (a: { p_course_ids: string[] }) =>
      a.p_course_ids.map(id => ({ course_id: id, rounds_tracked: id === 'co1' ? 1000 : 200, avg_over_par: id === 'co1' ? 15 : 12, hardest_hole_no: 7 }));
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    expect(screen.getByTestId('bizc-step-2').getAttribute('data-branch')).toBe('club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    expect(screen.getByText('Sundridge Park Golf Club')).toBeTruthy();
    expect(screen.getByText('Bromley, Kent')).toBeTruthy();
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    expect(screen.queryByTestId('bizc-club-results')).toBeNull();
    const card = await screen.findByTestId('bizc-club-card');
    expect(clubSearchInput().value).toBe('Sundridge Park Golf Club');
    expect(card.querySelector('img')?.getAttribute('src')).toBe('https://img/east.jpg');
    expect(card.textContent).toContain('Bromley, Kent · 2 courses');
    const facts = await screen.findByTestId('bizc-club-facts');
    // rounds-weighted: (15*1000 + 12*200) / 1200 = 14.5
    expect(facts.textContent).toContain('1,200');
    expect(facts.textContent).toContain('+14.5');
    expect(facts.textContent).toContain('Courses');
    expect((screen.getByTestId('bizc-claim') as HTMLButtonElement).disabled).toBe(false);
  });

  it('a single-course club shows its hardest hole in the third slot', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['golf_courses'] = [{ id: 'co1', name: 'Sundridge Park', thumbnail_image: null, club_id: 'c1' }];
    s.rpcs['get_course_stats_batch'] = [{ course_id: 'co1', rounds_tracked: 50, avg_over_par: 14.6, hardest_hole_no: 7 }];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    const facts = await screen.findByTestId('bizc-club-facts');
    expect(facts.textContent).toContain('7th');
    expect(facts.textContent).toContain('Hardest');
    expect(screen.getByTestId('bizc-club-card').textContent).not.toContain('courses');
  });

  it('below the visibility rule the facts row becomes the no-rounds line', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['golf_courses'] = [{ id: 'co1', name: 'Sundridge Park', thumbnail_image: null, club_id: 'c1' }];
    s.rpcs['get_course_stats_batch'] = [{ course_id: 'co1', rounds_tracked: 2, avg_over_par: 15, hardest_hole_no: 7 }];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await waitFor(() => expect(screen.getByText('No rounds tracked here yet.')).toBeTruthy());
    expect(screen.queryByTestId('bizc-club-facts')).toBeNull();
  });

  it('a failed stats read shows the card without the facts row', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['golf_courses'] = [{ id: 'co1', name: 'Sundridge Park', thumbnail_image: null, club_id: 'c1' }];
    s.rpcs['get_course_stats_batch'] = new Error('boom');
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-club-card');
    await waitFor(() => expect(screen.queryByTestId('bizc-club-facts')).toBeNull());
    expect(screen.queryByText('No rounds tracked here yet.')).toBeNull();
  });

  it("Can't find your club opens the request sheet with the typed text", async () => {
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Nowhere' } });
    const link = await screen.findByText("Can't find your club? Tell us ›");
    fireEvent.click(link);
    expect(screen.getByTestId('request-club-modal').getAttribute('data-initial')).toBe('Nowhere');
  });

  it('duplicate club shows the note and Request access never advances', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['business_accounts'] = [{ id: 'b1', name: 'Sundridge Park', club_key: 'sundridgeparkgolfclub', is_deleted: false }];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-note-existing');
    expect(screen.getByTestId('bizc-note-existing').textContent).toContain('Sundridge Park Golf Club is already on clbhouz.');
    expect(screen.queryByTestId('bizc-proof')).toBeNull();
    expect(screen.queryByTestId('bizc-claim')).toBeNull();
    fireEvent.click(screen.getByTestId('bizc-request-access'));
    expect(screen.getByTestId('request-access-modal').getAttribute('data-business-id')).toBe('b1');
    expect(screen.queryByTestId('bizc-step-3')).toBeNull();
  });

  it('an open claim shows the note and disables Claim this club', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['course_claim_requests'] = [{ id: 'r1', club_id: 'c1', status: 'pending' }];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-note-pending');
    expect((screen.getByTestId('bizc-claim') as HTMLButtonElement).disabled).toBe(true);
  });

  it('Not my club clears the club, the note and the prefilled address', async () => {
    s.tables['golf_clubs'] = [CLUB];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    const proof = await screen.findByTestId('bizc-proof');
    fireEvent.change(proof.querySelector('textarea')!, { target: { value: 'I am the GM' } });
    fireEvent.click(screen.getByText('Not my club'));
    expect(screen.queryByTestId('bizc-club-card')).toBeNull();
    expect(screen.queryByTestId('bizc-proof')).toBeNull();
    expect(clubSearchInput().value).toBe('');
  });

  it('?clubId= lands in the picked state', async () => {
    s.fetchClub.mockResolvedValue(CLUB);
    s.tables['golf_courses'] = [{ id: 'co1', name: 'Sundridge Park', thumbnail_image: null, club_id: 'c1' }];
    s.rpcs['get_course_stats_batch'] = [{ course_id: 'co1', rounds_tracked: 50, avg_over_par: 14.6, hardest_hole_no: 7 }];
    renderAt(['/business/create-v2?clubId=c1']);
    await waitFor(() => expect(s.fetchClub).toHaveBeenCalledWith('c1'));
    fireEvent.click(screen.getByTestId('bizc-continue'));
    await screen.findByTestId('bizc-club-card');
    expect(clubSearchInput().value).toBe('Sundridge Park Golf Club');
  });

  it('the proof note is capped at 500 and stored in the draft', async () => {
    s.tables['golf_clubs'] = [CLUB];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    const textarea = (await screen.findByTestId('bizc-proof')).querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('maxlength')).toBe('500');
    fireEvent.change(textarea, { target: { value: 'I am the general manager' } });
    expect(textarea.value).toBe('I am the general manager');
  });
});

describe('BC2 college branch', () => {
  const COLLEGE = { id: 'u1', college_name: 'University of Stirling', normalized_name: 'university of stirling', logo_url: null, country: 'Scotland' };

  it('pick shows the college card', async () => {
    s.tables['college_media'] = [COLLEGE];
    renderAt(['/business/create-v2']);
    toStep2('University / College');
    expect(screen.getByTestId('bizc-step-2').getAttribute('data-branch')).toBe('college');
    fireEvent.change(screen.getByTestId('bizc-college-search').querySelector('input')!, { target: { value: 'Stirling' } });
    await waitFor(() => expect(screen.getByTestId('bizc-college-results')).toBeTruthy());
    fireEvent.click(screen.getByText('University of Stirling'));
    const card = await screen.findByTestId('bizc-college-card');
    expect(card.textContent).toContain('University of Stirling');
    expect(card.textContent).toContain('Scotland');
    expect(card.textContent).toContain('US');
    expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false);
  });

  it('duplicate college shows the note with Request access', async () => {
    s.tables['college_media'] = [COLLEGE];
    s.tables['business_accounts'] = [{ id: 'b9', name: 'University of Stirling', category: 'University / College', is_deleted: false }];
    renderAt(['/business/create-v2']);
    toStep2('University / College');
    fireEvent.change(screen.getByTestId('bizc-college-search').querySelector('input')!, { target: { value: 'Stirling' } });
    await waitFor(() => expect(screen.getByTestId('bizc-college-results')).toBeTruthy());
    fireEvent.click(screen.getByText('University of Stirling'));
    await screen.findByTestId('bizc-note-existing');
    fireEvent.click(screen.getByTestId('bizc-request-access'));
    expect(screen.getByTestId('request-access-modal').getAttribute('data-business-id')).toBe('b9');
    expect(screen.queryByTestId('bizc-step-3')).toBeNull();
  });
});

describe('BC2 everyone-else branch', () => {
  it('a name match shows the note and blocks Continue until dismissed', async () => {
    s.tables['business_accounts'] = [{ id: 'b2', name: 'Kestrel Golf Academy', category: 'Golf Academy', logo_url: null, city: 'Bromley', country: 'United Kingdom', is_deleted: false }];
    renderAt(['/business/create-v2']);
    toStep2('Driving Range');
    expect(screen.getByTestId('bizc-step-2').getAttribute('data-branch')).toBe('other');
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input')!, { target: { value: 'kestrel golf academy' } });
    const note = await screen.findByTestId('bizc-name-match');
    expect(note.textContent).toContain('Kestrel Golf Academy is already on clbhouz.');
    expect(note.textContent).toContain('Golf Academy · Bromley, United Kingdom');
    expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText("That's a different business"));
    expect(screen.queryByTestId('bizc-name-match')).toBeNull();
    expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false);
  });

  it('Request access from the name note opens the existing sheet', async () => {
    s.tables['business_accounts'] = [{ id: 'b2', name: 'Kestrel Golf Academy', category: 'Golf Academy', logo_url: null, city: 'Bromley', country: 'United Kingdom', is_deleted: false }];
    renderAt(['/business/create-v2']);
    toStep2('Driving Range');
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input')!, { target: { value: 'Kestrel Golf Academy' } });
    await screen.findByTestId('bizc-name-match');
    fireEvent.click(screen.getByText('Request access'));
    expect(screen.getByTestId('request-access-modal').getAttribute('data-business-id')).toBe('b2');
  });

  it('no match shows the tick line; Continue needs only a name', async () => {
    renderAt(['/business/create-v2']);
    toStep2('Retailer / Pro Shop');
    const cont = screen.getByTestId('bizc-continue-2') as HTMLButtonElement;
    expect(cont.disabled).toBe(true);
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input')!, { target: { value: 'Unique Golf Shop' } });
    await screen.findByTestId('bizc-name-ok');
    expect(cont.disabled).toBe(false);
  });

  it('the country defaults from the profile and the address waits without one', async () => {
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('United Kingdom'));
    expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB');
    cleanup();
    s.tables['user_profiles'] = [{ id: 'me', country: null }];
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('Choose a country'));
    expect(screen.getByTestId('address-autocomplete').getAttribute('data-disabled')).toBe('true');
  });

  it('Change opens the country picker and Drop a pin opens the pin sheet', async () => {
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('United Kingdom'));
    fireEvent.click(screen.getByText('Change'));
    expect(screen.getByTestId('bizc-country-picker')).toBeTruthy();
    fireEvent.click(screen.getByText('Drop a pin'));
    expect(screen.getByTestId('pin-drop-modal')).toBeTruthy();
  });

  it('the area card appears with figures once the address has coordinates', async () => {
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    s.rpcs['get_nearby_courses'] = [
      { course_id: 'n1', course_name: 'Near One', distance_km: 1.9 },
      { course_id: 'n2', course_name: 'Near Two', distance_km: 5.5 },
      { course_id: 'n1', course_name: 'Near One', distance_km: 1.9 },
    ];
    s.rpcs['get_course_stats_batch'] = (a: { p_course_ids: string[] }) =>
      a.p_course_ids.map(id => ({ course_id: id, rounds_tracked: id === 'n1' ? 4000 : 120 }));
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
    fireEvent.click(screen.getByTestId('address-pick'));
    const card = await screen.findByTestId('bizc-area-card');
    expect(screen.getByTestId('bizc-area-headline').textContent).toBe('2 courses within 10 miles, with 4,120 rounds tracked.');
    expect(card.textContent).toContain('1.2 mi');
    expect(card.textContent).toContain('4,120');
  });

  it('a failed stats read keeps the card with — rounds and no rounds clause', async () => {
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    s.rpcs['get_nearby_courses'] = [{ course_id: 'n1', course_name: 'Near One', distance_km: 1.9 }];
    s.rpcs['get_course_stats_batch'] = new Error('boom');
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
    fireEvent.click(screen.getByTestId('address-pick'));
    const card = await screen.findByTestId('bizc-area-card');
    expect(screen.getByTestId('bizc-area-headline').textContent).toBe('1 courses within 10 miles.');
    expect(card.textContent).toContain('—');
  });

  it('zero courses or a failed nearby read means no card', async () => {
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    s.rpcs['get_nearby_courses'] = [];
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
    fireEvent.click(screen.getByTestId('address-pick'));
    await waitFor(() => expect(screen.getByTestId('address-value')).toBeTruthy());
    expect(screen.queryByTestId('bizc-area-card')).toBeNull();
    cleanup();
    s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
    s.rpcs['get_nearby_courses'] = new Error('boom');
    renderAt(['/business/create-v2']);
    toStep2('Creator');
    await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
    fireEvent.click(screen.getByTestId('address-pick'));
    await waitFor(() => expect(screen.getByTestId('address-value')).toBeTruthy());
    expect(screen.queryByTestId('bizc-area-card')).toBeNull();
  });
});

describe('BC2 history and draft keeping', () => {
  it('Continue reaches the step 3 placeholder; back returns to step 2 with everything kept', async () => {
    s.tables['golf_clubs'] = [CLUB];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-club-card');
    fireEvent.click(screen.getByTestId('bizc-claim'));
    await screen.findByTestId('bizc-step-3');
    expect(screen.getByTestId('bizc-progress').querySelectorAll('i[data-complete="true"]').length).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByTestId('bizc-club-card');
    expect(clubSearchInput().value).toBe('Sundridge Park Golf Club');
  });

  it('back from step 2 to step 1 keeps the category', async () => {
    renderAt(['/business/create-v2']);
    toStep2('Driving Range');
    await screen.findByTestId('bizc-step-2');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect((document.querySelector('[data-value="Driving Range"]') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true'));
  });

  it('changing the category clears the step 2 fields of the old branch', async () => {
    s.tables['golf_clubs'] = [CLUB];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(clubSearchInput(), { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-club-card');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(document.querySelector('[data-value="Driving Range"]')).toBeTruthy());
    fireEvent.click(document.querySelector('[data-value="Driving Range"]') as HTMLButtonElement);
    fireEvent.click(screen.getByTestId('bizc-continue'));
    await screen.findByTestId('bizc-step-2');
    expect((screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(document.querySelector('[data-value="Driving Range"]')).toBeTruthy());
    fireEvent.click(document.querySelector('[data-value="Golf Club"]') as HTMLButtonElement);
    fireEvent.click(screen.getByTestId('bizc-continue'));
    await screen.findByTestId('bizc-step-2');
    expect(clubSearchInput().value).toBe('');
    expect(screen.queryByTestId('bizc-club-card')).toBeNull();
  });
});
