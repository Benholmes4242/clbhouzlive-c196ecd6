import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { BUSINESS_CATEGORIES } from '@/constants/businessCategories';
import { CREATE_CATEGORY_TILES } from '@/features/business-create/createRules';
import { resolveChrome } from '@/features/chrome-v2/registry';

const s = vi.hoisted(() => ({ user: { id: 'me' } as { id: string } | null, fetchClub: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: s.user, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/features/business/claimClub', () => ({
  fetchGolfClub: s.fetchClub,
  clubRowToSelected: (row: { id: string; name: string }) => ({ id: row.id, name: row.name }),
}));

import BusinessCreate from '@/pages/BusinessCreate';

function renderAt(entries: (string | { pathname: string; search?: string })[], index?: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={entries} initialIndex={index}>
        <Routes>
          <Route path="/business/create-v2" element={<BusinessCreate />} />
          <Route path="/auth" element={<p>auth page</p>} />
          <Route path="/profile" element={<p>profile page</p>} />
          <Route path="/before" element={<p>before page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const tile = (value: string) => document.querySelector(`[data-value="${value}"]`) as HTMLButtonElement;
const cont = () => screen.getByTestId('bizc-continue') as HTMLButtonElement;

afterEach(() => { cleanup(); s.user = { id: 'me' }; s.fetchClub.mockReset(); });

describe('BC1 route and chrome', () => {
  it('renders signed in and redirects signed out', () => {
    renderAt(['/business/create-v2']);
    expect(screen.getByTestId('business-create')).toBeTruthy();
    cleanup();
    s.user = null;
    renderAt(['/business/create-v2']);
    expect(screen.getByText('auth page')).toBeTruthy();
  });
  it('hides chrome islands and bottom nav on /business/create-v2', () => {
    expect(resolveChrome('/business/create-v2', new URLSearchParams())).toMatchObject({ chrome: 'none', tone: 'dark', bleed: false });
    const nav = readFileSync('src/components/GlobalBottomNavigation.tsx', 'utf8');
    const hidden = nav.slice(nav.indexOf('const HIDDEN_ROUTES'), nav.indexOf('const HIDDEN_ROUTE_PREFIXES'));
    expect(hidden).toContain("'/business/create-v2'");
  });
  it('/business/create still renders the current BusinessProfileEditor', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toMatch(/path="\/business\/create" element=\{<Suspense fallback=\{<ManagePageSkeleton \/>\}><BusinessProfileEditor \/>/);
    expect(app).toMatch(/path="\/business\/create-v2" element=\{<Suspense fallback=\{null\}><BusinessCreatePage \/>/);
  });
});

describe('BC1 step 1 selection', () => {
  it('arrives with nothing chosen; selecting enables Continue and moves', () => {
    renderAt(['/business/create-v2']);
    expect(document.querySelectorAll('.bizc-tile[aria-pressed="true"]').length).toBe(0);
    expect(cont().disabled).toBe(true);
    fireEvent.click(tile('Resort'));
    expect(tile('Resort').getAttribute('aria-pressed')).toBe('true');
    expect(cont().disabled).toBe(false);
    fireEvent.click(tile('Bar / Pub'));
    expect(tile('Resort').getAttribute('aria-pressed')).toBe('false');
    expect(tile('Bar / Pub').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.bizc-tile[aria-pressed="true"]').length).toBe(1);
  });
  it('maps every stored value to BUSINESS_CATEGORIES exactly once', () => {
    const values = CREATE_CATEGORY_TILES.map(t => t.value);
    expect(values.length).toBe(BUSINESS_CATEGORIES.length);
    expect([...values].sort()).toEqual([...BUSINESS_CATEGORIES].sort());
    for (const v of values) expect(BUSINESS_CATEGORIES).toContain(v);
  });
  it('the draft stores the value, not the display label', () => {
    renderAt(['/business/create-v2']);
    fireEvent.click(tile('Hotel / Accommodation'));
    expect(tile('Hotel / Accommodation').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-value="Hotel / Stay"]')).toBeNull();
  });
  it('?category=golf_club preselects Golf Club', () => {
    renderAt(['/business/create-v2?category=golf_club']);
    expect(tile('Golf Club').getAttribute('aria-pressed')).toBe('true');
    expect(s.fetchClub).not.toHaveBeenCalled();
  });
  it('?clubId= preselects Golf Club and reads the club by id', async () => {
    s.fetchClub.mockResolvedValue({ id: 'c1', name: 'Real Club' });
    renderAt(['/business/create-v2?clubId=c1']);
    expect(tile('Golf Club').getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(s.fetchClub).toHaveBeenCalledWith('c1'));
  });
});

describe('BC1 history', () => {
  it('Continue pushes a step; back returns with selection kept; back on step 1 leaves', async () => {
    renderAt(['/before', '/business/create-v2'], 1);
    fireEvent.click(tile('Creator'));
    fireEvent.click(cont());
    expect(screen.getByTestId('bizc-step-2')).toBeTruthy();
    expect(screen.getByTestId('bizc-chosen').textContent).toBe('Creator');
    expect(screen.getByTestId('bizc-progress').querySelectorAll('i[data-complete="true"]').length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(tile('Creator').getAttribute('aria-pressed')).toBe('true'));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByText('before page')).toBeTruthy());
  });
  it('back on step 1 with no history goes to /profile', async () => {
    renderAt(['/business/create-v2']);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByText('profile page')).toBeTruthy());
  });
});
