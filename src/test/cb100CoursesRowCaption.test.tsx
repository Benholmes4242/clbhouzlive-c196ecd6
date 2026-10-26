/**
 * CB100 — the multi-course "Your courses" row names each course within the
 * club, matching the Reviews row beneath it.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/hooks/useBusinessPendingRequestsCount', () => ({ useBusinessPendingRequestsCount: () => ({ data: 0 }) }));
vi.mock('@/hooks/useBusinessAccessRequestsRealtime', () => ({ useBusinessAccessRequestsRealtime: () => {} }));
vi.mock('@/hooks/useBusinessVerificationRequest', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBusinessVerificationRequest')>('@/hooks/useBusinessVerificationRequest');
  return { ...actual, useBusinessVerificationRequest: () => ({ data: { status: 'approved' } }) };
});
vi.mock('@/hooks/useBusinessCourseClaim', () => ({ useBusinessCourseClaim: () => ({ data: null }) }));
vi.mock('@/hooks/useBusinessReviews', () => ({ useBusinessReviews: () => ({ data: null }) }));
vi.mock('@/components/business/ClaimYourCourseSheet', () => ({ ClaimYourCourseSheet: () => null }));

import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';
import { CLUB_ANALYTICS_CATEGORY } from '@/features/business/clubAnalytics/useClubCourseLink';

const FULL = 'Sundridge Park Golf Club';
const membership = (): BusinessMembership => ({
  id: 'm-b1',
  role: 'admin',
  business: {
    id: 'b1', name: 'Sundridge Park', slug: null, category: CLUB_ANALYTICS_CATEGORY, location: null,
    city: 'Bromley', region: null, country: 'England', logo_url: null, is_verified: true, is_deleted: false, club_id: 'club-1',
  },
  clubCourses: [
    { id: 'c-east', name: `${FULL} (East Course)` },
    { id: 'c-west', name: `${FULL} (West Course)` },
  ],
} as unknown as BusinessMembership);

describe('CB100 Your courses row captions', () => {
  it('captions name each course within the club, never the full club name', () => {
    const { getByText } = render(
      <MemoryRouter><BusinessCommandCard membership={membership()} userId="u1" bodyOnly /></MemoryRouter>,
    );
    const row = getByText('Your courses').closest('button') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('East Course');
    expect(row.textContent).toContain('West Course');
    expect(row.textContent).not.toContain(FULL);
  });
});
