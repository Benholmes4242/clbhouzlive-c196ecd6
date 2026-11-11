import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { compareRows, argumentGroups, whyLine, type ArgumentInput } from '@/components/courses/top100/theArgument';
import { chartRows, Top100CompareChart } from '@/components/courses/top100/Top100CompareChart';
import { Top100OneRatingAway, oneRatingAway } from '@/components/courses/top100/Top100OneRatingAway';
import { Top100YourHundred } from '@/components/courses/top100/Top100YourHundred';
import { TheArgumentSection } from '@/components/courses/top100/TheArgumentSection';
import { communityOrder } from '@/components/courses/top100/communityOrder';
import fixture from './top100GbiFixture.json';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/top100/useTop100Race', () => ({ useTop100Race: () => ({ data: [{ user_id: 'me', pos: 3, total_members: 35 }], isError: false }) }));
vi.mock('@/components/courses/top100/Top100RaceSection', () => ({ Top100RaceSection: () => <div data-testid="existing-race" /> }));
const rows = compareRows(fixture);
const byName = (name: string) => { const row = rows.find(row => row.name.includes(name)); if (!row) throw new Error(name); return row; };
const mount = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);
afterEach(cleanup);

describe('signed-off GB&I comparison', () => {
  it('Kingsbarns is first among golfers and fifth in the qualifying published order', () => { expect(byName('Kingsbarns')).toMatchObject({ memberRank: 1, listRank: 5, publishedRank: 12 }); expect(rows).toHaveLength(19); });
  it('Gleneagles rises nine', () => expect(byName('Gleneagles').divergence).toBe(9));
  it('Turnberry falls nine', () => expect(byName('Turnberry').divergence).toBe(-9));
  it('seven courses share the top ten', () => expect(rows.filter(row => row.memberRank <= 10 && row.listRank <= 10)).toHaveLength(7));
  it.each([
    ['Gleneagles', 'Best design and clubhouse of the 19'],
    ['Queenwood', 'Best facilities of the 19'],
    ['Turnberry', 'Weakest on condition: 8.9, 13th of the 19'],
    ['European Club', 'Lowest facilities and clubhouse of the 19'],
  ])('why for %s', (name, why) => expect(whyLine(byName(name), 19)).toBe(why));
  it('equal order uses agreement', () => expect(whyLine({ ...rows[0], divergence: 0, memberRank: 2 }, 19)).toBe('Golfers and the list agree: 2nd of the 19'));
  it('groups derive three per side from every qualifying row', () => { const groups = argumentGroups(fixture); expect(groups.higher).toHaveLength(3); expect(groups.lower).toHaveLength(3); });
  it('requires three qualifying courses for the section', () => { mount(<TheArgumentSection rows={rows.slice(0, 2)} higher={[]} lower={[]} ratedCount={2} onOpenCourse={vi.fn()} />); expect(screen.queryByRole('heading')).toBeNull(); });
  it('headline uses leader published rank', () => { const groups = argumentGroups(fixture); mount(<TheArgumentSection rows={rows} {...groups} ratedCount={19} listLabel="GB&I" onOpenCourse={vi.fn()} />); expect(screen.getByRole('heading').textContent).toBe('Golfers put Kingsbarns 1st. The list has it 12th.'); });
});
describe('chart selection and caps', () => {
  it('19 is capped at ten gaps in list order', () => { mount(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />); expect(screen.getAllByRole('button', { name: /^Compare / })).toHaveLength(10); expect(chartRows(rows).map(row => row.listRank)).toEqual([...chartRows(rows)].sort((a,b) => a.listRank-b.listRank).map(row => row.listRank)); expect(screen.getByText('The 10 biggest gaps of the 19, in official order')).toBeInTheDocument(); expect(screen.getByRole('button', { name: /SEE ALL 19/ })).toBeInTheDocument(); });
  it('12 renders all rows with no cap or all link', () => { mount(<Top100CompareChart rows={rows.slice(0,12)} onOpenCourse={vi.fn()} />); expect(screen.getAllByRole('button', { name: /^Compare / })).toHaveLength(12); expect(screen.queryByText(/biggest gaps/)).toBeNull(); expect(screen.queryByRole('button', { name: /SEE ALL/ })).toBeNull(); });
  it('all sheet contains every row', () => { mount(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />); fireEvent.click(screen.getByRole('button', { name: /SEE ALL 19/ })); expect(screen.getAllByRole('button', { name: /^Compare / })).toHaveLength(29); });
  it('selection dims siblings and detail opens the id; repeat clears', () => { const open = vi.fn(); mount(<Top100CompareChart rows={rows} onOpenCourse={open} />); const row = chartRows(rows)[0]; const button = screen.getByRole('button', { name: `Compare ${row.name}` }); fireEvent.click(button); expect(button).toHaveAttribute('aria-pressed','true'); expect(screen.getAllByRole('button', { name: /^Compare / }).filter(node => node.classList.contains('dimmed'))).toHaveLength(9); fireEvent.click(screen.getByRole('button', { name: `${row.name}, view course` })); expect(open).toHaveBeenCalledWith(row.id); fireEvent.click(button); expect(button).toHaveAttribute('aria-pressed','false'); });
});
const near: ArgumentInput[] = Array.from({ length: 12 }, (_, i) => ({ id: `near${i}`, name: `Near ${i}`, imageUrl: null, publishedRank: 12-i, rating: 9.9, ratingCount: 2 }));
describe('one rating away', () => {
  it('exactly two, in published order, excludes viewer rated and caps eight', () => { const rated = new Set(['near11']); expect(oneRatingAway([...near, { ...near[0], id:'one',ratingCount:1 }, { ...near[0],id:'three',ratingCount:3 }],rated)).toHaveLength(11); mount(<Top100OneRatingAway inputs={near} ratedIds={rated} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />); expect(screen.getAllByRole('button', { name: /^Rate / })).toHaveLength(8); expect(screen.getAllByRole('button', { name: /^Rate / })[0]).toHaveAttribute('aria-label', 'Rate Near 10'); });
  it('empty is hidden', () => { const { container } = mount(<Top100OneRatingAway inputs={[]} ratedIds={new Set()} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />); expect(container.firstChild).toBeNull(); });
  it('rate action passes course to existing flow callback', () => { const rate = vi.fn(); mount(<Top100OneRatingAway inputs={[near[0]]} ratedIds={new Set()} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={rate} />); fireEvent.click(screen.getByRole('button', { name: 'Rate Near 0' })); expect(rate).toHaveBeenCalledWith('near0'); });
  it('two ratings at 9.9 never enters golfers ranked list', () => { const result = communityOrder(near, row => ({ rating:row.rating,ratingCount:row.ratingCount }),row=>row.publishedRank,row=>row.name); expect(result.rated).toHaveLength(0); expect(result.unrated).toHaveLength(12); });
});
const dropdown = { listSlug:'gb-i',viewerPlayed:23,total:100,courseIds:[],enrichment:new Map(),subjects:new Map() };
describe('Your hundred sheet', () => {
  it('under five is absent', () => { mount(<Top100YourHundred viewerId="me" list="gb-i" dropdown={{...dropdown,viewerPlayed:4}} onOpenCourse={vi.fn()} />); expect(screen.queryByRole('button')).toBeNull(); });
  it('23 of 100 and third of 35 opens existing race and dropdown only in sheet', async () => { mount(<Top100YourHundred viewerId="me" list="gb-i" dropdown={dropdown} onOpenCourse={vi.fn()} />); expect(screen.getByRole('button', { name:'Open Your hundred' }).textContent).toContain('23 of 100 · 3rd of 35'); expect(screen.queryByTestId('existing-race')).toBeNull(); expect(screen.queryByText('Your courses')).toBeNull(); fireEvent.click(screen.getByRole('button', { name:'Open Your hundred' })); await waitFor(() => expect(screen.getByTestId('existing-race')).toBeInTheDocument()); expect(screen.getByText('Your courses')).toBeInTheDocument(); });
});