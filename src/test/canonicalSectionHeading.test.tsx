import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
import { PlayedHead, PLAYED_KICKER, PLAYED_TITLE } from '@/components/courses/browse/playedParts';
import { SectionHead, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE } from '@/components/courses/browse/SectionHead';

afterEach(cleanup);

describe('canonical section heading tokens', () => {
  it('carry the Courses tab values from 52f015a', () => {
    expect(SECTION_EYEBROW).toEqual({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1 });
    expect(SECTION_TITLE).toEqual({ fontSize: 21, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, fontSynthesis: 'none' });
    expect(SECTION_TITLE_GAP).toBe(5);
    expect('color' in SECTION_EYEBROW || 'color' in SECTION_TITLE).toBe(false);
  });
  it('index.css mirrors them as custom properties', () => {
    const css = readFileSync('src/index.css', 'utf8');
    for (const d of ['--section-eyebrow-size: 11px', '--section-eyebrow-weight: 700', '--section-eyebrow-tracking: 0.16em', '--section-title-size: 21px', '--section-title-weight: 700', '--section-title-tracking: -0.035em', '--section-title-leading: 1.05']) expect(css).toContain(d);
  });
  it('SectionHead and PlayedHead constants resolve to the tokens', () => {
    expect([HEAD_KICKER_SIZE, HEAD_TITLE_SIZE, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_GAP]).toEqual([SECTION_EYEBROW.fontSize, SECTION_TITLE.fontSize, SECTION_TITLE.lineHeight, SECTION_TITLE_GAP]);
    expect([PLAYED_KICKER.size, PLAYED_TITLE.size, PLAYED_TITLE.gap]).toEqual([SECTION_EYEBROW.fontSize, SECTION_TITLE.fontSize, SECTION_TITLE_GAP]);
    expect(PLAYED_TITLE.lineHeight).toBeCloseTo((SECTION_TITLE.fontSize as number) * (SECTION_TITLE.lineHeight as number));
  });
  for (const [name, el] of [['PlayedHead', <PlayedHead key="p" kicker="K" title="T" />], ['SectionHead', <SectionHead key="s" kicker="K" title="T" />]] as const) {
    it(`${name} renders unchanged values from the tokens`, () => {
      const { container } = render(el);
      const h2 = container.querySelector('h2') as HTMLElement;
      const k = h2.previousElementSibling as HTMLElement;
      expect([k.style.fontSize, k.style.fontWeight, k.style.letterSpacing, k.style.textTransform, parseFloat(k.style.lineHeight) * (k.style.lineHeight.endsWith('px') ? 1 : 11)]).toEqual(['11px', '700', '0.16em', 'uppercase', 11]);
      expect([h2.style.fontSize, h2.style.fontWeight, h2.style.letterSpacing, h2.style.marginTop]).toEqual(['21px', '700', '-0.035em', '5px']);
      const lh = parseFloat(h2.style.lineHeight) * (h2.style.lineHeight.endsWith('px') ? 1 : 21);
      expect(lh).toBeCloseTo(22.05);
    });
  }
});
