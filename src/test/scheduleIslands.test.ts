import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CHROME_BREATHING,
  CHROME_CLEARANCE_VAR,
  CHROME_ISLAND_H_FALLBACK,
  CHROME_TOP_GAP,
  chromeClearancePx,
} from '@/lib/chromeClearance';

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Schedule tab on the shared islands', () => {
  const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
  const schedule = source('src/features/tourhub/schedule-v2/ScheduleTab.tsx');

  it('renders directly like live, outside the TourPageShell wrapper', () => {
    expect(main).toContain("isHubRoot || activeTab === 'live' || activeTab === 'schedule' || activeTab === 'players' ? renderTab() : (");
    // The shell branch (AppHeader + SubTabTourControl) is unreachable for schedule.
    const shellBranch = main.slice(main.indexOf('? renderTab() : ('));
    expect(shellBranch).toContain('SubTabTourControl');
    expect(shellBranch).not.toContain("activeTab === 'schedule'");
  });

  it('the page root starts under the islands', () => {
    expect(schedule).toContain('paddingTop: CHROME_CLEARANCE');
  });

  it('the week header docks under the islands, not the old header', () => {
    expect(schedule).toContain('top: `calc(${CHROME_CLEARANCE} - 1px)`');
    expect(schedule).not.toContain('--tour-header-h');
  });

  it('scroll maths read the shared clearance', () => {
    expect(schedule.match(/chromeClearancePx\(\)/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the scroll-to-top control TourPageShell used to supply', () => {
    expect(schedule).toContain('<ScrollToTopGlass />');
  });
});

describe('chromeClearancePx', () => {
  it('returns the parsed --chrome-clearance when set', () => {
    document.documentElement.style.setProperty(CHROME_CLEARANCE_VAR, '72px');
    expect(chromeClearancePx()).toBe(72);
    document.documentElement.style.removeProperty(CHROME_CLEARANCE_VAR);
  });

  it('falls back to island height + gap + breathing when unset or NaN', () => {
    document.documentElement.style.removeProperty(CHROME_CLEARANCE_VAR);
    const fallback = CHROME_ISLAND_H_FALLBACK + CHROME_TOP_GAP + CHROME_BREATHING;
    expect(chromeClearancePx()).toBe(fallback);
    document.documentElement.style.setProperty(CHROME_CLEARANCE_VAR, 'auto');
    expect(chromeClearancePx()).toBe(fallback);
    document.documentElement.style.removeProperty(CHROME_CLEARANCE_VAR);
  });
});
