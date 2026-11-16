// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowseCourseCard } from '@/components/courses/BrowseCourseCard';
import { courseListLead, courseListPositions } from '@/components/courses/courseListCardRules';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import type { StatBrowseRow, StatLens } from '@/components/courses/useStatBrowse';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const row: StatBrowseRow = {
  course_id: 'one', name: 'Ballybunion Golf Club (Old)', region: 'Kerry', sub_country: 'Ireland', country: 'Ireland',
  image_url: null, community_rating: 8.3, review_count: 2, global_rank: null, regional_rank: null,
  rounds: 869, members: 41, avg_to_par: 6.2, total_yards: 6400, tee_label: null, course_record: 63,
  open_crowns: 4, total_count: 2, design_score: 7.7, condition_score: 8.2, clubhouse_score: 5.7,
  facilities_score: 6.7, difficulty_percentile: null, memberships: [],
};
const holder = { courseId: 'one', holderId: 'h', holderName: 'A very long holder name', recordGross: 63, photoUrl: null };
describe('Course list V2 lead rules', () => {
  it.each([
    ['played', '869', 'rounds'], ['rated', '8.3', 'from 2 ratings'],
    ['toughest', '+6.2', 'on average'], ['scoreable', '+6.2', 'on average'],
    ['lowest', '63', 'course record'], ['longest', '6,400', 'yards'], ['chase', '4', 'open crowns'],
  ] as const)('%s has the sort figure', (lens, value, label) => {
    expect(courseListLead(lens, row)).toMatchObject({ value, label });
  });
  it.each(['rated', 'toughest', 'scoreable', 'lowest', 'longest', 'chase'] as StatLens[])('%s falls back to rounds when missing', lens => {
    expect(courseListLead(lens, { ...row, community_rating: null, avg_to_par: null, course_record: null, total_yards: null, open_crowns: null } as unknown as StatBrowseRow)).toMatchObject({ value: '869', label: 'rounds' });
  });
  it('one round and one rating have singular labels', () => {
    expect(courseListLead('played', { ...row, rounds: 1 }).label).toBe('round');
    expect(courseListLead('rated', { ...row, review_count: 1 }).label).toBe('from 1 rating');
  });
  it('under par uses true minus and the under tone', () => {
    expect(courseListLead('scoreable', { ...row, avg_to_par: -2.4 })).toEqual({ value: '−2.4', label: 'on average', tone: 'under' });
  });
  it('rounded zero reads Level', () => {
    expect(courseListLead('toughest', { ...row, avg_to_par: -0.04 }).value).toBe('Level');
  });
  it('search preserves the position from the full loaded list', () => {
    const full = [row, { ...row, course_id: 'two', name: 'Trump International Golf Links' }];
    const positions = courseListPositions(full);
    const searched = full.filter(r => r.name.includes('Trump'));
    expect(searched.map(r => positions.get(r.course_id))).toEqual([2]);
  });
});

describe('Course list V2 conditional content', () => {
  it.each(['Ballybunion Golf Club (Old)', 'Trump International Golf Links'])('shares shortCoursePart for %s', name => {
    const view = render(<BrowseCourseCard row={{ ...row, name }} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-name')?.textContent).toBe(shortCoursePart(name));
  });
  it.each([[undefined, '869'], [12, '8.3']] as const)('Top 100 order with official reference %s leads with %s', (officialRank, value) => {
    const view = render(<BrowseCourseCard variant="top100" row={row} officialRank={officialRank} rank={1} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-figure')?.textContent).toBe(value);
  });
  it('Lowest rounds retains the holder but omits repeated gross', () => {
    const view = render(<BrowseCourseCard row={row} holder={holder} lens="lowest" onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-holder-name')?.textContent).toBe(holder.holderName);
    expect(view.container.querySelector('.course-list-record-score')).toBeNull();
    expect(view.container.querySelector('.course-list-figure')?.textContent).toBe('63');
  });
  it('Best rated omits the repeated ratings lead but keeps four categories', () => {
    const view = render(<BrowseCourseCard row={row} lens="rated" onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-rating')).toBeNull();
    expect(view.container.querySelectorAll('[data-category]')).toHaveLength(4);
  });
  it('zero members suppresses supplied faces and count', () => {
    const view = render(<BrowseCourseCard row={{ ...row, members: 0 }} players={[{ id: 'h', name: 'Ada', photoUrl: null }]} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-members')).toBeNull();
  });
  it('Top 100 no rounds suppresses lead, faces and record', () => {
    const view = render(<BrowseCourseCard variant="top100" row={{ ...row, rounds: 0 }} holder={holder} recordHolder="Ada" onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-no-rounds')).not.toBeNull();
    expect(view.container.querySelector('.course-list-lead')).toBeNull();
    expect(view.container.querySelector('.course-list-record')).toBeNull();
  });
});