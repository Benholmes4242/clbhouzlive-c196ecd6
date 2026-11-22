import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { SectionHeader } from '@/components/ui/SectionHeader';
import { DarkSectionHeader } from '@/components/profile/handicap/whs/sections/_shared/darkAtoms';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { SECTION_TITLE } from '@/lib/tokens/type';

function trailingRow(container: HTMLElement) {
  const slot = container.querySelector('[data-heading-trailing]') as HTMLElement;
  expect(slot).not.toBeNull();
  const row = slot.parentElement as HTMLElement;
  const title = row.querySelector('h2, h3') as HTMLElement;
  return { slot, row, title };
}

describe('right-hand slot stays on the title\'s last line', () => {
  for (const [name, el] of [
    ['SectionHeader meta', <SectionHeader kicker="Trend" title="How your index moved" meta="-1.2" />],
    ['SectionHeader action', <SectionHeader kicker="Trend" title="How your index moved" action={{ label: 'All', onClick: () => {} }} />],
    ['DarkSectionHeader right', <DarkSectionHeader eyebrow="Trend" title="How your index moved" right="-1.2" />],
  ] as const) {
    it(`${name}: bottom-aligned row, shrinkable title, title-metric strut`, () => {
      const { container } = render(el);
      const { slot, row, title } = trailingRow(container);
      expect(row.style.alignItems).toBe('flex-end');
      expect(title.style.minWidth).toBe('0');
      expect(title.style.flex).toContain('1');
      expect(slot.style.flexShrink).toBe('0');
      expect(slot.style.fontSize).toBe(`${SECTION_TITLE.fontSize}px`);
      expect(slot.style.lineHeight).toBe(String(SECTION_TITLE.lineHeight));
    });
  }
});

describe('three sheet titles take SECTION_TITLE', () => {
  const css = readFileSync('src/index.css', 'utf8');
  const rule = css.match(/\.canon-sheet-title\.canon-sheet-title\.canon-sheet-title\{([^}]*)\}/)?.[1] ?? '';
  it('the canonical class reads every --section-title-* variable and never ellipsises', () => {
    for (const v of ['size', 'weight', 'tracking', 'leading']) expect(rule).toContain(`var(--section-title-${v})`);
    expect(rule).toContain('white-space:normal');
    expect(rule).toContain('text-overflow:clip');
    expect(css).toContain('--section-title-size: 21px');
  });
  for (const [file, re] of [
    ['src/components/profile/courses/BreakdownsPickerSheet.tsx', /<SheetTitle\s+className="canon-sheet-title"/],
    ['src/features/amateur-ranking/WagrLinkSheet.tsx', /<SheetTitle className="wagr-heading canon-sheet-title">/],
    ['src/features/amateur-ranking/SettingsWagrCard.tsx', /<SheetTitle className="wagr-heading canon-sheet-title">/],
    ['src/features/review-v2/components/ReviewHoleTags.tsx', /<SheetTitle className="hole-photo-fast-title canon-sheet-title">Which hole/],
  ] as const) {
    it(`${file.split('/').pop()} sheet title carries the canonical class`, () => {
      expect(readFileSync(file, 'utf8')).toMatch(re);
    });
  }
});

describe('Switch tour sheet close button', () => {
  it('darkClose gives the dark-sheet close disc without changing the header', () => {
    const { getByRole, container } = render(<SheetHeader title="Switch tour" onClose={() => {}} darkClose />);
    const btn = getByRole('button');
    expect(btn.style.background).toBe('rgb(39, 44, 55)');
    expect(btn.style.width).toBe('30px');
    expect((container.firstChild as HTMLElement).style.borderBottom).not.toContain('255, 255, 255');
  });
});
