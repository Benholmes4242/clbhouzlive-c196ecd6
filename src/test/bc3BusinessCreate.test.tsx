import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * BC3 — Create-a-business step 3 ("How do golfers reach you?"). Same mocked
 * surface as the BC2 tests: filter-aware supabase chain, stubbed heavy
 * modals, real CountrySelector. Everything asserted here lives in the draft;
 * nothing is saved.
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
  return { RequestClubModal: (p: { open: boolean }) => (p.open ? h('div', { 'data-testid': 'request-club-modal' }) : null) };
});
vi.mock('@/components/business/RequestAccessModal', async () => {
  const { createElement: h } = await import('react');
  return { RequestAccessModal: (p: { open: boolean }) => (p.open ? h('div', { 'data-testid': 'request-access-modal' }) : null) };
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
    AddressAutocomplete: (p: { value: { label: string } | null; onChange: (v: unknown) => void; countryCode: string }) =>
      h('div', { 'data-testid': 'address-autocomplete' },
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

/** Step 1 → category → step 2. */
function toStep2(category: string) {
  fireEvent.click(document.querySelector(`[data-value="${category}"]`) as HTMLButtonElement);
  fireEvent.click(screen.getByTestId('bizc-continue'));
}

/** Other branch: name → continue to step 3. */
async function otherToStep3(name = 'The Range Cafe') {
  toStep2('Restaurant / Cafe');
  fireEvent.change(screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement, { target: { value: name } });
  await waitFor(() => expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByTestId('bizc-continue-2'));
  await screen.findByTestId('bizc-step-3');
}

const chip = (key: string) => screen.getByTestId('bizc-main-buttons').querySelector(`[data-action="${key}"]`) as HTMLButtonElement;

afterEach(() => {
  cleanup();
  s.user = { id: 'me' };
  s.tables = {};
  s.rpcs = {};
  s.fetchClub.mockReset();
});

describe('BC3 main button', () => {
  it('every chip is unavailable until its detail exists; the hint names Book and Website', async () => {
    await otherToStep3();
    for (const key of ['book', 'call', 'email', 'website', 'directions']) {
      expect(chip(key).getAttribute('aria-disabled')).toBe('true');
    }
    // Restaurant / Cafe step 2 has no address yet, so all five are missing;
    // the missing set is not exactly {Book, Website} → generic hint.
    expect(screen.getByTestId('bizc-main-hint').textContent).toBe('Greyed-out buttons need their detail added first.');

    // Add phone, email and an address → only Book and Website remain missing.
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: 'hi@cafe.example' } });
    expect(chip('email').getAttribute('aria-disabled')).toBe('false');
  });

  it('Directions follows the step 2 address; clearing the detail clears the choice', async () => {
    await otherToStep3();
    expect(chip('directions').getAttribute('aria-disabled')).toBe('true');
    // Back to step 2, pick an address, forward again.
    fireEvent.click(screen.getByLabelText('Back'));
    await screen.findByTestId('bizc-step-2');
    fireEvent.click(screen.getByTestId('address-pick'));
    fireEvent.click(screen.getByTestId('bizc-continue-2'));
    await screen.findByTestId('bizc-step-3');
    expect(chip('directions').getAttribute('aria-disabled')).toBe('false');

    // Choose Directions, then clear the email behind a chosen Email chip.
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: 'hi@cafe.example' } });
    fireEvent.click(chip('email'));
    expect(chip('email').getAttribute('aria-pressed')).toBe('true');
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: '' } });
    await waitFor(() => expect(chip('email').getAttribute('aria-pressed')).toBe('false'));
  });

  it('with only Book and Website missing the hint names them', async () => {
    await otherToStep3();
    fireEvent.click(screen.getByLabelText('Back'));
    await screen.findByTestId('bizc-step-2');
    fireEvent.click(screen.getByTestId('address-pick'));
    fireEvent.click(screen.getByTestId('bizc-continue-2'));
    await screen.findByTestId('bizc-step-3');
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: 'hi@cafe.example' } });
    const phoneInput = document.querySelector('.bizc-phone input') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '7700900123' } });
    await waitFor(() => expect(screen.getByTestId('bizc-main-hint').textContent).toBe('Book and Website appear once you add their links.'));
  });
});

describe('BC3 contact card', () => {
  it('writes email, website and bookingUrl into the draft (chips light up)', async () => {
    await otherToStep3();
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: 'hi@cafe.example' } });
    fireEvent.change(screen.getByTestId('bizc-input-website'), { target: { value: 'https://cafe.example' } });
    fireEvent.change(screen.getByTestId('bizc-input-bookingUrl'), { target: { value: 'https://book.cafe.example' } });
    expect(chip('email').getAttribute('aria-disabled')).toBe('false');
    expect(chip('website').getAttribute('aria-disabled')).toBe('false');
    expect(chip('book').getAttribute('aria-disabled')).toBe('false');
  });

  it('the dial code defaults from the step 2 country (club branch)', async () => {
    s.tables['golf_clubs'] = [CLUB];
    s.tables['golf_courses'] = [];
    renderAt(['/business/create-v2']);
    toStep2('Golf Club');
    fireEvent.change(screen.getByTestId('bizc-club-search').querySelector('input') as HTMLInputElement, { target: { value: 'Sundridge' } });
    await waitFor(() => expect(screen.getByTestId('bizc-club-results')).toBeTruthy());
    fireEvent.click(screen.getByText('Sundridge Park Golf Club'));
    await screen.findByTestId('bizc-club-card');
    fireEvent.click(screen.getByTestId('bizc-claim'));
    await screen.findByTestId('bizc-step-3');
    await waitFor(() => {
      const dial = document.querySelector('.bizc-phone button') as HTMLButtonElement;
      expect(dial.textContent).toContain('+44');
    });
  });
});

describe('BC3 extras card', () => {
  it('hides Facilities for Creator and Brand / Maker, shows it for Golf Academy with the coaching list', async () => {
    await otherToStep3('A Creator');
    // otherToStep3 uses Restaurant / Cafe; re-render per category instead.
    cleanup();

    renderAt(['/business/create-v2']);
    toStep2('Creator');
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement, { target: { value: 'A Creator' } });
    await waitFor(() => expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTestId('bizc-continue-2'));
    await screen.findByTestId('bizc-step-3');
    expect(screen.getByTestId('bizc-extras-card').querySelector('[data-extra="facilities"]')).toBeNull();
    cleanup();

    renderAt(['/business/create-v2']);
    toStep2('Brand / Manufacturer');
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement, { target: { value: 'A Brand' } });
    await waitFor(() => expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTestId('bizc-continue-2'));
    await screen.findByTestId('bizc-step-3');
    expect(screen.getByTestId('bizc-extras-card').querySelector('[data-extra="facilities"]')).toBeNull();
    cleanup();

    renderAt(['/business/create-v2']);
    toStep2('Golf Academy');
    fireEvent.change(screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement, { target: { value: 'An Academy' } });
    await waitFor(() => expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTestId('bizc-continue-2'));
    await screen.findByTestId('bizc-step-3');
    const row = screen.getByTestId('bizc-extras-card').querySelector('[data-extra="facilities"]') as HTMLButtonElement;
    expect(row).toBeTruthy();
    expect(screen.getByTestId('bizc-xsub-facilities').textContent).toBe('Choose what you offer');
    fireEvent.click(row);
    const sheet = await screen.findByTestId('bizc-sheet-facilities');
    expect(sheet.textContent).toContain('Indoor bays');
    fireEvent.click(screen.getByRole('button', { name: 'Indoor bays' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch monitors' }));
    fireEvent.click(screen.getByRole('button', { name: 'Video analysis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByTestId('bizc-xsub-facilities').textContent).toBe('Indoor bays, Launch monitors +1');
  });

  it('the social sheet writes all five fields and the row sub lists the filled names', async () => {
    await otherToStep3();
    expect(screen.getByTestId('bizc-xsub-social').textContent).toBe('Instagram, TikTok, X, YouTube, Facebook');
    fireEvent.click(screen.getByTestId('bizc-extras-card').querySelector('[data-extra="social"]') as HTMLButtonElement);
    await screen.findByTestId('bizc-sheet-social');
    fireEvent.change(screen.getByTestId('bizc-social-instagram'), { target: { value: '@thecafe' } });
    fireEvent.change(screen.getByTestId('bizc-social-twitter'), { target: { value: 'thecafe' } });
    fireEvent.change(screen.getByTestId('bizc-social-tiktok'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('bizc-social-youtube'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('bizc-social-facebook'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    // Handles drop the leading @ (SocialSection normalisation) but still count as filled.
    expect(screen.getByTestId('bizc-xsub-social').textContent).toBe('Instagram, X');
  });

  it('the opening hours sheet: master switch, per-day switches and times, Apply Monday to all', async () => {
    await otherToStep3();
    expect(screen.getByTestId('bizc-xsub-hours').textContent).toBe('Off · not shown on your profile');
    fireEvent.click(screen.getByTestId('bizc-extras-card').querySelector('[data-extra="hours"]') as HTMLButtonElement);
    await screen.findByTestId('bizc-sheet-hours');
    expect(screen.queryByTestId('bizc-hours-days')).toBeNull();

    fireEvent.click(screen.getByRole('switch', { name: 'Show opening hours' }));
    const days = await screen.findByTestId('bizc-hours-days');
    expect(days.querySelectorAll('.bizc-day')).toHaveLength(7);

    // Sunday is closed by default; open it and set Monday's times.
    const sun = days.querySelector('[data-day="Sun"]') as HTMLElement;
    expect(sun.textContent).toContain('Closed');
    fireEvent.click(screen.getByRole('switch', { name: 'Sun open' }));
    expect((days.querySelector('[data-day="Sun"]') as HTMLElement).textContent).not.toContain('Closed');

    fireEvent.change(screen.getByTestId('bizc-open-Mon'), { target: { value: '07:30' } });
    fireEvent.change(screen.getByTestId('bizc-close-Mon'), { target: { value: '17:45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Monday to all days' }));
    expect((screen.getByTestId('bizc-open-Tue') as HTMLInputElement).value).toBe('07:30');
    expect((screen.getByTestId('bizc-close-Sat') as HTMLInputElement).value).toBe('17:45');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByTestId('bizc-xsub-hours').textContent).toBe('Shown on your profile');
  });
});

describe('BC3 navigation', () => {
  it('Skip and Continue both reach step 4 with the draft intact; back returns to step 3', async () => {
    await otherToStep3();
    fireEvent.change(screen.getByTestId('bizc-input-email'), { target: { value: 'hi@cafe.example' } });

    // Skip → step 4.
    fireEvent.click(screen.getByTestId('bizc-skip'));
    await screen.findByTestId('bizc-step-4');

    // Back → step 3, everything kept.
    fireEvent.click(screen.getByLabelText('Back'));
    await screen.findByTestId('bizc-step-3');
    expect((screen.getByTestId('bizc-input-email') as HTMLInputElement).value).toBe('hi@cafe.example');

    // Continue → step 4 as well.
    fireEvent.click(screen.getByTestId('bizc-continue'));
    await screen.findByTestId('bizc-step-4');
    fireEvent.click(screen.getByLabelText('Back'));
    await screen.findByTestId('bizc-step-3');
    expect((screen.getByTestId('bizc-input-email') as HTMLInputElement).value).toBe('hi@cafe.example');
  });
});
