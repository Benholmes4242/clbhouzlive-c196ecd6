/**
 * CB75.1 — the Manage list badge dot is a notice marker in ink, not amber.
 * The amber on "Verified" and "Verification pending" is the badge colour and
 * is deliberately untouched; this pins the dot so it cannot drift back.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/hooks/useBusinessPendingRequestsCount', () => ({ useBusinessPendingRequestsCount: () => ({ data: 1 }) }));
vi.mock('@/hooks/useBusinessAccessRequestsRealtime', () => ({ useBusinessAccessRequestsRealtime: () => {} }));
vi.mock('@/hooks/useBusinessVerificationRequest', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBusinessVerificationRequest')>('@/hooks/useBusinessVerificationRequest');
  return { ...actual, useBusinessVerificationRequest: () => ({ data: null }) };
});
vi.mock('@/hooks/useBusinessCourseClaim', () => ({ useBusinessCourseClaim: () => ({ data: null }) }));
vi.mock('@/hooks/useBusinessReviews', () => ({ useBusinessReviews: () => ({ data: null }) }));
vi.mock('@/components/business/ClaimYourCourseSheet', () => ({ ClaimYourCourseSheet: () => null }));

import { BusinessCommandCard } from '@/components/business/BusinessCommandCard';

const membership = (): BusinessMembership => ({
  id: 'm-b1',
  role: 'admin',
  business: {
    id: 'b1', name: 'Fairway Fitting Co.', slug: null, category: 'Other', location: null,
    city: 'Leeds', region: null, country: 'England', logo_url: null, is_verified: false, is_deleted: false, club_id: null,
  },
  clubCourses: [],
});

describe('CB75.1 notice dots', () => {
  it('the Manage list badge dot is ink, never amber', () => {
    const { container } = render(
      <MemoryRouter><BusinessCommandCard membership={membership()} userId="u1" bodyOnly /></MemoryRouter>,
    );
    const dot = container.querySelector('[data-business-body] span.rounded-full');
    expect(dot).not.toBeNull();
    const bg = (dot as HTMLElement).style.background;
    expect(bg).toBe('rgb(248, 250, 252)');
    expect(bg).not.toBe('rgb(247, 147, 30)');
  });
});
