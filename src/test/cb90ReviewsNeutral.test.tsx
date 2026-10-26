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

const review: BusinessReview = {
  id: 'review', rating: 7.5, review: 'A lovely course', title: null,
  review_date: '2026-10-26T10:00:00Z', design_score: null, condition_score: null,
  clubhouse_score: null, facilities_score: null, course_id: 'east', course_name: 'East Course',
  reviewer: { id: 'golfer', display_name: 'Golfer', username: 'golfer', profile_photo_url: null, handicap: null },
  response: null, has_media: false,
};
function result(count = 1): BusinessReviewsResult {
  return {
    reviews: count ? [{ ...review }] : [], courses: [],
    summary: { count, avg: count ? 7.5 : null, awaiting_reply: count, reply_rate: 0, this_period: count, distribution: [{ bucket: 4, count }] },
  };
}
function mount() {
  return render(<MemoryRouter initialEntries={['/business/biz/reviews']}><Routes>
    <Route path="/business/:id/reviews" element={<BusinessReviewsPage />} />
  </Routes></MemoryRouter>);
}
const compact = (s: string) => s.replace(/\s/g, '').toLowerCase();
function noAmber(root: ParentNode) {
  const styles = Array.from(root.querySelectorAll('[style]')).map(el => compact(el.getAttribute('style') ?? ''));
  expect(styles.length).toBeGreaterThan(0);
  for (const style of styles) {
    expect(style).not.toMatch(/#f7931e|rgba?\(247,147,30(?:,|\))/);
  }
}
function expectPaint(el: Element | null, property: string, value: string) {
  expect(el).not.toBeNull();
  const actual = (el as HTMLElement).style.getPropertyValue(property);
  // Normalize only CSS serialization; preserve colour and alpha assertions.
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  expect(compact(actual)).toBe(compact(probe.style.getPropertyValue(property)));
}
function iconTile(root: ParentNode, icon: string) {
  const glyph = root.querySelector(`svg.lucide-${icon}`);
  expectPaint(glyph, 'color', '#F8FAFC');
  expectPaint(glyph?.parentElement ?? null, 'background', 'rgba(255,255,255,0.06)');
  noAmber(root);
}
beforeEach(() => { state.data = result(); state.isError = false; state.clubId = 'club'; state.refetch.mockClear(); });
afterEach(cleanup);

describe('CB90 reviews neutral paint and reply close', () => {
  it('the real reply sheet has exactly one close control and closes normally', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Write a reply' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    noAmber(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it.each([0, 3])('summary Awaiting stays white with a count of %s; list notices stay neutral', count => {
    state.data = result();
    state.data.summary.awaiting_reply = count;
    const { container } = mount();
    const cell = screen.getByText('Awaiting').parentElement;
    expectPaint(cell?.firstElementChild ?? null, 'color', '#F8FAFC');
    const notice = container.querySelector('div.uppercase');
    expectPaint(notice, 'color', 'rgba(248,250,252,0.62)');
    expectPaint(notice?.firstElementChild ?? null, 'background', '#F8FAFC');
    noAmber(container);
  });
  it('the load error Retry is white with dark text and retains its retry action', () => {
    state.isError = true;
    const { container } = mount();
    const retry = screen.getByRole('button', { name: 'Retry' });
    expectPaint(retry, 'background', '#F8FAFC');
    expectPaint(retry, 'color', '#0B0B0D');
    fireEvent.click(retry);
    expect(state.refetch).toHaveBeenCalledOnce();
    noAmber(container);
  });
  it('the no-club guard Star tile is neutral', () => {
    state.clubId = null;
    iconTile(mount().container, 'star');
  });
  it('the whole-club empty Sparkles tile is neutral', () => {
    state.data = result(0);
    iconTile(mount().container, 'sparkles');
  });
  it('the selected-course empty Sparkles tile is neutral', () => {
    const populated = result();
    const courses = [{ course_id: 'east', course_name: 'East Course', count: 1 }, { course_id: 'west', course_name: 'West Course', count: 0 }];
    state.data = { ...populated, courses };
    const view = mount();
    state.data = { ...result(0), courses };
    fireEvent.click(screen.getByRole('button', { name: /West Course/ }));
    iconTile(view.container, 'sparkles');
  });
  it.each([
    [4.0, 'rgba(255,107,107,0.16)', 'rgba(248,250,252,0.62)'],
    [5.0, 'rgba(255,255,255,0.06)', 'rgba(248,250,252,0.62)'],
    [7.5, 'rgba(255,255,255,0.06)', 'rgba(248,250,252,0.62)'],
    [8.9, 'rgba(255,255,255,0.06)', 'rgba(248,250,252,0.62)'],
    [9.2, 'rgba(47,163,90,0.16)', '#2FA35A'],
  ] as const)('rating %s keeps the required wash and canonical foreground', (rating, bg, fg) => {
    state.data = { ...result(), reviews: [{ ...review, rating }] };
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Write a reply' }));
    const dialog = screen.getByRole('dialog');
    const chip = dialog.querySelector('span.inline-flex');
    expectPaint(chip, 'background', bg);
    expectPaint(chip, 'color', fg);
    noAmber(dialog);
  });
});