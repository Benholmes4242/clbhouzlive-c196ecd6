// @vitest-environment jsdom
/** BRIEF_COURSE_CARD_V3: full-bleed tile card, list rows without the record. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { BrowseCourseCard, PHOTO_H, TOP100_PHOTO_H } from '@/components/courses/BrowseCourseCard';
import { CourseListRow } from '@/components/courses/CourseListRow';
import type { StatBrowseRow, StatLens } from '@/components/courses/useStatBrowse';

const row = { course_id: 'one', name: 'Royal Ashdown', region: 'Kent', sub_country: 'England', country: 'England', image_url: null,
  rounds: 27, members: 5, community_rating: 9.9, review_count: 2, avg_to_par: 3.1, course_record: 66, total_yards: 6400, open_crowns: 1,
  design_score: 8.1, condition_score: 7.4, clubhouse_score: null, facilities_score: 6.2, memberships: [] } as unknown as StatBrowseRow;
const players = [1, 2, 3].map(n => ({ id: `p${n}`, name: `P${n}`, photoUrl: null }));
const css = readFileSync('src/components/courses/courseListCard.css', 'utf8');
const lead = (c: HTMLElement) => c.querySelector('.course-list-lead') as HTMLElement;

describe('course card v3', () => {
  it('uses a 190px photo on a radius-free panel tile', () => {
    expect(PHOTO_H).toBe(190);
    expect(TOP100_PHOTO_H).toBe(190);
    const view = render(<BrowseCourseCard row={row} lens="rated" onClick={() => {}} />);
    expect((view.container.querySelector('.course-list-photo') as HTMLElement).style.height).toBe('190px');
    const rule = css.slice(css.indexOf('.course-list-card.course-list-card {'), css.indexOf('}'));
    expect(rule).toContain('background:var(--course-list-panel)');
    expect(rule).toContain('border-radius:0');
  });
  it('rated lens leads with 9.9 and "2 ratings", with rounds on the right', () => {
    const view = render(<BrowseCourseCard row={row} lens="rated" players={players} onClick={() => {}} />);
    const l = lead(view.container);
    expect(l.querySelector('.course-list-figure')?.textContent).toBe('9.9');
    expect(l.querySelector('.course-list-lead-label')?.textContent).toBe('2 ratings');
    expect(l.querySelector('.course-list-members')?.lastElementChild?.textContent).toBe('27 rounds');
    expect(l.querySelectorAll('.course-list-face')).toHaveLength(3);
  });
  it('played lens shows members on the right, never the rounds again', () => {
    const view = render(<BrowseCourseCard row={row} lens="played" onClick={() => {}} />);
    const side = lead(view.container).querySelector('.course-list-members');
    expect(side?.textContent).toBe('5 members');
  });
  it('shows nothing on the right when the side count is zero', () => {
    const view = render(<BrowseCourseCard row={{ ...row, members: 0 }} lens="played" onClick={() => {}} />);
    expect(lead(view.container).querySelector('.course-list-members')).toBeNull();
  });
  it('the breakdown is four centred columns in order with no lead inside', () => {
    const view = render(<BrowseCourseCard row={row} lens="toughest" onClick={() => {}} />);
    const strip = view.container.querySelector('[data-course-breakdown]') as HTMLElement;
    expect(strip.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    const cells = Array.from(strip.children) as HTMLElement[];
    expect(cells.map(c => c.getAttribute('data-category'))).toEqual(['design', 'condition', 'clubhouse', 'facilities']);
    expect(cells.filter(c => !c.hasAttribute('aria-hidden')).every(c => c.style.textAlign === 'center')).toBe(true);
    expect(strip.textContent).not.toContain('9.9');
    expect(view.container.textContent).not.toContain('9.9');
  });
  it.each(['rated', 'played', 'toughest'] as StatLens[])('%s list row shows no Record text', lens => {
    const view = render(<CourseListRow row={row} lens={lens} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-detail')?.textContent).toBe('Kent');
    expect(view.container.textContent).not.toContain('Record');
  });
  it('lowest list row still shows rounds before the area', () => {
    const view = render(<CourseListRow row={row} lens="lowest" onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-detail')?.textContent).toBe('27 rounds · Kent');
  });
});
