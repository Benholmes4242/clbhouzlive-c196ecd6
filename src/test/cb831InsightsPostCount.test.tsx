import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../public/locales/en/common.json';
import { InsightsVisitsCards } from '@/components/business/insights/InsightsVisitsSection';
import type { BusinessInsights } from '@/hooks/useBusinessInsights';
import type { BusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';

afterEach(cleanup);
const insights: BusinessInsights = {
  headline: { profile_views: { value: 0, prev: 0 }, unique_visitors: { value: 0, prev: 0 }, directory_impressions: { value: 0, prev: 0 }, click_outs: { value: 0, prev: 0 }, message_clicks: { value: 0, prev: 0 }, new_followers: { value: 0, prev: 0 }, total_followers: 0 },
  visits_series: [{ day: '2026-10-14', total: 5, unique: 1 }],
  followers_series: [], sources: [], content: [],
};
const funnel: BusinessInsightsFunnel = { period_days: 30, saw: { value: 0, prev: 0 }, opened: { value: 1, visits: 5, prev: 0 }, followed: { value: 0, total: 0, prev: 0 }, tapped: { value: 0, prev: 0 }, top_post: null };
async function sentence(dates: string[], days = 30) {
  const i18n = createInstance();
  await i18n.init({ lng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
  const { container } = render(<I18nextProvider i18n={i18n}><InsightsVisitsCards insights={insights} funnel={funnel} dates={dates} days={days} /></I18nextProvider>);
  return container.querySelector('.insights-visits-note')?.textContent;
}
describe('CB83.1 busiest-day post counts', () => {
  it.each([
    [1, ''], [2, ' twice'], [3, ' 3 times'],
  ])('previous-day %i posts use the exact counted clause', async (count, suffix) => {
    const dates = Array.from({ length: count }, (_, i) => `2026-10-13T${String(i).padStart(2, '0')}:00:00Z`);
    expect(await sentence(dates)).toBe(`Your busiest day was 14 Oct, with 5 visits, the day after you posted${suffix}.`);
  });
  it.each([
    [1, ''], [2, ' twice'], [3, ' 3 times'],
  ])('same-day %i posts use only the same-day count', async (count, suffix) => {
    const dates = Array.from({ length: count }, (_, i) => `2026-10-14T${String(i).padStart(2, '0')}:00:00Z`);
    dates.push('2026-10-13T23:30:00Z');
    expect(await sentence(dates)).toBe(`Your busiest day was 14 Oct, with 5 visits, the day you posted${suffix}.`);
  });
  it('90-day weekly wording stays unchanged with multiple posts', async () => {
    expect(await sentence(['2026-10-14T01:00:00Z', '2026-10-14T02:00:00Z', '2026-10-14T03:00:00Z'], 90)).toBe('Your busiest week was 14 Oct, with 5 visits.');
  });
});