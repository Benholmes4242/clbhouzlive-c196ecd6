import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
const holder = (id: string, name: string) => ({ user_id: id, user_display_name: name, user_photo_url: null, is_self: false, value: 68 });
const jane = holder('u1', 'Jane Doe'), mark = holder('u2', 'Mark Lee');
vi.mock('@/components/courses/course-detail/useCourseRecordSummary', () => ({ useCourseRecordSummary: () => ({
  isLoading: false, unclaimedCount: 0, hasAnyHolder: true, viewerByCategory: {},
  previewRows: [
    { category: 'lowest_gross_all_time', row: jane, rows: [jane, mark] },
    { category: 'most_rounds_all_time', row: jane, rows: [jane] },
  ],
}) }));
import RecordBook from '@/components/courses/course-detail/about/RecordBook';

const faces = (el: Element) => Array.from(el.querySelectorAll('[aria-label], span, div'))
  .filter(n => n.children.length === 0 && /^[A-Z]{1,2}$/.test(n.textContent ?? '')).map(n => n.textContent);

describe('Record book joint-holder avatars', () => {
  it('a joint-holder row with no photos renders initials for both faces, never the generic icon', () => {
    const { container } = render(<RecordBook courseId="c1" courseName="Course" />);
    const stack = container.querySelector('[aria-hidden="true"][style*="width: 52px"]')!;
    expect(stack).toBeTruthy();
    expect(faces(stack)).toEqual(['JD', 'ML']);
    expect(stack.querySelector('svg.lucide-user')).toBeNull();
  });
  it('the same golfer renders the same initials in a stack and on their own', () => {
    const { container } = render(<RecordBook courseId="c1" courseName="Course" />);
    const [jointRow, soloRow] = Array.from(container.querySelectorAll('button'));
    const stack = jointRow.querySelector('[aria-hidden="true"][style*="width: 52px"]')!;
    expect(faces(stack)[0]).toBe('JD');
    expect(faces(soloRow)[0]).toBe('JD');
  });
});
