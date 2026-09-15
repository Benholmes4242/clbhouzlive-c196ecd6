import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ExploreCard, courseHandicapLabel } from '@/features/explore-magazine/ExploreCard';
import { calloutFor } from '@/features/explore-magazine/cardTreatment';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

/**
 * C4: NET AND PLAYING HANDICAP AS PHOTO CHIPS, AND THE NET ACHIEVEMENTS.
 *
 * THE POINT OF EVERY TEST HERE is that a card with no net facts renders exactly
 * as it did before - private handicap, missing data and un-applied SQL all look
 * the same to the card, and none of them may invent a figure.
 */
function round(facts: StreamItem['facts'], patch: Partial<StreamItem> = {}): StreamItem {
  return {
    id: 'round:1',
    kind: 'round',
    ring: 'own',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: { course_id: null, course_name: 'Sundridge Park', region: null, sub_country: null, image_url: null, pending: false },
    who: { user_id: 'u', display_name: 'A member', photo_url: null, is_viewer: false },
    facts,
    payload: {},
    seen: false,
    ...patch,
  };
}

function chipRow(facts: StreamItem['facts']) {
  const { container } = render(<ExploreCard item={round(facts)} size="std" onTap={() => {}} />);
  return container.querySelector('[data-explore-chip-row="round"]') as HTMLElement | null;
}

describe('net and playing handicap chips', () => {
  it('shows only the gross chip when either fact is missing', () => {
    for (const facts of [
      { gross: 82, course_par: 71, to_par: 11 },
      { gross: 82, course_par: 71, to_par: 11, net: 76 },
      { gross: 82, course_par: 71, to_par: 11, course_handicap: 6 },
      { gross: 82, course_par: 71, to_par: 11, net: null, course_handicap: 6 },
    ]) {
      const row = chipRow(facts);
      expect(row).not.toBeNull();
      expect(row!.querySelectorAll('[data-explore-chip]')).toHaveLength(0);
      expect(row!.textContent).toContain('82');
    }
  });

  it('shows both chips when both facts are present', () => {
    const row = chipRow({ gross: 82, course_par: 71, to_par: 11, net: 76, course_handicap: 6 });
    const chips = row!.querySelectorAll('[data-explore-chip]');
    expect(chips).toHaveLength(2);
    expect(chips[0].getAttribute('data-explore-chip')).toBe('net');
    expect(chips[0].textContent).toBe('NET76');
    expect(chips[1].textContent).toBe('HCP6');
  });

  it('writes a plus handicap the WHS way', () => {
    expect(courseHandicapLabel(-1)).toBe('+1');
    expect(courseHandicapLabel(0)).toBe('0');
    expect(courseHandicapLabel(4)).toBe('4');
    const row = chipRow({ gross: 71, course_par: 71, to_par: 0, net: 72, course_handicap: -1 });
    expect(row!.querySelectorAll('[data-explore-chip]')[1].textContent).toBe('HCP+1');
  });

  it('never colours the net value, even under par', () => {
    const row = chipRow({ gross: 68, course_par: 71, to_par: -3, net: 62, course_handicap: 6 });
    const value = row!.querySelector('[data-explore-chip-value="net"]') as HTMLElement;
    expect(value.style.color).toBe('rgb(255, 255, 255)');
  });

  it('keeps the three chips on one row with fixed gaps', () => {
    const row = chipRow({ gross: 104, course_par: 72, to_par: 32, net: 76, course_handicap: -4 });
    expect(row!.style.flexDirection).toBe('row');
    expect(row!.style.flexWrap).toBe('nowrap');
    expect(row!.style.gap).toBe('6px');
    /* The longest realistic case at 320: "104 +32", "NET 76", "HCP +4". */
    expect(row!.textContent).toBe('104+32NET76HCP+4');
  });
});

describe('net achievements in the callout', () => {
  const gross = round({ gross: 68 }, { consequence: { kind: 'record_taken' }, facts: { gross: 68, net_record: true } });

  it('puts the gross record above the net record', () => {
    expect(calloutFor(gross)?.kind).toBe('record');
  });

  it('puts the net record above rank_up', () => {
    const item = round({ gross: 82, net_record: true }, { consequence: { kind: 'rank_up', n: 3 } });
    expect(calloutFor(item)?.kind).toBe('net_record');
  });

  it('refuses a net record on a backlog round or a lost board', () => {
    expect(calloutFor(round({ gross: 82, net_record: true }, { lane: 'backlog' }))).toBeNull();
    expect(
      calloutFor(round({ gross: 82, net_record: true }, { consequence: { kind: 'record_lost' } }))?.kind,
    ).not.toBe('net_record');
  });

  it('puts a handicap cut above beat handicap, and states both figures', () => {
    const item = round({
      gross: 78,
      course_par: 71,
      net: 68,
      course_handicap: 10,
      handicap_cut: { from: 11.2, to: 10.4 },
    });
    expect(calloutFor(item)).toEqual({ kind: 'handicap_cut', from: 11.2, to: 10.4 });
  });

  it('ignores a cut that is not a cut', () => {
    const item = round({
      gross: 78,
      course_par: 71,
      net: 72,
      course_handicap: 6,
      handicap_cut: { from: 10.4, to: 11.2 },
    });
    expect(calloutFor(item)).toBeNull();
  });

  it('shows beat handicap only when net is below par, with the right margin', () => {
    expect(calloutFor(round({ gross: 78, course_par: 71, net: 68, course_handicap: 10 }))).toEqual({
      kind: 'beat_handicap',
      by: 3,
    });
    expect(calloutFor(round({ gross: 78, course_par: 71, net: 71, course_handicap: 7 }))).toBeNull();
    expect(calloutFor(round({ gross: 78, course_par: 71, net: 74, course_handicap: 4 }))).toBeNull();
    /* No handicap, no claim: net alone is never enough. */
    expect(calloutFor(round({ gross: 78, course_par: 71, net: 68 }))).toBeNull();
  });

  it('keeps the whole ruled priority order', () => {
    const facts = {
      gross: 68,
      course_par: 71,
      net: 60,
      course_handicap: 8,
      net_record: true,
      holes_in_one: 1,
      albatrosses: 1,
      eagles: 1,
      birdies: 6,
      clean_card: true,
      handicap_cut: { from: 9.1, to: 8.4 },
    };
    const order = [
      ['record', { consequence: { kind: 'record_taken' as const } }],
      ['net_record', {}],
      ['ace', { facts: { ...facts, net_record: false } }],
    ] as const;
    expect(calloutFor(round(facts, { consequence: { kind: 'record_taken' }, facts }))?.kind).toBe(order[0][0]);
    expect(calloutFor(round(facts))?.kind).toBe('net_record');
    expect(calloutFor(round({ ...facts, net_record: false }))?.kind).toBe('ace');
    expect(calloutFor(round({ ...facts, net_record: false, holes_in_one: 0 }))?.kind).toBe('albatross');
    expect(calloutFor(round({ ...facts, net_record: false, holes_in_one: 0, albatrosses: 0 }))?.kind).toBe('eagle');
    expect(
      calloutFor(round({ ...facts, net_record: false, holes_in_one: 0, albatrosses: 0, eagles: 0 }))?.kind,
    ).toBe('handicap_cut');
    expect(
      calloutFor(
        round({ ...facts, net_record: false, holes_in_one: 0, albatrosses: 0, eagles: 0, handicap_cut: null }),
      )?.kind,
    ).toBe('beat_handicap');
    expect(
      calloutFor(
        round({
          ...facts,
          net: 74,
          net_record: false,
          holes_in_one: 0,
          albatrosses: 0,
          eagles: 0,
          handicap_cut: null,
        }),
      )?.kind,
    ).toBe('birdies');
    expect(
      calloutFor(
        round({
          ...facts,
          net: 74,
          net_record: false,
          holes_in_one: 0,
          albatrosses: 0,
          eagles: 0,
          birdies: 0,
          handicap_cut: null,
        }),
      )?.kind,
    ).toBe('clean');
  });
});
