import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { ReviewReceipt as ReceiptData } from '@/features/review-v2/hooks/useReviewReceipt';

const fixture = vi.hoisted(() => ({ receipt: null as ReceiptData | null }));
vi.mock('@/features/review-v2/hooks/useReviewReceipt', () => ({ useReviewReceipt: () => ({ data: fixture.receipt }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 3 }) }));
vi.mock('@/features/composer-flow/hooks/useReviewCourseSearch', () => ({ useReviewCourseIdle: () => ({ data: null, isSuccess: true }), useReviewCourseResults: () => ({ data: [], term: '' }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { ReviewReceipt } from '@/features/review-v2/components/ReviewReceipt';

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
});
beforeEach(() => {
  fixture.receipt = {
    community_avg: 7.8, rating_count: 3, avg_before: 8.1, subscore_threshold_met: false,
    top100_rank: null, top100_list: null, your_rated_in_list: null, your_rank_of_rated: 28, your_total_rated: 32,
    next_course_id: null, next_course_name: null, next_played_at: null, unrated_count: 5,
  };
});
afterEach(cleanup);
function Providers({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient()}><MemoryRouter><I18nextProvider i18n={i18n}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>; }
function receipt(overall: number | null = 7.3) {
  return render(<Providers><ReviewReceipt ratingId="rating" course={{ id: 'course', name: 'Quinta do Lago Laranjal', region: 'Algarve', country: 'Portugal' }} overall={overall} scores={{ design: 7.4, condition: 8, clubhouse: 1.4, facilities: 1.2 }} shareToFeed={false} onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}} /></Providers>);
}
const firstLine = () => screen.getByText((_text, element) => {
  const sentence = 'Quinta do Lago Laranjal is now 7.8 from 3 members';
  return element?.tagName === 'DIV' && element.textContent === sentence
    && !Array.from(element.querySelectorAll('*')).some(child => child.textContent === sentence);
});

describe('receipt displayed-average comparison', () => {
  it('receipt uses the same half-up category mean of 8.4 rather than the overall', () => {
    const { container } = render(<Providers><ReviewReceipt ratingId={null}
      course={{ id: 'course', name: 'Quinta do Lago Laranjal' }} overall={2}
      scores={{ design: 9.2, condition: 8, clubhouse: 7.4, facilities: 8.8 }} shareToFeed={false}
      onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}} /></Providers>);
    expect(Array.from(container.querySelectorAll('span')).filter(node => node.textContent === '8.4')).toHaveLength(1);
  });
  it('names the displayed average and measures 7.3 against 7.8, not avg_before 8.1', () => {
    receipt();
    expect(firstLine()).toBeTruthy();
    expect(screen.getByText('Your 7.3 is 0.5 below it')).toBeTruthy();
    expect(screen.queryByText(/0\.8 below/)).toBeNull();
  });
  it('measures an above-average 8.4 as 0.6 above 7.8', () => {
    receipt(8.4);
    expect(screen.getByText('Your 8.4 is 0.6 above it')).toBeTruthy();
  });
  it('always shows the equality line when 7.8 matches 7.8', () => {
    receipt(7.8);
    expect(screen.getByText('Your 7.8 matches it')).toBeTruthy();
  });
  it('uses the equality line when the absolute gap rounds below one tenth', () => {
    receipt(7.84);
    expect(screen.getByText('Your 7.8 matches it')).toBeTruthy();
  });
  it('shows the first-member title and score sub with one rating', () => {
    if (!fixture.receipt) throw new Error('Missing receipt fixture');
    fixture.receipt.rating_count = 1;
    receipt();
    const line = screen.getByText((_text, element) => element?.className === 'receipt-impact-title' && element.textContent === "You're the first member to review Quinta do Lago Laranjal");
    expect(line.parentElement?.children).toHaveLength(2);
    expect(screen.queryByText(/is 0\.[0-9] (above|below) it|matches it/)).toBeNull();
  });
  it('shows the first-member title and score sub when the community average is null', () => {
    if (!fixture.receipt) throw new Error('Missing receipt fixture');
    fixture.receipt.community_avg = null;
    receipt();
    const line = screen.getByText((_text, element) => element?.className === 'receipt-impact-title' && element.textContent === "You're the first member to review Quinta do Lago Laranjal");
    expect(line.parentElement?.children).toHaveLength(2);
    expect(screen.queryByText(/is 0\.[0-9] (above|below) it|matches it/)).toBeNull();
  });
  it('does not invent a comparison without an overall score', () => {
    receipt(null);
    expect(firstLine()).toBeTruthy();
    expect(screen.queryByText(/is 0\.[0-9] (above|below) it|matches it/)).toBeNull();
  });
});