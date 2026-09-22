import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { vsHandicapLabel } from '@/features/explore-magazine/AchievementCallout';
import { calloutFor } from '@/features/explore-magazine/cardTreatment';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import {
  FEAT_GOLD_EMBLEM_GLOW,
  FEAT_TOP_EMBLEM_GLOW,
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

function statKinds(container: HTMLElement): string[] {
  const strip = container.querySelector('[data-explore-stat-strip="round"]');
  return Array.from(strip?.querySelectorAll('[data-explore-stat]') ?? []).map((cell) => cell.getAttribute('data-explore-stat') ?? '');
}

describe('BRIEF_FEED_SCORE_PILL round stat strip', () => {
  it('keeps the optional achievement in its own neutral block and moves figures to identity', () => {
    const container = renderCard(
      { gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 1 },
    );
    const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(statKinds(container)).toEqual(['achievement']);
    expect(container.querySelector('[data-explore-stat-value="net"]')?.textContent).toBe('67');
    expect(container.querySelector('[data-explore-stat-value="vs-hcp"]')?.textContent).toBe('−4');
    expect(container.querySelector('[data-explore-stat-value="par"]')).toBeNull();
    expect(strip?.style.backgroundColor).toBe('rgb(27, 30, 39)');
    expect(strip?.style.backgroundImage).toBe('');
    expect(strip?.style.border).toBe('');
    expect(container.querySelector('[data-round-identity-figures="true"]')).not.toBeNull();
  });

  it('shows no horizontal or vertical rule anywhere in the pill, on any tier', () => {
    const gold = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 2 });
    const top = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, holes_in_one: 2 });
    const ink = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 1 });
    for (const container of [gold, top, ink]) {
      const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
      expect(strip?.style.backgroundColor).toBe('rgb(27, 30, 39)');
      expect(strip?.style.backgroundImage).toBe('');
      expect(strip?.style.border).toBe('');
      for (const el of Array.from(strip?.querySelectorAll<HTMLElement>('*') ?? [])) {
        expect(el.style.borderTop).toBe('');
        expect(el.style.borderLeft).toBe('');
        expect(el.style.borderRight).toBe('');
        expect(el.style.borderBottom).toBe('');
        expect(el.tagName).not.toBe('HR');
      }
    }
  });

  it('keeps the emblem lighting on the fixed artwork while the glow wash is gone', () => {
    const gold = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, eagles: 2 });
    const top = renderCard({ gross: 70, course_par: 71, net: 67, course_handicap: 3, holes_in_one: 2 });
    const goldEmblem = gold.querySelector<HTMLElement>('[data-explore-achievement-emoji]');
    const topEmblem = top.querySelector<HTMLElement>('[data-explore-achievement-emoji]');
    expect(goldEmblem?.style.fontSize).toBe('26px');
    expect(topEmblem?.style.fontSize).toBe('28px');
    expect(goldEmblem?.style.filter).toBe(FEAT_GOLD_EMBLEM_GLOW);
    expect(topEmblem?.style.filter).toBe(FEAT_TOP_EMBLEM_GLOW);
    expect(goldEmblem?.style.boxShadow).toBe('');
    expect(topEmblem?.style.boxShadow).toBe('');
    expect(FEAT_GOLD_EMBLEM_GLOW).toContain('drop-shadow(0 0 10px');
    expect(FEAT_TOP_EMBLEM_GLOW).toContain('drop-shadow(0 0 12px');
  });

  it('renders NET and VS HCP in identity without an achievement and no empty feat block', () => {
    const container = renderCard({ gross: 82, course_par: 71, net: 76, course_handicap: 6, birdies: 4 });
    const strip = container.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(strip).toBeNull();
    expect(container.querySelector('[data-round-identity-figures="true"]')).not.toBeNull();
    expect(container.querySelector('[data-explore-stat-value="par"]')).toBeNull();
    expect(container.querySelector('[data-explore-stat-value="net"]')?.textContent).toBe('76');
    expect(container.querySelector('[data-explore-stat-value="vs-hcp"]')?.textContent).toBe('+5');
    expect(container.textContent).not.toMatch(/BIRDIES/i);
  });

  it('renders achievement alone when net is unavailable, and no strip without either', () => {
    const achievement = renderCard({ gross: 73, course_par: 71, net: null, course_handicap: null, eagles: 1 });
    const strip = achievement.querySelector<HTMLElement>('[data-explore-stat-strip="round"]');
    expect(strip?.getAttribute('data-explore-stat-layout')).toBe('achievement-only');
    expect(strip?.querySelectorAll('[data-explore-stat]')).toHaveLength(1);

    const plain = renderCard({ gross: 82, course_par: 71, net: null, course_handicap: null });
    expect(plain.querySelector('[data-explore-stat-strip="round"]')).toBeNull();
  });

  it('formats and colours the figures correctly', () => {
    expect(vsHandicapLabel(70, 71)).toBe('−1');
    expect(vsHandicapLabel(74, 71)).toBe('+3');
    expect(vsHandicapLabel(71, 71)).toBe('Level');
    const under = renderCard({ gross: 76, course_par: 71, net: 70, course_handicap: 6 });
    expect((under.querySelector('[data-explore-stat-value="net"]') as HTMLElement).style.color).toBe(A.INK);
    expect((under.querySelector('[data-explore-stat-value="vs-hcp"]') as HTMLElement).style.color).not.toBe(A.INK);
    const over = renderCard({ gross: 80, course_par: 71, net: 74, course_handicap: 6 });
    expect((over.querySelector('[data-explore-stat-value="net"]') as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
  });

  it('keeps net and hcp off the photograph', () => {
    const container = renderCard({ gross: 82, course_par: 71, to_par: 11, net: 76, course_handicap: 6 });
    expect(container.querySelector('[data-explore-chip="net"]')).toBeNull();
    expect(container.querySelector('[data-explore-chip="hcp"]')).toBeNull();
  });

  it('aligns the tag, label and wrapping qualifier in one column beside the icon', () => {
    const container = renderCard(
      { gross: 66, record_margin: 2 },
      { consequence: { kind: 'record_taken', n: 66 } },
    );
    const sentence = container.querySelector<HTMLElement>('[data-explore-achievement-sentence="true"]');
    expect(sentence).not.toBeNull();
    const subline = container.querySelector<HTMLElement>('[data-explore-achievement-subline="true"]');
    expect(subline?.textContent).toBe('2 shots better than the previous course record');
    expect(subline?.style.color).toBe('rgba(248, 250, 252, 0.62)');
    expect(subline?.style.whiteSpace).toBe('');
    expect(subline?.style.overflow).toBe('');
    expect(subline?.style.textOverflow).toBe('');
    expect(subline?.style.borderTop).toBe('');
    const cell = container.querySelector('[data-explore-stat="achievement"]');
    const tag = cell?.querySelector('[data-explore-achievement-tag="true"]');
    const label = cell?.querySelector('[data-explore-achievement-label="true"]');
    expect(cell?.querySelector('[data-explore-achievement-subline="true"]')).not.toBeNull();
    expect(tag?.compareDocumentPosition(label as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(label?.compareDocumentPosition(subline as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect((cell as HTMLElement).style.minHeight).toBe('');
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

  it('renders record and movement margins from their carried facts, with singular grammar and no empty line', () => {
    const record = renderCard(
      { gross: 66, record_margin: 2 },
      { consequence: { kind: 'record_taken', n: 66 } },
    );
    expect(record.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('2 shots better than the previous course record');

    const singular = renderCard(
      { gross: 67, record_margin: 1 },
      { consequence: { kind: 'record_taken', n: 67 } },
    );
    expect(singular.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('1 shot better than the previous course record');

    const noRunnerUp = renderCard(
      { gross: 66, record_margin: null },
      { consequence: { kind: 'record_taken', n: 66 } },
    );
    expect(noRunnerUp.querySelector('[data-explore-achievement-subline="true"]')).toBeNull();

    const movement = renderCard(
      { gross: 70 },
      { consequence: { kind: 'rank_up', n: 3, delta: 2 } },
    );
    expect(movement.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('Up 2 places on the course leaderboard');
    expect(calloutFor(round({ gross: 70 }, { consequence: { kind: 'rank_up', n: 3, delta: 2 } })))
      .toEqual({ kind: 'rank_up', rank: 3, delta: 2 });
  });

  it('keeps net record without a subline', () => {
    const container = renderCard({ gross: 66, net_record: true, record_margin: 2 });
    expect(container.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Net course record');
    expect(container.querySelector('[data-explore-achievement-subline="true"]')).toBeNull();
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
    // BRIEF_FEED_SCORE_PILL §2 — rare feats carry RARE in the NEW tag slot;
    // a worded tag (NEW/MOVED UP) always wins, one accent per pill.
    { facts: { holes_in_one: 1 }, tag: 'RARE', label: 'Hole in one' },
    { facts: { albatrosses: 1 }, tag: 'RARE', label: 'Albatross' },
    { facts: { eagles: 2 }, tag: 'RARE', label: '2 eagles' },
    { facts: { eagles: 1 }, tag: null, label: 'Eagle' },
    { facts: { birdies: 5 }, tag: null, label: 'Birdie run' },
    { facts: { clean_card: true }, tag: null, label: 'Bogey-free' },
  ];

  it.each(cases)('maps $label to its requested tag and label', ({ facts: factPatch, consequence, tag, label }) => {
    const facts = { gross: 70, course_par: 71, net: 67, course_handicap: 3, ...(factPatch ?? {}) };
    const container = renderCard(facts, consequence ? { consequence } : {});
    const tagNode = container.querySelector<HTMLElement>('[data-explore-achievement-tag="true"]');
    expect(tagNode?.textContent ?? null).toBe(tag);
    if (tagNode) {
      // RARE is the exact NEW treatment: same amber, size, weight, spacing, slot.
      expect(tagNode.style.color).toBe('rgb(247, 147, 30)');
      expect(tagNode.style.fontSize).toBe('9px');
      expect(tagNode.style.fontWeight).toBe('800');
      expect(tagNode.style.letterSpacing).toBe('0.12em');
    }
    const labelNode = container.querySelector<HTMLElement>('[data-explore-achievement-label="true"]');
    expect(labelNode?.textContent).toBe(label);
    expect(labelNode?.style.textOverflow).not.toBe('ellipsis');
    expect(labelNode?.style.whiteSpace).toBe('normal');
  });

  it('adds the clean-card and single birdie qualifiers but preserves a multi-feat label', () => {
    const clean = renderCard({ gross: 70, clean_card: true });
    expect(clean.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('Par or better on every hole');

    const birdies = renderCard({ gross: 70, birdies: 5 });
    expect(birdies.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Birdie run');
    expect(birdies.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('5 birdies in a single round');

    const multi = renderCard({ gross: 70, eagles: 1, birdies: 5 });
    expect(multi.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Eagle + 5 birdies');
    expect(multi.querySelector('[data-explore-achievement-subline="true"]')).toBeNull();
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
