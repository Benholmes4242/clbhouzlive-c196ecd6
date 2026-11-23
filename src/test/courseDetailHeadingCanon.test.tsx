import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '@/locales/en/courses.json';

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));

import { CourseMediaCanonGrid } from '@/components/course-media-tab/CourseMediaCanonGrid';
import YourRoundsSheet from '@/components/courses/course-detail/you/YourRoundsSheet';
import { AboutSection } from '@/components/courses/course-detail/about/AboutSection';
import { Sec } from '@/components/courses/course-detail/you/many/manyBits';
import { NobodyHasRated } from '@/components/courses/course-detail/reviews/NobodyHasRated';

const language = createInstance();
void language.init({ lng: 'en', resources: { en: { courses } }, interpolation: { escapeValue: false } });
afterEach(cleanup);

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter></QueryClientProvider>);
}

function title(element: Element | null) {
  if (!(element instanceof HTMLElement)) throw new Error('Expected the real heading element');
  expect(element.style.fontSize).toBe('21px');
  expect(element.style.fontWeight).toBe('700');
  expect(element.style.letterSpacing).toBe('-0.035em');
  expect(element.style.lineHeight).toBe('1.05');
}

function eyebrow(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement)) throw new Error('Expected the real eyebrow element');
  expect(element.style.fontSize).toBe('11px');
  expect(element.style.letterSpacing).toBe('0.16em');
}

describe('Brief 8 Course detail heading canon', () => {
  it('AboutSection title and eyebrow use the canonical metrics', () => {
    const { container } = mount(<AboutSection kicker="The course" title="About this course"><div /></AboutSection>);
    const heading = container.querySelector('h2');
    title(heading);
    eyebrow(heading?.previousElementSibling);
  });

  it('Sec title and own-data eyebrow use the canonical metrics', () => {
    const { container } = mount(<Sec kicker="Your verdict" title="Your golf here"><div /></Sec>);
    const heading = container.querySelector('h2');
    title(heading);
    eyebrow(heading?.previousElementSibling);
  });

  it('AboutSection keeps unshrinking meta beside the title on its last baseline', () => {
    const { container } = mount(<AboutSection kicker="Course" title="How this course defends par" meta="186 rounds"><div /></AboutSection>);
    const heading = container.querySelector('h2');
    const column = heading?.parentElement;
    const row = column?.parentElement;
    const meta = column?.nextElementSibling;
    if (!(column instanceof HTMLElement) || !(row instanceof HTMLElement) || !(meta instanceof HTMLElement)) throw new Error('Expected separate title and meta columns');
    expect(row.style.alignItems).toBe('last baseline');
    expect(column.style.minWidth).toBe('0');
    expect(meta.style.flexShrink).toBe('0');
    expect(meta.style.whiteSpace).toBe('nowrap');
  });

  it('the Reviews nobody-rated one-off title and eyebrow use the canonical metrics', () => {
    const { container } = mount(<NobodyHasRated totalRatings={0} courseName="Sundridge Park (East)" onWriteFirst={() => {}} />);
    const heading = container.querySelector('h2');
    title(heading);
    eyebrow(heading?.previousElementSibling);
  });

  it('the flat Media empty-section title uses the canonical title', () => {
    const { container } = mount(<CourseMediaCanonGrid posts={[]} isLoading={false} isError={false} hasNextPage={false} isFetchingNextPage={false} fetchNextPage={() => {}} refetch={() => {}} courseName="Sundridge Park (East)" courseId="course" />);
    title(container.querySelector('h3'));
  });

  it('YourRoundsSheet title and course-name eyebrow use the canonical metrics', () => {
    mount(<YourRoundsSheet open onClose={() => {}} courseId="course" courseName="Sundridge Park (East)" fieldOverPar={8.4} fieldRounds={186} coursePar={72} />);
    const heading = document.getElementById('your-rounds-sheet-title');
    title(heading);
    eyebrow(heading?.parentElement?.previousElementSibling);
  });
});