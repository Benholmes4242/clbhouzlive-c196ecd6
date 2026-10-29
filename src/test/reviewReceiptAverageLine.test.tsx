import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
import type { ReviewReceipt as ReceiptData } from '@/features/review-v2/hooks/useReviewReceipt';

const fixture = vi.hoisted(() => ({ receipt: null as ReceiptData | null }));
vi.mock('@/features/review-v2/hooks/useReviewReceipt', () => ({ useReviewReceipt: () => ({ data: fixture.receipt }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { ReviewReceipt } from '@/features/review-v2/components/ReviewReceipt';

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
});
beforeEach(() => {
  fixture.receipt = {
    course_id: 'course', course_name: 'Quinta do Lago Laranjal', region: 'Algarve',
    your_overall: 7.3, your_design: 7.4, your_condition: 8, your_clubhouse: 1.4, your_facilities: 1.2,
    community_avg: 7.8, rating_count: 3, avg_before: 8.1, unlocked_subscores: false,
    top100_rank: null, top100_list: null, your_rated_in_list: null, your_rank_of_rated: 28, your_total_rated: 32,
    next_course_id: null, next_course_name: null, next_played_at: null, unrated_count: 5,
  };
});
afterEach(cleanup);
function receipt(overall: number | null = 7.3) {
  return render(<I18nextProvider i18n={i18n}><ReviewReceipt ratingId="rating" course={{ id: 'course', name: 'Quinta do Lago Laranjal', region: 'Algarve', country: 'Portugal' }} overall={overall} scores={{ design: 7.4, condition: 8, clubhouse: 1.4, facilities: 1.2 }} shareToFeed={false} onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}} /></I18nextProvider>);
}
const firstLine = () => screen.getByText((_text, element) => {
  const sentence = '3 members rate Quinta do Lago Laranjal 7.8 on average';
  return element?.tagName === 'DIV' && element.textContent === sentence
    && !Array.from(element.querySelectorAll('*')).some(child => child.textContent === sentence);
});

describe('receipt displayed-average comparison', () => {
  it('receipt uses the same half-up category mean of 8.4 rather than the overall', () => {
    const { container } = render(<I18nextProvider i18n={i18n}><ReviewReceipt ratingId={null}
      course={{ id: 'course', name: 'Quinta do Lago Laranjal' }} overall={2}
      scores={{ design: 9.2, condition: 8, clubhouse: 7.4, facilities: 8.8 }} shareToFeed={false}
      onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}} /></I18nextProvider>);
    expect(Array.from(container.querySelectorAll('span')).filter(node => node.textContent === '8.4')).toHaveLength(1);
  });
  it('names the displayed average and measures 7.3 against 7.8, not avg_before 8.1', () => {
    receipt();
    expect(firstLine()).toBeTruthy();
    expect(screen.getByText('Your 7.3 is 0.5 below that average')).toBeTruthy();
    expect(screen.queryByText(/0\.8 below/)).toBeNull();
  });
  it('measures an above-average 8.4 as 0.6 above 7.8', () => {
    receipt(8.4);
    expect(screen.getByText('Your 8.4 is 0.6 above that average')).toBeTruthy();
  });
  it('always shows the equality line when 7.8 matches 7.8', () => {
    receipt(7.8);
    expect(screen.getByText('Your 7.8 matches that average')).toBeTruthy();
  });
  it('uses the equality line when the absolute gap rounds below one tenth', () => {
    receipt(7.84);
    expect(screen.getByText('Your 7.8 matches that average')).toBeTruthy();
  });
  it('shows only the first-member line with one rating', () => {
    if (!fixture.receipt) throw new Error('Missing receipt fixture');
    fixture.receipt.rating_count = 1;
    receipt();
    const line = screen.getByText("You're the first member to rate Quinta do Lago Laranjal");
    expect(line.parentElement?.children).toHaveLength(1);
    expect(screen.queryByText(/that average/)).toBeNull();
  });
  it('shows only the first-member line when the community average is null', () => {
    if (!fixture.receipt) throw new Error('Missing receipt fixture');
    fixture.receipt.community_avg = null;
    receipt();
    const line = screen.getByText("You're the first member to rate Quinta do Lago Laranjal");
    expect(line.parentElement?.children).toHaveLength(1);
    expect(screen.queryByText(/that average/)).toBeNull();
  });
  it('does not invent a comparison without an overall score', () => {
    receipt(null);
    expect(firstLine()).toBeTruthy();
    expect(screen.queryByText(/that average/)).toBeNull();
  });
});