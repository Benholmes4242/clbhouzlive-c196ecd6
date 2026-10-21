import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../../../public/locales/en/courses.json';
import { RareAirRail } from '../RareAirSection';
import { rareAirRarestFeat } from '../rareAir';
import type { FeatKind, FeatYearRow } from '../useFeatsWindow';

const row = (feat_kind: FeatKind, events: number): FeatYearRow => ({
  feat_kind, events, rounds_with: 0, members: 0, denominator: 18000, denominator_unit: 'holes',
  total_rounds: 1000, total_holes: 18000, total_members: 0, rounds_estimated: 0,
  viewer_events: 0, viewer_rounds_with: 0, latest_user_id: null, latest_display_name: null,
  latest_photo_url: null, latest_score_id: null, latest_course_id: null,
  latest_course_name: null, latest_play_date: null,
});

describe('CB22 all-time badge identity', () => {
  it('renders one badge on the rarest feat, not the achieved-first index zero', async () => {
    const rows = [row('albatross', 0), row('ace', 0), row('eagle', 20), row('clean_card', 30)];
    const allRows = [row('eagle', 100), row('ace', 5), row('clean_card', 300), row('albatross', 1)];
    const i18n = i18next.createInstance();
    await i18n.init({ lng: 'en', resources: { en: { courses: en } }, defaultNS: 'courses', interpolation: { escapeValue: false } });
    const { container } = render(<I18nextProvider i18n={i18n}>
      <RareAirRail rows={rows} allRows={allRows} window="year" onOpen={vi.fn()} />
    </I18nextProvider>);
    // Locate the existing pill structurally, without asserting translated copy.
    const tiles = [...container.querySelectorAll('button')];
    const pills = tiles.flatMap((tile) => [...tile.children[1].children[0].children].slice(1));
    expect(pills).toHaveLength(1);
    expect(pills[0].closest('button')).toBe(tiles[2]);
    expect(tiles[0].children[1].children[0].children).toHaveLength(1);
    expect(rareAirRarestFeat(rows, allRows)).toBe('albatross');
  });

  it('ties retain incoming rarity order, not allRows order or achieved-first order', () => {
    const rows = [row('albatross', 0), row('ace', 20), row('eagle', 20)];
    expect(rareAirRarestFeat(rows, [row('ace', 1), row('albatross', 1), row('eagle', 20)])).toBe('albatross');
  });

  it('unobserved all-time feats rank above finite rates, with one stable winner', () => {
    const rows = [row('albatross', 0), row('ace', 0), row('eagle', 20)];
    expect(rareAirRarestFeat(rows, rows)).toBe('albatross');
    expect(rareAirRarestFeat([], [])).toBeNull();
  });

  it('compares rounds per occurrence across hole and round units without the capped bar', () => {
    const rows = [row('ace', 0), row('albatross', 0), row('clean_card', 1)];
    const allRows = [
      { ...row('ace', 1), total_holes: 6000 * 18 },
      { ...row('albatross', 1), total_holes: 7000 * 18 },
      { ...row('clean_card', 1), denominator_unit: 'rounds' as const, total_rounds: 6500 },
    ];
    expect(rareAirRarestFeat(rows, allRows)).toBe('albatross');
  });
});