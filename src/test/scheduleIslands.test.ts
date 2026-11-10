import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
    /* NEWS ON THE SHARED ISLANDS (10 Nov 2026): with all four sub-tabs
       converted the shell branch is deleted — every tab renders directly. */
    expect(main).not.toContain('<TourPageShell');
    expect(main).toContain('{renderTab()}');
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
  afterEach(() => {
    document.documentElement.style.removeProperty(CHROME_CLEARANCE_VAR);
    vi.restoreAllMocks();
  });

  it('measures the published calc() through a probe instead of parseFloat', () => {
    document.documentElement.style.setProperty(CHROME_CLEARANCE_VAR, 'calc(var(--sat, 0px) + 72px)');
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 119 } as DOMRect);
    expect(chromeClearancePx()).toBe(119);
  });

  it('returns 0 on chrome-less routes publishing 0px', () => {
    document.documentElement.style.setProperty(CHROME_CLEARANCE_VAR, '0px');
    expect(chromeClearancePx()).toBe(0);
  });

  it('falls back to island height + gap + breathing when unset and the probe measures 0', () => {
    document.documentElement.style.removeProperty(CHROME_CLEARANCE_VAR);
    expect(chromeClearancePx()).toBe(CHROME_ISLAND_H_FALLBACK + CHROME_TOP_GAP + CHROME_BREATHING);
  });

  it('caches on the raw value and viewport — a second call does not re-probe', () => {
    document.documentElement.style.setProperty(CHROME_CLEARANCE_VAR, 'calc(var(--sat, 0px) + 88px)');
    const spy = vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 119 } as DOMRect);
    expect(chromeClearancePx()).toBe(119);
    expect(chromeClearancePx()).toBe(119);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
