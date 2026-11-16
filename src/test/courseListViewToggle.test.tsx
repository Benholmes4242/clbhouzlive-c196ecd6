// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, fireEvent, act } from '@testing-library/react';
import { CourseListViewToggle } from '@/components/courses/CourseListViewToggle';
import { readCourseListView, useCourseListView } from '@/components/courses/useCourseListView';
import { CourseListRow, CourseListColumns } from '@/components/courses/CourseListRow';
import { BrowseCourseCard } from '@/components/courses/BrowseCourseCard';
import { courseListLead, courseListColumnLabel, courseListPositions } from '@/components/courses/courseListCardRules';
import type { StatBrowseRow, StatLens } from '@/components/courses/useStatBrowse';
const f = vi.hoisted(() => ({ track:vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents:{ track:f.track } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type:'3rdParty', init:() => {} }, useTranslation:() => ({ t:(_k:string,o?:{ defaultValue?:string }) => o?.defaultValue ?? '' }) }));
const row = { course_id:'one', name:'Ballybunion Golf Club (Old)', region:'Kerry', sub_country:'Ireland', country:'Ireland', image_url:null,
  rounds:869, members:0, community_rating:8.3, review_count:2, avg_to_par:-2.4, course_record:63, total_yards:6400, open_crowns:4,
  design_score:null, condition_score:null, clubhouse_score:null, facilities_score:null, memberships:[] } as unknown as StatBrowseRow;
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); f.track.mockClear(); });
describe('shared course view preference', () => {
  it('defaults to cards and exposes the two pressed segments', () => {
    expect(readCourseListView()).toBe('cards');
    render(<CourseListViewToggle view="cards" onChange={() => {}} />);
    expect(screen.getByRole('group',{ name:'List view' })).toBeInTheDocument();
    expect(screen.getByRole('button',{ name:'Cards' })).toHaveAttribute('aria-pressed','true');
    expect(screen.getByRole('button',{ name:'List' })).toHaveAttribute('aria-pressed','false');
  });
  it('persists one preference across both mounted tabs and remount', () => {
    const first=renderHook(() => useCourseListView('courses'));
    const second=renderHook(() => useCourseListView('top100'));
    act(() => first.result.current.changeView('list'));
    expect(first.result.current.view).toBe('list'); expect(second.result.current.view).toBe('list');
    expect(localStorage.getItem('courses-list-view')).toBe('list');
    expect(renderHook(() => useCourseListView('top100')).result.current.view).toBe('list');
    expect(f.track).toHaveBeenCalledWith('courses_view_changed',{ from:'cards',to:'list',surface:'courses' });
  });
  it('storage read failures fall back to cards', () => {
    vi.spyOn(Storage.prototype,'getItem').mockImplementation(() => { throw new Error('refused'); });
    expect(readCourseListView()).toBe('cards');
  });
  it('storage write failures return both tabs to cards', () => {
    localStorage.setItem('courses-list-view','list');
    const first=renderHook(() => useCourseListView('courses'));
    const second=renderHook(() => useCourseListView('top100'));
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(() => { throw new Error('refused'); });
    act(() => first.result.current.changeView('cards'));
    expect(first.result.current.view).toBe('cards'); expect(second.result.current.view).toBe('cards');
  });
});
describe('compact list figures', () => {
  it.each([['played','ROUNDS','869'],['rated','RATING','8.3'],['toughest','AVG','−2.4'],['scoreable','AVG','−2.4'],['lowest','RECORD','63'],['longest','YARDS','6,400'],['chase','CROWNS','4']] as const)('%s column and figure', (lens,label,value) => {
    expect(courseListColumnLabel(lens)).toBe(label);
    const view=render(<><CourseListColumns lens={lens} /><CourseListRow row={row} lens={lens} rank={2} onClick={() => {}} /></>);
    expect(view.container.querySelector('.course-list-row-figure')?.textContent).toBe(value);
    expect(courseListLead(lens,row,false)?.value).toBe(value);
  });
  it.each(['rated','toughest','scoreable','lowest','longest','chase'] as StatLens[])('%s missing figure is absent rather than rounds', lens => {
    const missing={...row, community_rating:null, avg_to_par:null, course_record:null,total_yards:null,open_crowns:null} as unknown as StatBrowseRow;
    const view=render(<CourseListRow row={missing} lens={lens} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-figure')?.textContent).toBe('—');
  });
  it('Lowest rounds swaps the record detail to rounds', () => {
    const view=render(<CourseListRow row={row} lens="lowest" onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-record')?.textContent).toBe('869 rounds · ');
    expect(view.container.querySelector('.course-list-row-figure')?.textContent).toBe('63');
  });
  it('Top 100 no rounds has no figure or record', () => {
    const view=render(<CourseListRow row={{...row,rounds:0}} lens="rated" top100 onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-figure')?.textContent).toBe('—');
    expect(view.container.querySelector('.course-list-row-record')).toBeNull();
  });
  it('search uses the same original position as cards', () => {
    const full=[row,{...row,course_id:'two',name:'Trump International Golf Links'}];
    const positions=courseListPositions(full);const found=full.filter(r => r.name.includes('Trump'))[0];
    const view=render(<CourseListRow row={found} lens="played" rank={positions.get(found.course_id)} onClick={() => {}} />);
    expect(view.container.querySelector('.course-list-row-position')?.textContent).toBe('2');
  });
  it('list and card taps invoke the same navigation callback', () => {
    const open=vi.fn();
    const view=render(<BrowseCourseCard row={row} onClick={open} />);
    fireEvent.click(screen.getByRole('button',{name:`View ${row.name}`}));
    view.rerender(<CourseListRow row={row} lens="played" onClick={open} />);
    fireEvent.click(screen.getByRole('button',{name:`View ${row.name}`}));
    expect(open).toHaveBeenCalledTimes(2);
  });
});