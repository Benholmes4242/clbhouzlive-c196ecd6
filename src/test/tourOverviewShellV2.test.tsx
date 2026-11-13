import React, { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PageLoadGate, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { EMPTY_OVERVIEW_SHAPE, OVERVIEW_SHAPE_MAX_AGE, ShapeAfterReveal, TourOverviewShell, readOverviewShape, writeOverviewShape } from '@/features/tourhub/components/overview-v3/overviewShells';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const item = { headline: 2 as const, details: 1 as const };
const also = { tie: true, rows: 4, sitLines: 1 as const };
const full = { ...EMPTY_OVERVIEW_SHAPE, chips: true, movers: true, boardRows: 10, fullLeaderboard: true, picks: { sentenceLines: 1 as const, recordLines: 1 as const }, leadersRows: 3, storyBand: true, alsoEvents: [also, { ...also, rows: 3 }, { ...also, tie: false, rows: 3 }], comingNext: { lastLines: 1 as const, nameLines: 1 as const }, comingMonths: [[1, 2, 1], [2]] as Array<Array<1 | 2>>, rankingsRows: 5, climb: true, newsLead: true, newsPair: [item, item] as [typeof item, typeof item], newsList: [item, { headline: 3 as const, details: 2 as const }, item] };
const store = (changes: Record<string, unknown> = {}) => localStorage.setItem('tour-overview-shape:v4:all', JSON.stringify({ ...full, at: 1000, ...changes }));
describe('Tour counted skeleton shape v4', () => {
 it('round-trips every v4 shape field', () => { writeOverviewShape('pga', full); expect(readOverviewShape('pga')).toEqual({ ...full, at: expect.any(Number) }); });
 it('clamps scalar counts at their lower bound', () => { store({ boardRows: -1, leadersRows: -1, rankingsRows: -1 }); expect(readOverviewShape('all', 1000)).toMatchObject({ boardRows: 0, leadersRows: 0, rankingsRows: 0 }); });
 it('clamps bounded scalar counts', () => { store({ boardRows: 11, leadersRows: 4, rankingsRows: 6 }); expect(readOverviewShape('all', 1000)).toMatchObject({ boardRows: 10, leadersRows: 3, rankingsRows: 5 }); });
 it('expires only after twelve hours', () => { store(); expect(readOverviewShape('all', 1000 + OVERVIEW_SHAPE_MAX_AGE)).toEqual({ ...full, at: 1000 }); expect(readOverviewShape('all', 1001 + OVERVIEW_SHAPE_MAX_AGE)).toEqual(EMPTY_OVERVIEW_SHAPE); });
 it('rejects malformed storage', () => { localStorage.setItem('tour-overview-shape:v4:all', '{'); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); });
 it('rejects wrong types in every field', () => { for (const key of Object.keys(full)) { store({ [key]: 'wrong' }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); } store({ at: '1000' }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); store({ comingMonths: [[1, '2']] }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); });
 it('rejects future timestamps', () => { store({ at: 1001 }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); });
 it('ignores v1, v2 and v3 and preserves their keys', () => { const old = JSON.stringify({ board: true, at: Date.now() }); localStorage.setItem('tour-overview-shape:all', old); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); localStorage.setItem('tour-overview-shape:v2:all', old); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); localStorage.setItem('tour-overview-shape:v3:all', old); expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE); writeOverviewShape('all', full); expect(localStorage.getItem('tour-overview-shape:v3:all')).toBe(old); expect(localStorage.getItem('tour-overview-shape:all')).toBe(old); expect(localStorage.getItem('tour-overview-shape:v2:all')).toBe(old); });
 it('keeps lenses separate', () => { writeOverviewShape('pga', full); writeOverviewShape('euro', EMPTY_OVERVIEW_SHAPE); expect(readOverviewShape('pga').boardRows).toBe(10); expect(readOverviewShape('euro').boardRows).toBe(0); expect(readOverviewShape('all')).toEqual(EMPTY_OVERVIEW_SHAPE); });
 it('records mounted marker counts and measured per-item arrays', () => {
   vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { const lines = Number(this.getAttribute('data-lines') ?? 1); return { height: lines * 20 } as DOMRect; });
   function News({ kind, headline, details }: { kind: string; headline: number; details: number }) { return <div data-news-shape={kind}><h3 data-lines={headline} style={{ lineHeight: '20px' }} /><div className="overview-news-details" data-lines={details} style={{ lineHeight: '20px' }} /></div>; }
   function Content() { const ref = useRef<HTMLDivElement>(null); useSectionReady('hero', true); return <div ref={ref}><ShapeAfterReveal lens="all" root={ref} /><div data-overview-chip-row /><div data-overview-movement /><div data-hero-full-leaderboard /><div data-overview-picks /><div data-overview-story-band />{Array.from({ length: 10 }, (_, i) => <div key={i} data-hero-board-row />)}{full.alsoEvents.map((event, i) => <React.Fragment key={i}><div data-leaders-group-row /><div data-also-event data-overview-band="alsoThisWeek">{event.tie && <div data-hero-tie-cap />}{Array.from({ length: event.rows }, (_, j) => <div key={j} data-hero-board-row />)}<div className="also-sit" data-lines={event.sitLines} style={{ lineHeight: '20px' }} /></div></React.Fragment>)}<div data-coming-next />{full.comingMonths.map((month, i) => <React.Fragment key={i}><div data-coming-month />{month.map((lines, j) => <div key={j} data-coming-up-item><div className="coming-row-name" data-lines={lines} style={{ lineHeight: '20px' }} /></div>)}</React.Fragment>)}{[0, 1, 2, 3, 4].map(i => <div key={i} data-rank-row />)}<div data-climb-card /><div data-news-shape="hero" />{full.newsPair.map((item, i) => <News key={i} kind="pair" {...item} />)}{full.newsList.map((item, i) => <News key={i} kind="row" {...item} />)}</div>; }
   render(<PageLoadGate expect={['hero']}><Content /></PageLoadGate>); expect(readOverviewShape()).toEqual({ ...full, at: expect.any(Number) });
 });
 it('renders present bands in page order and omits absent bands', () => { const { container, rerender } = render(<TourOverviewShell shape={full} />); const names = () => [...container.querySelectorAll('[data-tour-shell]')].map(n => n.getAttribute('data-tour-shell')); expect(names()).toEqual(['hero', 'chips', 'movers', 'board', 'picks', 'leaders', 'story', 'alsoThisWeek', 'comingUp', 'rankings', 'news']); rerender(<TourOverviewShell shape={EMPTY_OVERVIEW_SHAPE} />); expect(names()).toEqual(['hero']); });
 it('renders exactly every remembered row and item count', () => { const { container } = render(<TourOverviewShell shape={full} />); expect(container.querySelectorAll('[data-tour-shell="board"] [data-shell-board-row]')).toHaveLength(10); expect(container.querySelectorAll('[data-shell-leaders-row]')).toHaveLength(3); expect(container.querySelectorAll('[data-shell-also-event]')).toHaveLength(3); expect(container.querySelectorAll('[data-shell-coming-row]')).toHaveLength(4); expect(container.querySelectorAll('.coming-month')).toHaveLength(2); expect(container.querySelectorAll('[data-shell-rank-row]')).toHaveLength(5); expect(container.querySelectorAll('[data-shell-news-list]')).toHaveLength(3); });
 it('contains only neutral surfaces and no svg', () => { const { container } = render(<TourOverviewShell shape={full} />); expect(container.querySelector('svg')).toBeNull(); const allowed = new Set(['', 'transparent', 'rgb(10, 10, 12)', 'rgb(22, 22, 26)', 'rgb(30, 30, 35)', 'rgb(38, 38, 44)']); for (const node of container.querySelectorAll<HTMLElement>('*')) { expect(allowed.has(node.style.backgroundColor)).toBe(true); expect(node.style.color).not.toMatch(/green|red|rgb\(0, 128, 0\)|rgb\(255, 0, 0\)/); } });
 it('rejects every malformed per-item array', () => {
   const bad: Record<string, unknown[]> = {
     alsoEvents: [null, {}, [null], [{ ...also, tie: 1 }], [{ ...also, rows: -1 }], [{ ...also, rows: 5 }], [{ ...also, rows: 1.5 }], [{ ...also, sitLines: 0 }], [{ ...also, sitLines: 3 }], [also, also, also, also]],
     comingMonths: [null, {}, [1], [[0]], [[3]], [[1.5]], [['1']], [[1, 1, 1, 1, 1, 1, 1]], [[], [], [], []]],
     newsList: [null, {}, [null], [{ headline: 0, details: 1 }], [{ headline: 4, details: 1 }], [{ headline: 1, details: 0 }], [{ headline: 1, details: 3 }], [{ headline: '2', details: 1 }], [item, item, item, item]],
     newsPair: [false, {}, [], [item], [item, item, item], [item, null], [item, { headline: 2, details: '1' }]],
   };
   for (const [key, values] of Object.entries(bad)) for (const value of values) { store({ [key]: value }); expect(readOverviewShape('all', 1000), `${key}: ${JSON.stringify(value)}`).toEqual(EMPTY_OVERVIEW_SHAPE); }
 });
 it('renders the supplied tie, player and situation parts', () => {
   const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, alsoEvents: [{ tie: true, rows: 4, sitLines: 2 }, { tie: true, rows: 3, sitLines: 1 }, { tie: false, rows: 3, sitLines: 1 }] }} />);
   const events = [...container.querySelectorAll('[data-shell-also-event]')];
   expect(events.map(node => node.querySelectorAll('[data-shell-tie-row]').length)).toEqual([1, 1, 0]);
   expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([4, 3, 3]);
   expect(events.map(node => node.querySelectorAll('.also-sit [data-shell-bar]').length)).toEqual([2, 1, 1]);
 });
 it('renders the supplied coming names and news headline and details lines', () => {
   const { container } = render(<TourOverviewShell shape={full} />);
   expect([...container.querySelectorAll('.coming-row-name')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([1, 2, 1, 2]);
   expect([...container.querySelectorAll('.overview-news-row h3')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([2, 3, 2]);
   expect([...container.querySelectorAll('.overview-news-row .overview-news-details')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([1, 2, 1]);
   expect([...container.querySelectorAll('.overview-news-pair h3')].map(node => node.querySelectorAll('[data-shell-bar]').length)).toEqual([2, 2]);
 });
 it('places the story outside the column with a 26px top margin', () => {
   const { container } = render(<TourOverviewShell shape={full} />); const story = container.querySelector('[data-tour-shell="story"]'); const column = container.querySelector('[data-shell-below-column]');
   expect(story?.parentElement).toBe(column?.parentElement); expect(story?.nextElementSibling).toBe(column); expect(story).toHaveStyle({ marginTop: '26px' }); expect(column).toHaveStyle({ paddingTop: '32px', gap: '32px' });
 });

 it('rejects malformed v4 picks and Coming next objects', () => {
   for (const picks of [true, [], {}, { sentenceLines: 0, recordLines: 1 }, { sentenceLines: 4, recordLines: 1 }, { sentenceLines: 1, recordLines: 0 }, { sentenceLines: 1, recordLines: 3 }, { sentenceLines: '1', recordLines: 1 }, { sentenceLines: 1.5, recordLines: 1 }]) { store({ picks }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); }
   for (const comingNext of [true, [], {}, { lastLines: 0, nameLines: 1 }, { lastLines: 4, nameLines: 1 }, { lastLines: 1, nameLines: 0 }, { lastLines: 1, nameLines: 4 }, { lastLines: '1', nameLines: 1 }, { lastLines: 1, nameLines: 1.5 }]) { store({ comingNext }); expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE); }
 });
 it('measures picks sentence, record and Coming next text at reveal', () => {
   vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) { return { height: Number(this.getAttribute('data-lines') ?? 1) * 20 } as DOMRect; });
   function Content() { const ref = useRef<HTMLDivElement>(null); useSectionReady('hero', true); return <div ref={ref}><ShapeAfterReveal lens="all" root={ref} /><div data-overview-picks><p data-overview-picks-intro data-lines="3" style={{ lineHeight: '20px' }} /><div data-our-record-door data-lines="2" style={{ lineHeight: '20px' }} /></div><div data-coming-next><div className="coming-name" data-lines="2" style={{ lineHeight: '20px' }} /><div className="coming-last-text" data-lines="3" style={{ lineHeight: '20px' }} /></div></div>; }
   render(<PageLoadGate expect={['hero']}><Content /></PageLoadGate>);
   expect(readOverviewShape()).toMatchObject({ picks: { sentenceLines: 3, recordLines: 2 }, comingNext: { lastLines: 3, nameLines: 2 } });
 });
 it('draws exactly the supplied picks and Coming next lines', () => {
   const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { sentenceLines: 3, recordLines: 2 }, comingNext: { lastLines: 3, nameLines: 2 } }} />);
   expect(container.querySelectorAll('[data-shell-picks-sentence] [data-shell-bar]')).toHaveLength(3);
   expect(container.querySelectorAll('[data-shell-picks-record] [data-shell-bar]')).toHaveLength(2);
   expect(container.querySelectorAll('.coming-name [data-shell-bar]')).toHaveLength(2);
   expect(container.querySelectorAll('.coming-last-text [data-shell-bar]')).toHaveLength(3);
 });

 it('counts one text line inside a padded min-height record row', () => {
   vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ height: 34 } as DOMRect);
   Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ height: 17.55 }) });
   function Content() { const ref = useRef<HTMLDivElement>(null); useSectionReady('hero', true); return <div ref={ref}><ShapeAfterReveal lens="all" root={ref} /><div data-overview-picks><div data-our-record-door style={{ padding: '8px 20px', minHeight: 32, lineHeight: '17.55px' }}><span data-pick-record-figures style={{ lineHeight: '17.55px' }}>3 wins · 15 top 10s</span><span> from 11 events</span></div></div></div>; }
   render(<PageLoadGate expect={['hero']}><Content /></PageLoadGate>);
   expect(readOverviewShape().picks?.recordLines).toBe(1);
   Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
 });
 it('wraps all also-week events in one sibling after the head', () => {
   const { container } = render(<TourOverviewShell shape={full} />);
   const section = container.querySelector('[data-tour-shell="alsoThisWeek"]');
   const wrapper = section?.querySelector('[data-shell-also-events]');
   expect(section?.children).toHaveLength(2);
   expect(wrapper?.previousElementSibling).toBe(section?.firstElementChild);
   expect(wrapper?.children).toHaveLength(3);
   expect([...container.querySelectorAll('[data-shell-also-event]')].every(node => node.parentElement === wrapper)).toBe(true);
 });

});