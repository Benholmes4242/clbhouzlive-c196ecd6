import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc, from } }));

const membership: BusinessMembership = {
  id: 'm-b1', role: 'owner', clubCourses: [],
  business: {
    id: 'b1', name: 'Hartwell', slug: null, category: 'Club Fitter', location: null, city: 'Leeds', region: null, country: 'England',
    logo_url: null, cover_image_url: 'c', description: 'd', lat: 1, lng: 2, website: 'w', social_links: { i: 'x' }, is_verified: false, is_deleted: false, club_id: null,
  },
} as BusinessMembership;

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'u1' }, loading: false }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useMyBusinesses: () => ({ data: [membership], isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'u1', name: 'Me' } }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessVerificationRequest', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBusinessVerificationRequest')>('@/hooks/useBusinessVerificationRequest');
  return { ...actual, useBusinessVerificationRequest: () => ({ data: null, isLoading: false }) };
});
vi.mock('@/hooks/useBusinessCourseClaim', () => ({ useBusinessCourseClaim: () => ({ data: null, isLoading: false }) }));
vi.mock('@/hooks/useBusinessPendingRequestsCount', () => ({ useBusinessPendingRequestsCount: () => ({ data: 0 }) }));
vi.mock('@/hooks/useBusinessAccessRequestsRealtime', () => ({ useBusinessAccessRequestsRealtime: () => {} }));
vi.mock('@/hooks/useBusinessReviews', () => ({ useBusinessReviews: () => ({ data: null }) }));
vi.mock('@/components/business/ClaimYourCourseSheet', () => ({ ClaimYourCourseSheet: () => null }));
vi.mock('@/components/business/DeleteBusinessDialog', () => ({ DeleteBusinessDialog: () => null }));
vi.mock('@/components/business/BusinessEmptyState', () => ({ BusinessEmptyState: () => null }));
vi.mock('@/components/manage/ManagePageShell', () => ({
  ManagePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import MyBusinessesPage from '@/pages/MyBusinessesPage';

afterEach(cleanup);

const chain = () => {
  const c: Record<string, unknown> = {};
  for (const k of ['select', 'eq', 'order']) c[k] = () => c;
  c.limit = () => Promise.resolve({ data: [{ created_at: new Date().toISOString() }], count: 1, error: null });
  return c;
};

describe('CB68 placement', () => {
  it('Do next sits directly under This week and above the body', async () => {
    const week = { visits: 0, visits_prev: 0, seen_by: 0, seen_by_prev: 0, new_followers: 0, followers_total: 0,
      taps: { website: 0, directions: 0, call: 0, message: 0 }, bars: { visits: [], seen_by: [], new_followers: [] },
      created_at: '2026-01-01', first_week: false, last_post_at: new Date().toISOString(), window_start: '', window_end: '' };
    rpc.mockResolvedValue({ data: week, error: null });
    from.mockImplementation(chain);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={qc}><MemoryRouter><MyBusinessesPage /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(container.querySelector('[data-business-do-next]')).not.toBeNull());
    const doNext = container.querySelector('[data-business-do-next]') as HTMLElement;
    expect(doNext.previousElementSibling?.hasAttribute('data-business-week')).toBe(true);
    expect(doNext.nextElementSibling?.querySelector('[data-business-body]')).not.toBeNull();
  });
});
