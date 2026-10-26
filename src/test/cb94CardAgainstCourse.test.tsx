import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import * as rules from '@/features/courses/_shared/siLadder';
import { IndexDisagreesSection } from '@/features/business/clubAnalytics/sections';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const data = { holes: [], complete_rounds: 738 } as unknown as ClubCourseAnalytics;
function row(holeNo: number, strokeIndex: number, measuredRank: number, shotsGap: number, direction: rules.SiLadderDirection): rules.SiLadderRow {
  return { holeNo, strokeIndex, measuredRank, shotsGap, direction, avgToPar: 0, placesGap: measuredRank - strokeIndex, flagged: true };
}
function result(flagged: rules.SiLadderRow[]): rules.SiLadder {
  return { flagged, rows: [], shotsFloor: 0.0673, rounds: 738, sd: 0.2019 };
}
const sundridge = [row(10, 7, 12, -0.17, 'easier'), row(15, 11, 7, 0.12, 'harder'), row(4, 4, 8, -0.12, 'easier'), row(18, 5, 1, 0.4, 'harder')];
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('CB94 Card against course', () => {
  it('renders the brief-provided Sundridge result in harder/easier rank order without reading raw rows', () => {
    const spy = vi.spyOn(rules, 'buildSiLadder').mockReturnValue(result(sundridge));
    render(<IndexDisagreesSection data={data} />);
    expect(spy).toHaveBeenCalledWith(data.holes, 738);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Four holes play well away from where your card puts them');
    expect(screen.getAllByTestId('card-against-row').map(el => el.getAttribute('data-hole'))).toEqual(['18', '15', '4', '10']);
    expect(screen.getAllByTestId('card-shots').map(el => el.textContent)).toEqual(['+0.40', '+0.12', '−0.12', '−0.17']);
    const expected = [['18', '1st', '5'], ['15', '7th', '11'], ['4', '8th', '4'], ['10', '12th', '7']];
    screen.getAllByTestId('card-against-row').forEach((el, i) => {
      const [hole, rank, index] = expected[i];
      expect(el.textContent).toContain(`Hole ${hole} plays ${rank} hardestYour card makes it ${index}`);
    });
    expect(screen.getByTestId('card-against-course').lastElementChild?.textContent).toContain(`sits ${rules.SI_PLACES_GATE} or more places from its card and at least 0.07 of a shot away`);
    expect(screen.getByTestId('card-against-course').querySelector('svg')).toBeNull();
  });
  it('uses neutral canonical ink for harder and muted ink for easier shots', () => {
    vi.spyOn(rules, 'buildSiLadder').mockReturnValue(result(sundridge));
    render(<IndexDisagreesSection data={data} />);
    expect(screen.getAllByTestId('card-shots').map(el => el.style.color)).toEqual([
      'rgb(248, 250, 252)', 'rgb(248, 250, 252)', 'rgba(248, 250, 252, 0.62)', 'rgba(248, 250, 252, 0.62)',
    ]);
  });
  it('one harder hole gets singular title/group and no empty easier group', () => {
    vi.spyOn(rules, 'buildSiLadder').mockReturnValue(result([row(18, 5, 1, 0.4, 'harder')]));
    render(<IndexDisagreesSection data={data} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('One hole plays well away from where your card puts it');
    expect(within(screen.getByTestId('card-group-harder')).getByRole('heading').textContent).toBe('Plays harder than its card');
    expect(screen.queryByTestId('card-group-easier')).toBeNull();
  });
  it('one easier hole gets singular group and no empty harder group', () => {
    vi.spyOn(rules, 'buildSiLadder').mockReturnValue(result([row(10, 7, 12, -0.17, 'easier')]));
    render(<IndexDisagreesSection data={data} />);
    expect(within(screen.getByTestId('card-group-easier')).getByRole('heading').textContent).toBe('Plays easier than its card');
    expect(screen.queryByTestId('card-group-harder')).toBeNull();
  });
  it.each([[9, 'Nine'], [10, '10']])('writes count %i as %s', (count, label) => {
    vi.spyOn(rules, 'buildSiLadder').mockReturnValue(result(Array.from({ length: count }, (_, i) => row(i + 1, i + 5, i + 1, 0.4, 'harder'))));
    render(<IndexDisagreesSection data={data} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(`${label} holes play well away from where your card puts them`);
  });
  it('eligible real helper agreement renders no flagged rows', () => {
    const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, stroke_index: i + 1, avg_to_par: (18 - i) / 18 }));
    render(<IndexDisagreesSection data={{ holes, complete_rounds: 100 } as unknown as ClubCourseAnalytics} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Every hole plays close to where your card puts it');
    expect(screen.queryAllByTestId('card-against-row')).toHaveLength(0);
    expect(screen.getByTestId('card-against-course').textContent).toContain(`No hole sits ${rules.SI_PLACES_GATE} or more places`);
  });
  it('real helper under 100 full rounds renders nothing', () => {
    const view = render(<IndexDisagreesSection data={{ ...data, complete_rounds: 99 }} />);
    expect(view.container.childElementCount).toBe(0);
  });
});