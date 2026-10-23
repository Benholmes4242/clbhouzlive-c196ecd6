import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

const membership: BusinessMembership = {
  id: 'm-b1', role: 'owner', clubCourses: [],
  business: {
    id: 'b1', name: 'Hartwell', slug: null, category: 'Club Fitter', location: null, city: 'Leeds', region: null, country: 'England',
    logo_url: null, is_verified: false, is_deleted: false, club_id: null,
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

describe('CB67 placement', () => {
  it('the This week card sits directly under the header and the three old tiles are gone', async () => {
    rpc.mockReturnValue(new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={qc}><MemoryRouter><MyBusinessesPage /></MemoryRouter></QueryClientProvider>);
    const week = container.querySelector('[data-business-week]') as HTMLElement;
    const body = container.querySelector('[data-business-body]') as HTMLElement;
    expect(week).not.toBeNull();
    expect(body).not.toBeNull();
    // Week precedes the body; the body no longer renders the 3-column metric inset.
    expect(week.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(body.querySelector('[style*="grid-template-columns: repeat(3"]')).toBeNull();
    expect(rpc).toHaveBeenCalledWith('get_business_week', { p_business_id: 'b1' });
  });

  it('renders the real header with the card as its immediate next sibling', () => {
    rpc.mockReturnValue(new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={qc}><MemoryRouter><MyBusinessesPage /></MemoryRouter></QueryClientProvider>);
    const header = container.querySelector('[data-business-header]') as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.nextElementSibling?.hasAttribute('data-business-week')).toBe(true);
  });
});
