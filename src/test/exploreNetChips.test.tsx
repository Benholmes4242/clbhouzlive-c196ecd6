import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { vsHandicapLabel } from '@/features/explore-magazine/AchievementCallout';
import { calloutFor } from '@/features/explore-magazine/cardTreatment';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import {
  FEAT_GOLD_EMBLEM_GLOW,
  FEAT_GOLD_WASH,
  FEAT_TOP_EMBLEM_GLOW,
  FEAT_TOP_WASH,
} from '@/features/tourhub/_shared/tokens';

function round(facts: StreamItem['facts'], patch: Partial<StreamItem> = {}): StreamItem {
  return {
    id: 'round:1', kind: 'round', ring: 'own', lane: 'news', score: 1,
    consequence: null,
    subject: { course_id: null, course_name: 'Sundridge Park', region: null, sub_country: null, image_url: null, pending: false },
    who: { user_id: 'u', display_name: 'A member', photo_url: null, is_viewer: false },
    facts, payload: {}, seen: false, ...patch,
  };
}

function renderCard(facts: StreamItem['facts'], patch: Partial<StreamItem> = {}) {
  return render(<ExploreCard item={round(facts, patch)} size="std" onTap={() => undefined} />).container;
}

describe('C3 round stat strip', () => {
  it('orders achievement, par, net and vs hcp, with the ruled widths', () => {
    const container = renderCard(
      { gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 1 },
    );
    const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(Array.from(strip?.children ?? []).map((cell) => cell.getAttribute('data-explore-stat')))
      .toEqual(['achievement', 'par', 'net', 'vs-hcp']);
    expect(strip?.style.gridTemplateColumns).toBe('minmax(0, 2.3fr) repeat(3, minmax(0, 0.7fr))');
    expect(strip?.style.backgroundColor).toBe('rgb(27, 30, 39)');
    expect(strip?.style.border).toBe('');
  });

  it('keeps every tier on the neutral panel and derives TOP lighting above GOLD', () => {
    const gold = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 2 });
    const top = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, holes_in_one: 2 });
    const ink = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 1 });
    const goldStrip = gold.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    const topStrip = top.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    const inkStrip = ink.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    const goldEmblem = gold.querySelector<HTMLElement>('[data-explore-achievement-emoji]');
    const topEmblem = top.querySelector<HTMLElement>('[data-explore-achievement-emoji]');

    for (const strip of [goldStrip, topStrip, inkStrip]) {
      expect(strip?.style.backgroundColor).toBe('rgb(27, 30, 39)');
      expect(strip?.style.border).toBe('');
    }
    expect(FEAT_GOLD_WASH).toContain('radial-gradient(120px 60px');
    expect(FEAT_TOP_WASH).toContain('radial-gradient(142px 71px');
    expect(inkStrip?.style.backgroundImage).toBe('none');
    expect(goldEmblem?.style.fontSize).toBe('26px');
    expect(topEmblem?.style.fontSize).toBe('28px');
    expect(goldEmblem?.style.filter).toBe(FEAT_GOLD_EMBLEM_GLOW);
    expect(topEmblem?.style.filter).toBe(FEAT_TOP_EMBLEM_GLOW);
    expect(goldEmblem?.style.boxShadow).toBe('');
    expect(topEmblem?.style.boxShadow).toBe('');
    expect(goldEmblem?.style.borderRadius).toBe('');
    expect(topEmblem?.style.borderRadius).toBe('');
    expect(FEAT_GOLD_EMBLEM_GLOW).toContain('drop-shadow(0 0 10px');
    expect(FEAT_TOP_EMBLEM_GLOW).toContain('drop-shadow(0 0 12px');
  });

  it('uses equal thirds without an achievement and never prints a birdies figure label', () => {
    const container = renderCard({ gross: 82, course_par: 71, net: 76, course_handicap: 6, birdies: 4 });
    const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(Array.from(strip?.children ?? []).map((cell) => cell.getAttribute('data-explore-stat')))
      .toEqual(['par', 'net', 'vs-hcp']);
    expect(strip?.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(strip?.textContent).not.toMatch(/BIRDIES/i);
  });

  it('renders achievement alone when net is unavailable, and no strip without either', () => {
    const achievement = renderCard({ gross: 73, course_par: 71, net: null, course_handicap: null, eagles: 1 });
    const strip = achievement.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(strip?.getAttribute('data-explore-stat-layout')).toBe('achievement-only');
    expect(strip?.querySelectorAll('[data-explore-stat]')).toHaveLength(1);
    expect(strip?.querySelector('[data-explore-stat="par"]')).toBeNull();

    const plain = renderCard({ gross: 82, course_par: 71, net: null, course_handicap: null });
    expect(plain.querySelector('[data-explore-stat-strip="round"]')).toBeNull();
  });

  it('never renders par when net or playing handicap is missing', () => {
    for (const facts of [
      { gross: 82, course_par: 71, net: 76 },
      { gross: 82, course_par: 71, course_handicap: 6 },
      { gross: 82, course_par: 71, net: null, course_handicap: 6 },
    ]) {
      expect(renderCard(facts).querySelector('[data-explore-stat="par"]')).toBeNull();
    }
  });

  it('formats and colours the three figures correctly', () => {
    expect(vsHandicapLabel(70, 71)).toBe('\u22121');
    expect(vsHandicapLabel(74, 71)).toBe('+3');
    expect(vsHandicapLabel(71, 71)).toBe('Level');
    const under = renderCard({ gross: 76, course_par: 71, net: 70, course_handicap: 6 });
    expect((under.querySelector('[data-explore-stat-value="par"]') as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
    expect((under.querySelector('[data-explore-stat-value="net"]') as HTMLElement).style.color)
      .toBe((under.querySelector('[data-explore-stat-value="vs-hcp"]') as HTMLElement).style.color);
    const over = renderCard({ gross: 80, course_par: 71, net: 74, course_handicap: 6 });
    expect((over.querySelector('[data-explore-stat-value="net"]') as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
  });

  it('keeps net and hcp off the photograph', () => {
    const container = renderCard({ gross: 82, course_par: 71, to_par: 11, net: 76, course_handicap: 6 });
    expect(container.querySelector('[data-explore-chip="net"]')).toBeNull();
    expect(container.querySelector('[data-explore-chip="hcp"]')).toBeNull();
  });
});

describe('amended achievement priority', () => {
  it('puts five birdies below eagle and above bogey-free', () => {
    expect(calloutFor(round({ eagles: 1, birdies: 6, clean_card: true }))?.kind).toBe('eagle');
    expect(calloutFor(round({ birdies: 5, clean_card: true }))).toMatchObject({ kind: 'birdies', count: 5, tier: 'ink' });
    expect(calloutFor(round({ birdies: 4, clean_card: true }))?.kind).toBe('clean');
  });

  it('keeps net record above rank-up and disables cut and beat-handicap callouts', () => {
    expect(calloutFor(round({ net_record: true }, { consequence: { kind: 'rank_up', n: 2 } }))?.kind).toBe('net_record');
    expect(calloutFor(round({ course_par: 71, net: 68, course_handicap: 8, handicap_cut: { from: 9, to: 8 } }))).toBeNull();
  });
});

describe('achievement tag and label copy', () => {
  const cases: Array<{
    facts?: StreamItem['facts'];
    consequence?: StreamItem['consequence'];
    tag: string | null;
    label: string;
  }> = [
    { consequence: { kind: 'record_taken' }, tag: 'NEW', label: 'Course record' },
    { facts: { net_record: true }, tag: 'NEW', label: 'Net course record' },
    { consequence: { kind: 'rank_up', n: 2 }, tag: 'MOVED UP', label: 'Now 2nd' },
    { consequence: { kind: 'rank_up', n: null }, tag: null, label: 'Moved up the board' },
    { facts: { holes_in_one: 1 }, tag: null, label: 'Hole in one' },
    { facts: { albatrosses: 1 }, tag: null, label: 'Albatross' },
    { facts: { eagles: 1 }, tag: null, label: 'Eagle' },
    { facts: { birdies: 5 }, tag: null, label: '5 birdies' },
    { facts: { clean_card: true }, tag: null, label: 'Bogey-free' },
  ];

  it.each(cases)('maps $label to its requested tag and label', ({ facts: factPatch, consequence, tag, label }) => {
    const facts = { gross: 70, course_par: 71, net: 67, course_handicap: 3, ...(factPatch ?? {}) };
    const container = renderCard(facts, consequence ? { consequence } : {});
    expect(container.querySelector('[data-explore-achievement-tag="true"]')?.textContent ?? null).toBe(tag);
    const labelNode = container.querySelector<HTMLElement>('[data-explore-achievement-label="true"]');
    expect(labelNode?.textContent).toBe(label);
    expect(labelNode?.style.textOverflow).not.toBe('ellipsis');
    expect(labelNode?.style.whiteSpace).toBe('normal');
  });

  it.each([
    [{ consequence: { kind: 'record_taken' as const } }, '🏆'],
    [{ facts: { net_record: true } }, '⭐'],
    [{ consequence: { kind: 'rank_up' as const, n: 2 } }, null],
    [{ facts: { holes_in_one: 1 } }, '⛳'],
    [{ facts: { albatrosses: 1 } }, '🔥'],
    [{ facts: { eagles: 1 } }, '🦅'],
    [{ facts: { birdies: 5 } }, null],
    [{ facts: { clean_card: true } }, '🛡️'],
  ])('renders the settled distinct achievement mark', (patch, emoji) => {
    const container = renderCard(
      { gross: 70, course_par: 71, net: 67, course_handicap: 3, ...(('facts' in patch && patch.facts) || {}) },
      'consequence' in patch ? { consequence: patch.consequence } : {},
    );
    const node = container.querySelector<HTMLElement>('[data-explore-achievement-emoji]');
    expect(node?.textContent ?? null).toBe(emoji);
    if (node) {
      expect(node.style.width).toBe('28px');
      expect(node.style.height).toBe('28px');
      expect(node.style.fontSize).toBe(emoji && ['⛳', '🔥'].includes(emoji) ? '26px' : '22px');
      expect(node.getAttribute('aria-hidden')).not.toBeNull();
    }
  });

  it.each([320, 390])('keeps every achievement label untruncated at %ipx', (width) => {
    for (const { facts: factPatch, consequence } of cases) {
      const facts = { gross: 70, course_par: 71, net: 67, course_handicap: 3, ...(factPatch ?? {}) };
      const container = renderCard(facts, consequence ? { consequence } : {});
      const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
      if (strip) strip.style.width = `${width}px`;
      const cell = container.querySelector<HTMLElement>('[data-explore-stat="achievement"]');
      const label = container.querySelector<HTMLElement>('[data-explore-achievement-label="true"]');
      expect(cell).not.toBeNull();
      expect(label?.style.textOverflow).not.toBe('ellipsis');
      expect(label?.style.whiteSpace).toBe('normal');
      expect(label?.style.webkitLineClamp).toBe('');
      for (const element of Array.from(cell?.querySelectorAll<HTMLElement>('*') ?? [])) {
        expect(element.style.textOverflow).not.toBe('ellipsis');
      }
    }
  });
});