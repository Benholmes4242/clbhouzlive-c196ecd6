import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PlayedHead, PLAYED_KICKER, PLAYED_TITLE } from '@/components/courses/browse/playedParts';
import { SectionHead, HEAD_KICKER_SIZE, HEAD_TITLE_GAP, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_SIZE } from '@/components/courses/browse/SectionHead';

afterEach(cleanup);
const INK = 'rgb(248, 250, 252)';
const eyebrowOk = (el: HTMLElement) => {
  expect(el.style.fontSize).toBe('11px'); expect(el.style.fontWeight).toBe('700');
  expect(el.style.letterSpacing).toBe('0.16em'); expect(el.style.color).toBe(INK);
};
const titleOk = (el: HTMLElement) => {
  expect(el.style.fontSize).toBe('21px'); expect(el.style.fontWeight).toBe('700');
  expect(el.style.letterSpacing).toBe('-0.035em'); expect(el.style.color).toBe(INK);
};

describe('signed-off Courses / Top 100 section head', () => {
  it('PlayedHead renders the signed-off eyebrow and title', () => {
    const { container } = render(<PlayedHead kicker="RECENTLY" title="What's been played" />);
    const h2 = container.querySelector('h2') as HTMLElement;
    eyebrowOk(h2.previousElementSibling as HTMLElement);
    titleOk(h2);
    expect(parseFloat(h2.style.lineHeight)).toBeCloseTo(21 * 1.05);
    expect(h2.style.marginTop).toBe('5px');
  });
  for (const tone of ['amber', 'quiet'] as const) it(`SectionHead ${tone} tone renders the white eyebrow and signed-off title`, () => {
    const { container } = render(<SectionHead kicker="Latest" title="Holes" tone={tone} />);
    const h2 = container.querySelector('h2') as HTMLElement;
    eyebrowOk(h2.previousElementSibling as HTMLElement);
    titleOk(h2);
    expect(h2.style.lineHeight).toBe('1.05');
    expect(h2.style.marginTop).toBe('5px');
  });
  it('head constants carry the signed-off metrics the shells read', () => {
    expect([HEAD_KICKER_SIZE, HEAD_TITLE_SIZE, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_GAP]).toEqual([11, 21, 1.05, 5]);
    expect(HEAD_TITLE_SIZE * HEAD_TITLE_LINE_HEIGHT).toBeCloseTo(22.05);
    expect(PLAYED_KICKER.lineHeight).toBe(HEAD_KICKER_SIZE);
    expect(PLAYED_TITLE.lineHeight).toBeCloseTo(HEAD_TITLE_SIZE * HEAD_TITLE_LINE_HEIGHT);
    expect(PLAYED_TITLE.gap).toBe(HEAD_TITLE_GAP);
  });
  it('.t100b-kicker / .t100b-title carry the signed-off values; .t100b-label keeps the muted row label', () => {
    const css = readFileSync('src/components/courses/top100/top100Compare.css', 'utf8');
    const rule = (sel: string) => css.match(new RegExp(`\\${sel}\\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.t100b-kicker')).toBe('font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);text-transform:uppercase;line-height:1;color:var(--t100b-ink)');
    expect(rule('.t100b-title')).toBe('margin-top:5px;font-size:var(--section-title-size);font-weight:var(--section-title-weight);line-height:var(--section-title-leading);letter-spacing:var(--section-title-tracking);font-synthesis:none;color:var(--t100b-ink)');
    expect(css).not.toContain('.t100b-kicker.amber');
    expect(rule('.t100b-label')).toContain('color:var(--t100b-mute)');
  });
});
