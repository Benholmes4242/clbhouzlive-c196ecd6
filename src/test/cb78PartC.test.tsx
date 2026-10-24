import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  session: { session: null as any, user: null as any, loading: true },
  membership: { data: undefined as any, isPending: true },
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: null, error: null })), from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })), channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })), removeChannel: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => mocks.session }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => mocks.membership }));
vi.mock('@/components/business/verification/VerificationFlowSheet', () => ({ default: () => null }));

import { ReviewCard } from '@/pages/BusinessReviewsPage';
import BusinessVerificationPage from '@/pages/BusinessVerificationPage';
import type { BusinessReview } from '@/hooks/useBusinessReviews';

const review = { id: 'r1', rating: 8, review: 'Lovely', title: null, review_date: '2026-10-20T10:00:00Z', design_score: null, condition_score: null, clubhouse_score: null, facilities_score: null, course_id: 'c', course_name: 'Old', reviewer: { display_name: 'Jay', username: 'jay', handicap: null }, response: null, has_media: false } as unknown as BusinessReview;
const noop = () => {};
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

afterEach(() => cleanup());

describe('CB78 Part C: reply button matches the table', () => {
  it.each([['owner', true], ['admin', true], ['editor', false], ['analyst', false]] as const)('%s sees reply button: %s', (role, shown) => {
    const canReply = role === 'owner' || role === 'admin';
    render(<ReviewCard r={review} currentUserId="u" canReply={canReply} onReply={noop} onEdit={noop} onDelete={noop} />);
    expect(!!document.querySelector('[data-write-reply]')).toBe(shown);
  });
});

describe('CB78 Part C: verification page is owners and admins only', () => {
  const mount = () => render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/business/biz/verification']}><Routes>
    <Route path="/business/:id/verification" element={<BusinessVerificationPage />} />
    <Route path="/businesses/manage" element={<div data-manage-page />} />
  </Routes></MemoryRouter></QueryClientProvider>);
  beforeEach(() => {
    mocks.session = { session: null, user: null, loading: true };
    mocks.membership = { data: undefined, isPending: true };
  });
  it('redirects an editor once membership settles', async () => {
    mocks.session = { session: { user: { id: 'ed' } }, user: { id: 'ed' }, loading: false };
    mocks.membership = { data: { role: 'editor', canManage: false, canViewInsights: true }, isPending: false };
    mount();
    await waitFor(() => expect(document.querySelector('[data-manage-page]')).toBeTruthy());
  });
  it('never bounces an owner on a cold open while the session resolves first', async () => {
    const view = mount();
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-manage-page]')).toBeNull();
    mocks.session = { session: { user: { id: 'olivia' } }, user: { id: 'olivia' }, loading: false };
    view.rerender(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/business/biz/verification']}><Routes>
      <Route path="/business/:id/verification" element={<BusinessVerificationPage />} />
      <Route path="/businesses/manage" element={<div data-manage-page />} />
    </Routes></MemoryRouter></QueryClientProvider>);
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-manage-page]')).toBeNull();
    mocks.membership = { data: { role: 'owner', canManage: true, canViewInsights: true }, isPending: false };
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-manage-page]')).toBeNull();
  });
});
