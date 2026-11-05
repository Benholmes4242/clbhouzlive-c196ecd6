import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AddCourseModal } from '@/components/profile/courses/AddCourseModal';
import { A } from '@/features/courses/components/holes/analytical/tokens';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useUserCourseActivity', () => ({ useUserCourseActivity: () => ({ data: [] }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [], addCourse: vi.fn(), removeCourse: vi.fn(), reorderTopTen: vi.fn(), isRemoving: false }) }));
vi.mock('@/lib/courses/listRank', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/courses/listRank')>(), useCourseListRanks: () => ({ data: new Map() }) }));
afterEach(cleanup);
const mount = (initialTab: 'manage' | 'add') => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AddCourseModal userId="member" existingCourseIds={[]} initialTab={initialTab} onClose={vi.fn()} /></MemoryRouter></QueryClientProvider>);
const color = (value: string) => { const el = document.createElement('span'); el.style.color = value; document.body.appendChild(el); const result = getComputedStyle(el).color; el.remove(); return result; };

describe('TOPTEN_SHEET_1', () => {
  it.each(['manage','add'] as const)('renders the header action in ink, never amber, in %s mode', mode => {
    mount(mode);
    const title = document.getElementById('add-course-title');
    const action = title?.parentElement?.nextElementSibling?.querySelector('button');
    expect(action).toBeInTheDocument();
    expect(getComputedStyle(action as HTMLElement).color).toBe(color(A.INK));
    expect(getComputedStyle(action as HTMLElement).color).not.toBe(color(A.AMBER));
  });
  it.each(['manage','add'] as const)('ends the scrolling body with a 24px gutter in %s mode', mode => {
    mount(mode);
    const gutter = screen.getByTestId('top-ten-sheet-end-gutter');
    expect(gutter).toHaveStyle({ height: '24px', flexShrink: '0' });
    expect(gutter.parentElement?.lastElementChild).toBe(gutter);
    expect(gutter.parentElement).toHaveStyle({ overflowY: 'auto' });
  });
});