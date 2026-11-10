import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { tourHeaderInset } from '@/features/tourhub/components/TourPageShell';

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Tour Hub N2 shell ownership', () => {
  it('lets the fixed header own the safe area only on exact /tourhub', () => {
    expect(tourHeaderInset('/tourhub')).toBe('self');
    expect(tourHeaderInset('/tourhub/player/player-1')).toBe('shell');
    expect(tourHeaderInset('/tourhub/college-golf')).toBe('shell');
  });

  it('renders every hub tab directly — the measured-header wrapper is gone', () => {
    /* NEWS ON THE SHARED ISLANDS (10 Nov 2026): with the News conversion all
       four sub-tabs render directly, so the --tour-header-h wrapper branch is
       deleted and NewsTab renders with the islands prop. */
    const main = source('src/features/tourhub/pages/TourHubMainPage.tsx');
    expect(main).not.toContain("paddingTop: 'var(--tour-header-h, 0px)'");
    expect(main).not.toContain("paddingTop: 'var(--sat, 0px)'");
    expect(main).toContain('<NewsTab immersiveHero={false} islands />');
  });

  it('keeps one canonical foot and one shell-owned scroll control', () => {
    const shell = source('src/features/tourhub/components/TourPageShell.tsx');
    const news = source('src/features/tourhub/news/NewsTab.tsx');
    const schedule = source('src/features/tourhub/schedule-v2/ScheduleTab.tsx');

    expect(shell).not.toContain("minHeight: '100vh'");
    expect(shell.match(/<ScrollToTopGlass \/>/g)).toHaveLength(1);
    expect(news).not.toContain('paddingBottom: 24');
    /* SCHEDULE ON THE SHARED ISLANDS (10 Nov 2026): the schedule tab left
       TourPageShell, so it renders its own scroll-to-top control. */
    expect(schedule).toContain('ScrollToTopGlass');
  });
});