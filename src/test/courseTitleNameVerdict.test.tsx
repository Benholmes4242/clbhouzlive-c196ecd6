import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '@/locales/en/courses.json';

vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: { avg_over_par: 8.4, rounds_tracked: 186 } }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: null }) }));

import TheVerdict from '@/components/courses/course-detail/about/TheVerdict';

afterEach(cleanup);

it('TheVerdict uses the sentence-start fallback when the title name exceeds 22 characters', async () => {
  const language = createInstance();
  await language.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
  const { container } = render(<I18nextProvider i18n={language}><TheVerdict courseId="course" courseName="Missing Links Driving Range, Golf Course, Miniature Golf, Toptracer, Sports Bar" /></I18nextProvider>);
  expect(container.querySelector('h2')?.textContent).toBe('This course takes eight shots off the field');
});