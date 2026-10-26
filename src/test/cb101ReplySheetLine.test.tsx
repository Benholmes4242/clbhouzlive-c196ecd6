import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { BusinessReview, BusinessReviewsResult } from '@/hooks/useBusinessReviews';

const state = vi.hoisted(() => ({
  data: undefined as BusinessReviewsResult | undefined,
  isError: false,
  clubId: 'club' as string | null,
  refetch: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ session: { user: { id: 'owner' } } }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { canManage: true } }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { club_id: state.clubId }, isLoading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessReviews', () => ({
  useBusinessReviews: () => ({ data: state.data, isLoading: false, isError: state.isError, refetch: state.refetch }),
  usePostReviewReply: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateReviewReply: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteReviewReply: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('@/components/manage/ManagePageShell', () => ({ ManagePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ DARK_HAIRLINE: 'rgba(255,255,255,0.1)', SquircleAvatar: () => <div data-avatar="" /> }));
vi.mock('@/components/mentions/MentionText', () => ({ MentionText: ({ text }: { text: string }) => <>{text}</> }));

import BusinessReviewsPage from '@/pages/BusinessReviewsPage';

const LINE = 'Posted publicly as the business';

const review: BusinessReview = {
  id: 'review', rating: 7.5, review: 'A lovely course', title: null,
  review_date: '2026-10-26T10:00:00Z', design_score: null, condition_score: null,
  clubhouse_score: null, facilities_score: null, course_id: 'east', course_name: 'East Course',
  reviewer: { id: 'golfer', display_name: 'Golfer', username: 'golfer', profile_photo_url: null, handicap: null },
  response: null, has_media: false,
};

function result(): BusinessReviewsResult {
  return {
    reviews: [{ ...review }], courses: [],
    summary: { count: 1, avg: 7.5, awaiting_reply: 1, reply_rate: 0, this_period: 1, distribution: [{ bucket: 4, count: 1 }] },
  };
}

function mount() {
  return render(<MemoryRouter initialEntries={['/business/biz/reviews']}><Routes>
    <Route path="/business/:id/reviews" element={<BusinessReviewsPage />} />
  </Routes></MemoryRouter>);
}

function openSheet() {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Write a reply' }));
  return screen.getByRole('dialog');
}

beforeEach(() => { state.data = result(); state.isError = false; state.clubId = 'club'; state.refetch.mockClear(); });
afterEach(cleanup);

describe('CB101 reply sheet identity line', () => {
  it('the identity line reads once, inside the sheet header', () => {
    const dialog = openSheet();
    const lines = within(dialog).getAllByText(LINE);
    expect(lines).toHaveLength(1);
    const header = screen.getByText('Reply to review').parentElement as HTMLElement;
    expect(header.textContent).toContain(LINE);
    expect(header.contains(lines[0])).toBe(true);
  });

  it('the row under the textarea holds only the counter', () => {
    const dialog = openSheet();
    const counter = within(dialog).getByText('0/1000');
    const row = counter.parentElement as HTMLElement;
    expect(row.children).toHaveLength(1);
    expect(row.textContent).toBe('0/1000');
    // The counter keeps the same colour ground as the header identity line.
    expect(counter.style.color).toBe(within(dialog).getByText(LINE).style.color);
  });
});
