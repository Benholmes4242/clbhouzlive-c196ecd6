import { describe, expect, it } from 'vitest';
import i18next from 'i18next';
import type { TFunction } from 'i18next';

import en from '../../public/locales/en/courses.json';
import {
  chooseRarityFeat,
  congratulationName,
  featRarityLines,
  type FeatOwnerRow,
  type FeatRarityRow,
} from '@/features/explore-magazine/featRarity';

/**
 * THE EIGHT LIVE CASES (FEAT RARITY LINES §8).
 *
 * The frozen figures and the member_* fields below are the 9 backfilled rows of
 * public.gam_round_feat_rarity read straight off the project, not fixtures: the
 * five aces, three eagle braces and one albatross, with each owner's ordinal,
 * previous occurrence and round count as SQL returns them. The copy comes from
 * the shipped English locale file rather than a defaultValue, so a rename that
 * misses the locale fails here.
 *
 * "now" is pinned so the current-calendar-year month rule is testable at all.
 */
const instance = i18next.createInstance();
await instance.init({ lng: 'en', resources: { en: { courses: en } }, ns: ['courses'], defaultNS: 'courses' });
const t = instance.t as unknown as TFunction<'courses'>;
const NOW = new Date('2026-09-20T00:00:00Z');

type Live = {
  name: string;
  row: FeatRarityRow;
  owner: FeatOwnerRow;
  viewer: string;
  ownerLine: string;
};

const live: Live[] = [
  {
    name: 'SOLE HOLDER - ace #1, 2022-02-26',
    row: { feat_kind: 'ace', global_ordinal: 1, total_rounds_at_detection: 706, distinct_members_at_detection: 1 },
    owner: { feat_kind: 'ace', is_owner: true, member_ordinal: 1, member_rounds: 49, member_prev_at: null },
    viewer: 'The first ace in 706 rounds.',
    ownerLine: 'The first clbhouz member ever to achieve this.',
  },
  {
    name: 'RARE (two) - ace #2, 2022-12-04',
    row: { feat_kind: 'ace', global_ordinal: 2, total_rounds_at_detection: 1096, distinct_members_at_detection: 2 },
    owner: { feat_kind: 'ace', is_owner: true, member_ordinal: 1, member_rounds: 62, member_prev_at: null },
    viewer: 'The second ace in 1,096 rounds.',
    ownerLine: 'Only the second clbhouz member to achieve this.',
  },
  {
    name: 'RARE (three) - ace #3, 2023-01-29',
    row: { feat_kind: 'ace', global_ordinal: 3, total_rounds_at_detection: 1117, distinct_members_at_detection: 3 },
    owner: { feat_kind: 'ace', is_owner: true, member_ordinal: 1, member_rounds: 42, member_prev_at: null },
    viewer: 'The third ace in 1,117 rounds.',
    ownerLine: 'Only the third clbhouz member to achieve this.',
  },
  {
    name: 'REPEAT - ace #4, 2023-02-28',
    row: { feat_kind: 'ace', global_ordinal: 4, total_rounds_at_detection: 1139, distinct_members_at_detection: 3 },
    owner: { feat_kind: 'ace', is_owner: true, member_ordinal: 2, member_rounds: 71, member_prev_at: '2022-12-04' },
    viewer: 'The fourth ace in 1,139 rounds.',
    ownerLine: 'Your second ace. First since December 2022.',
  },
  {
    name: 'PERSONAL FIRST - ace #5, 2024-06-12',
    row: { feat_kind: 'ace', global_ordinal: 5, total_rounds_at_detection: 1894, distinct_members_at_detection: 4 },
    owner: { feat_kind: 'ace', is_owner: true, member_ordinal: 1, member_rounds: 62, member_prev_at: null },
    viewer: 'The fifth ace in 1,894 rounds.',
    ownerLine: 'Your first ace. 62 rounds in.',
  },
  {
    name: 'SOLE HOLDER - albatross #1, 2025-06-29',
    row: { feat_kind: 'albatross', global_ordinal: 1, total_rounds_at_detection: 2625, distinct_members_at_detection: 1 },
    owner: { feat_kind: 'albatross', is_owner: true, member_ordinal: 1, member_rounds: 122, member_prev_at: null },
    viewer: 'The first albatross in 2,625 rounds.',
    ownerLine: 'The first clbhouz member ever to achieve this.',
  },
  {
    name: 'REPEAT - eagle brace #2, 2024-06-15',
    row: { feat_kind: 'eagle_brace', global_ordinal: 2, total_rounds_at_detection: 1905, distinct_members_at_detection: 1 },
    owner: { feat_kind: 'eagle_brace', is_owner: true, member_ordinal: 2, member_rounds: 101, member_prev_at: '2021-08-14' },
    viewer: 'The second eagle brace in 1,905 rounds.',
    ownerLine: 'Your second eagle brace. First since August 2021.',
  },
  {
    name: 'RARE (two) - eagle brace #3, 2026-09-19',
    row: { feat_kind: 'eagle_brace', global_ordinal: 3, total_rounds_at_detection: 3563, distinct_members_at_detection: 2 },
    owner: { feat_kind: 'eagle_brace', is_owner: true, member_ordinal: 1, member_rounds: 221, member_prev_at: null },
    viewer: 'The third eagle brace in 3,563 rounds.',
    ownerLine: 'Only the second clbhouz member to achieve this.',
  },
];

describe('feat rarity lines against the live backfilled rows', () => {
  it.each(live.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const lines = featRarityLines({ rows: [c.row], owner: [c.owner], t, locale: 'en-GB', now: NOW });
    expect(lines.viewerLine).toBe(c.viewer);
    expect(lines.ownerLine).toBe(c.ownerLine);
  });

  it('draws the viewer line and NO owner line for a non-owner payload', () => {
    const c = live[3];
    const lines = featRarityLines({
      rows: [c.row],
      /* Exactly what SQL returns to somebody else: the member_* fields NULLed. */
      owner: [{ feat_kind: 'ace', is_owner: false, member_ordinal: null, member_rounds: null, member_prev_at: null }],
      t,
      locale: 'en-GB',
      now: NOW,
    });
    expect(lines.viewerLine).toBe(c.viewer);
    expect(lines.ownerLine).toBeNull();
  });

  it('renders nothing at all when a frozen figure is missing', () => {
    const lines = featRarityLines({
      rows: [{ feat_kind: 'ace', global_ordinal: 4, total_rounds_at_detection: null, distinct_members_at_detection: 3 }],
      owner: null,
      t,
      locale: 'en-GB',
      now: NOW,
    });
    expect(lines.viewerLine).toBeNull();
    expect(lines.ownerLine).toBeNull();
  });

  it('says one thing when a round holds two feats: higher tier, then lower ordinal', () => {
    const ace: FeatRarityRow = { feat_kind: 'ace', global_ordinal: 6, total_rounds_at_detection: 4000, distinct_members_at_detection: 4 };
    const albatross: FeatRarityRow = { feat_kind: 'albatross', global_ordinal: 2, total_rounds_at_detection: 4000, distinct_members_at_detection: 2 };
    expect(chooseRarityFeat([ace, albatross])?.feat_kind).toBe('albatross');
    const lines = featRarityLines({ rows: [ace, albatross], owner: null, t, locale: 'en-GB', now: NOW });
    expect(lines.viewerLine).toBe('The second albatross in 4,000 rounds.');
    expect(lines.kind).toBe('albatross');
  });

  it('uses ordinal words to tenth and numerals from the eleventh', () => {
    const at = (ordinal: number) =>
      featRarityLines({
        rows: [{ feat_kind: 'ace', global_ordinal: ordinal, total_rounds_at_detection: 5000, distinct_members_at_detection: 9 }],
        owner: null,
        t,
        locale: 'en-GB',
        now: NOW,
      }).viewerLine;
    expect(at(10)).toBe('The tenth ace in 5,000 rounds.');
    expect(at(11)).toBe('The 11th ace in 5,000 rounds.');
  });

  it('drops the year for a previous occurrence inside the current calendar year', () => {
    const lines = featRarityLines({
      rows: [{ feat_kind: 'eagle_brace', global_ordinal: 4, total_rounds_at_detection: 3600, distinct_members_at_detection: 2 }],
      owner: [{ feat_kind: 'eagle_brace', is_owner: true, member_ordinal: 2, member_rounds: 230, member_prev_at: '2026-03-08' }],
      t,
      locale: 'en-GB',
      now: NOW,
    });
    expect(lines.ownerLine).toBe('Your second eagle brace. First since March.');
  });

  it('replaces the public line with a localized owner congratulations when the first name is safe', () => {
    const c = live[7];
    const lines = featRarityLines({ rows: [c.row], owner: [c.owner], t, locale: 'en-GB', ownerDisplayName: 'Lennon Hill', now: NOW });
    expect(lines.ownerLine).toBe('Only the second clbhouz member to achieve this — congrats, Lennon');
  });

  it.each(['j.edge1994', 'golf_1', '@golfer', 'X'])(
    'falls back to the plain owner branch for handle-like name %s',
    (displayName) => {
      const c = live[7];
      const lines = featRarityLines({ rows: [c.row], owner: [c.owner], t, locale: 'en-GB', ownerDisplayName: displayName, now: NOW });
      expect(lines.ownerLine).toBe(c.ownerLine);
    },
  );

  it('extracts only a valid first token for congratulations', () => {
    expect(congratulationName('  Lennon Hill ')).toBe('Lennon');
    expect(congratulationName('j.edge1994')).toBeNull();
  });
});
