import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { whoPlaysLead } from '@/features/business/clubAnalytics/whoPlaysLead';
import { WhoPlaysSection } from '@/features/business/clubAnalytics/sections';

const LABELS = ['Plus', 'Scratch to 4.9', '5 to 9.9', '10 to 14.9', '15 to 19.9', '20 to 27.9', '28 and above'];
const mk = (r: number[], labels = LABELS) => r.map((rounds, i) => ({ label: labels[i], rounds, members: 2 }));
const line = (l: ReturnType<typeof whoPlaysLead>['line']) =>
  !l ? null : l.kind === 'none' ? `No rounds yet from golfers off ${l.y} and above.` : `Golfers off ${l.y} and above play ${l.q}%: the group you see least.`;
const data = (bands: ReturnType<typeof mk>) => ({ handicap_bands: bands, handicap_rounds: bands.reduce((s, b) => s + b.rounds, 0), members: 21 }) as any;

describe('whoPlaysLead', () => {
  it('Sundridge East', () => {
    const l = whoPlaysLead(mk([150, 267, 338, 96, 23, 14, 3]));
    expect(l.title).toBe('85% of rounds come from golfers off under 10');
    expect(line(l.line)).toBe('Golfers off 15 and above play 4%: the group you see least.');
    expect(l.few).toEqual([4, 5, 6]);
  });
  it('broad spread', () => {
    const l = whoPlaysLead(mk([12, 141, 388, 512, 451, 433, 203]));
    expect(l.title).toBe('70% of rounds come from golfers off under 20');
    expect(line(l.line)).toBe('Golfers off 28 and above play 9%: the group you see least.');
  });
  it('early', () => {
    const l = whoPlaysLead(mk([0, 0, 2, 4, 3, 3, 0]));
    expect(l.title).toBe('75% of rounds come from golfers off under 20');
    expect(line(l.line)).toBe('No rounds yet from golfers off 28 and above.');
  });
  it('top band alone at 10% or more gives no line', () => {
    const l = whoPlaysLead(mk([10, 10, 10, 10, 10, 10, 40]));
    expect(l.line).toBeNull(); expect(l.few).toEqual([]);
  });
  it('plus alone at 60% uses plus wording', () => {
    expect(whoPlaysLead(mk([70, 10, 5, 5, 4, 3, 3])).title).toBe('70% of rounds come from plus-handicap golfers');
  });
  it('needing every band gives the plain title', () => {
    expect(whoPlaysLead(mk([1, 1, 1, 1, 1, 1, 50])).title).toBe('Rounds by the handicap index played off');
  });
  it('unreadable label gives no title or line', () => {
    const l = whoPlaysLead(mk([150, 267, 338, 96, 23, 14, 3], [...LABELS.slice(0, 6), 'Beginners']));
    expect(l.title).toBeNull(); expect(l.line).toBeNull();
  });
});

describe('WhoPlaysSection', () => {
  it('renders title, line, few rows and "and up"', () => {
    render(<WhoPlaysSection data={data(mk([150, 267, 338, 96, 23, 14, 3]))} />);
    expect(screen.getByTestId('who-plays-title').textContent).toBe('85% of rounds come from golfers off under 10');
    expect(screen.getByTestId('who-plays-line').textContent).toBe('Golfers off 15 and above play 4%: the group you see least.');
    const rows = screen.getAllByTestId('who-plays-row');
    expect(rows.map(r => r.getAttribute('data-few'))).toEqual(['false', 'false', 'false', 'false', 'true', 'true', 'true']);
    expect(rows[6].textContent).toContain('28 and up');
  });
  it('unreadable label shows rows only', () => {
    render(<WhoPlaysSection data={data(mk([150, 267, 338, 96, 23, 14, 3], [...LABELS.slice(0, 6), 'Beginners']))} />);
    expect(screen.queryByTestId('who-plays-title')).toBeNull(); expect(screen.queryByTestId('who-plays-line')).toBeNull();
    expect(screen.getAllByTestId('who-plays-row')).toHaveLength(7);
  });
  it('no golfer counts or old paragraph', () => {
    const v = render(<WhoPlaysSection data={data(mk([150, 267, 338, 96, 23, 14, 3]))} />);
    expect(v.container.textContent).not.toMatch(/golfers? *$|\d+ golfers?\b/i);
    expect(v.container.textContent).not.toMatch(/These golfer counts/);
  });
  it('zero rounds shows the empty card', () => {
    const v = render(<WhoPlaysSection data={data(mk([0, 0, 0, 0, 0, 0, 0]))} />);
    expect(screen.queryAllByTestId('who-plays-row')).toHaveLength(0);
    expect(v.container.textContent).toContain('no rounds with a handicap index');
  });
});
