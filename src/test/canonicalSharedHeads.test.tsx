import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));

import { SectionHeader } from '@/components/ui/SectionHeader';
import { DarkSectionHeader } from '@/components/profile/handicap/whs/sections/_shared/darkAtoms';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SheetHeader as FriendSheetHeader } from '@/components/friend-sheet/parts/SheetHeader';
import { Eyebrow as FriendEyebrow } from '@/components/friend-sheet/parts/_shared/Eyebrow';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { EYEBROW_TEXT, SECTION_TITLE as CL_TITLE, KICKER as CL_KICKER, LABEL as CL_LABEL } from '@/components/explore-tab-new/courseled/tokens';
import { OverviewSectionHead } from '@/features/tourhub/overview/sections/OverviewSectionHead';
import { SectionShell } from '@/features/tourhub/overview/sections/SectionShell';
import { SectionEyebrow } from '@/features/tourhub/tournament-v2/sections/SectionEyebrow';
import { SearchSectionHeader } from '@/features/search-v2/components/SearchSectionHeader';
import { CourseEyebrow } from '@/components/profile/handicap/whs/sections/course-legends/_shared/CourseEyebrow';

afterEach(cleanup);
const INK = 'rgb(248, 250, 252)';
const eyebrow = (el: HTMLElement, color = INK) => {
  expect([el.style.fontSize, el.style.fontWeight, el.style.letterSpacing, el.style.textTransform, el.style.lineHeight, el.style.color]).toEqual(['11px', '700', '0.16em', 'uppercase', '1', color]);
};
const title = (el: HTMLElement) => {
  expect([el.style.fontSize, el.style.fontWeight, el.style.letterSpacing, el.style.lineHeight, el.style.color]).toEqual(['21px', '700', '-0.035em', '1.05', INK]);
};
const byText = (t: string) => screen.getByText(t) as HTMLElement;

describe('shared heading components take the canonical heading in ink', () => {
  for (const role of ['prime', 'section'] as const) for (const extra of [{}, { tone: 'amber' as const }, { tone: 'danger' as const }, { accent: '#D2222D' }, { surface: 'dark' as const }]) {
    it(`SectionHeader ${role} ${JSON.stringify(extra)}`, () => {
      render(<SectionHeader role={role} kicker="KICK" title="Title" {...extra} />);
      eyebrow(byText('KICK')); title(byText('Title'));
    });
  }
  it('SectionHeader rail title', () => { render(<SectionHeader role="rail" title="Rail" />); title(byText('Rail')); });
  it('DarkSectionHeader', () => { render(<DarkSectionHeader eyebrow="EB" title="Dark title" />); eyebrow(byText('EB')); title(byText('Dark title')); });
  for (const dark of [false, true]) it(`SheetHeader dark=${dark}`, () => {
    render(<SheetHeader dark={dark} eyebrow="SE" title="Sheet title" onClose={() => {}} />);
    eyebrow(byText('SE')); title(byText('Sheet title'));
  });
  it('SheetTitle primitive defaults to the canon variables in ink', () => {
    render(<Sheet open><SheetContent><SheetTitle>Prim</SheetTitle></SheetContent></Sheet>);
    const cls = byText('Prim').className;
    for (const c of ['text-[length:var(--section-title-size)]', '[font-weight:var(--section-title-weight)]', 'tracking-[var(--section-title-tracking)]', 'leading-[var(--section-title-leading)]', 'text-[#F8FAFC]']) expect(cls).toContain(c);
    expect(cls).not.toMatch(/text-lg|font-semibold/);
  });
  it('friend SheetHeader name', () => {
    render(<FriendSheetHeader avatarUrl={null} name="Danny Holmes" handle={null} bio={null} pill={null} />);
    const h2 = document.querySelector('h2') as HTMLElement;
    expect([h2.style.fontSize, h2.style.fontWeight, h2.style.letterSpacing, h2.style.lineHeight]).toEqual(['21px', '700', '-0.035em', '1.05']);
  });
  it('friend Eyebrow', () => { render(<FriendEyebrow label="H2H" />); eyebrow(byText('H2H')); });
  it('DiscoverSectionHeading title', () => { render(<DiscoverSectionHeading title="Disc" />); title(byText('Disc')); });
  it('courseled heading exports take the canon; KICKER and LABEL keep their own values', () => {
    expect(EYEBROW_TEXT).toMatchObject({ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1, color: '#F8FAFC' });
    expect(CL_TITLE).toMatchObject({ fontSize: 21, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, color: '#F8FAFC' });
    expect(CL_KICKER.color).toBe('rgba(255,255,255,0.70)'); expect(CL_LABEL.color).toBe('rgba(255,255,255,0.70)');
  });
  it('OverviewSectionHead title', () => { render(<OverviewSectionHead eyebrow="Coming up" title="Next event in four days" />); title(byText('Next event in four days')); });
  for (const c of [undefined, '#F7931E', '#2FA35A']) it(`SectionShell eyebrowColor=${c}`, () => {
    render(<SectionShell eyebrow="ALSO" eyebrowColor={c}><div /></SectionShell>); eyebrow(byText('ALSO'));
  });
  it('SectionEyebrow keeps the kicker and gains line-height 1', () => { render(<SectionEyebrow kicker="BOARD" />); eyebrow(byText('BOARD')); });
  it('tournament v3 .tv-head h2 reads the eyebrow variables in ink; aside 700', () => {
    const css = readFileSync('src/features/tourhub/tournament-v2/tournamentPage.css', 'utf8');
    expect(css).toContain('.tv-head h2{margin:0;font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);text-transform:uppercase;line-height:1;color:var(--tv-ink)}');
    expect(css).toContain('.tv-head>span{font-size:10.5px;font-weight:700;');
  });
  it('SearchSectionHeader', () => { render(<SearchSectionHeader label="Courses" />); eyebrow(byText('Courses')); });
  it('CourseEyebrow off photo in ink, on photo white', () => {
    const { container, rerender } = render(<CourseEyebrow type="links" region="Fife" country="Scotland" />);
    eyebrow(container.firstElementChild as HTMLElement);
    rerender(<CourseEyebrow type="links" region="Fife" country="Scotland" onPhoto />);
    eyebrow(container.firstElementChild as HTMLElement, 'rgb(255, 255, 255)');
  });
  it('the unused proshop Kicker is gone', () => {
    expect(() => readFileSync('src/components/watch/proshop/Kicker.tsx')).toThrow();
  });
});
