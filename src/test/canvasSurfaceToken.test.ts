import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  COMPOSER_PANEL_SURFACE,
  COMPOSER_SHELL_SURFACE,
  ECHO_HISTORY_ACTION,
  ECHO_HISTORY_CANVAS,
  ECHO_HISTORY_PANEL,
  ECHO_RAISED_SURFACE,
  FEED_CARD_SURFACE,
  IMMERSIVE_FEED_CANVAS,
  IMMERSIVE_FEED_STATUS_BAR,
  INK_ON_LIGHT,
  LIGHT_ROUTE_CANVAS,
  LIGHT_IMMERSIVE_CANVAS,
  LIGHT_ROUTE_STATUS_BAR,
  MEMBER_CELL,
  MEMBER_PANEL,
  APP_SHELL_SURFACE,
  DESKTOP_GUTTER_SURFACE,
  DISCOVER_SHELL_SURFACE,
  NEAR_BLACK_CONTROL_SURFACE,
  PAGE_CANVAS,
  POST_DEEP_LINK_CANVAS,
  SHEET_SURFACE,
  SLATE_CONTROL_SURFACE,
  STATUS_BAR_CANVAS,
  SUSPENSION_SURFACE,
  TOUR_HUB_RAISED_SURFACE,
  inkWithAlpha,
  surfaceWithAlpha,
} from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';

describe('canonical member surface tokens', () => {
  it('preserves every consolidated surface value exactly', () => {
    expect({
      PAGE_CANVAS,
      SHEET_SURFACE,
      INK_ON_LIGHT,
      STATUS_BAR_CANVAS,
      MEMBER_PANEL,
      MEMBER_CELL,
      IMMERSIVE_FEED_CANVAS,
      IMMERSIVE_FEED_STATUS_BAR,
      FEED_CARD_SURFACE,
      ECHO_RAISED_SURFACE,
      COMPOSER_SHELL_SURFACE,
      COMPOSER_PANEL_SURFACE,
      APP_SHELL_SURFACE,
      DESKTOP_GUTTER_SURFACE,
      DISCOVER_SHELL_SURFACE,
      TOUR_HUB_RAISED_SURFACE,
      NEAR_BLACK_CONTROL_SURFACE,
      SLATE_CONTROL_SURFACE,
      POST_DEEP_LINK_CANVAS,
      SUSPENSION_SURFACE,
      ECHO_HISTORY_CANVAS,
      ECHO_HISTORY_PANEL,
      ECHO_HISTORY_ACTION,
      LIGHT_ROUTE_CANVAS,
      LIGHT_IMMERSIVE_CANVAS,
      LIGHT_ROUTE_STATUS_BAR,
    }).toEqual({
      PAGE_CANVAS: '#0A0A0C',
      SHEET_SURFACE: '#16161A',
      INK_ON_LIGHT: '#0A0A0C',
      STATUS_BAR_CANVAS: 'FF0A0A0C',
      MEMBER_PANEL: '#16161A',
      MEMBER_CELL: '#1E1E23',
      IMMERSIVE_FEED_CANVAS: '#0A0A0C',
      IMMERSIVE_FEED_STATUS_BAR: 'FF0A0A0C',
      FEED_CARD_SURFACE: '#16161A',
      ECHO_RAISED_SURFACE: '#27272E',
      COMPOSER_SHELL_SURFACE: '#0A0A0C',
      COMPOSER_PANEL_SURFACE: '#16161A',
      APP_SHELL_SURFACE: '#0A0A0C',
      DESKTOP_GUTTER_SURFACE: '#0A0A0C',
      DISCOVER_SHELL_SURFACE: '#0A0A0C',
      TOUR_HUB_RAISED_SURFACE: '#16161A',
      NEAR_BLACK_CONTROL_SURFACE: '#1E1E23',
      SLATE_CONTROL_SURFACE: '#1E1E23',
      POST_DEEP_LINK_CANVAS: '#0A0A0C',
      SUSPENSION_SURFACE: '#0A0A0C',
      ECHO_HISTORY_CANVAS: '#0A0A0C',
      ECHO_HISTORY_PANEL: '#16161A',
      ECHO_HISTORY_ACTION: '#1E1E23',
      LIGHT_ROUTE_CANVAS: '#F8FAFC',
      LIGHT_IMMERSIVE_CANVAS: '#0F172A',
      LIGHT_ROUTE_STATUS_BAR: 'FFF8FAFC',
    });
  });

  it('keeps the global page and modal variables single-owned', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css.match(/--bg-page:\s*#0A0A0C/g)).toHaveLength(1);
    expect(css.match(/--bg-modal:/g)).toHaveLength(1);
    expect(css.match(/--background:\s*240 9\.1% 4\.3%/g)).toHaveLength(1);
  });

  it('derives translucent surfaces without changing their rendered rgba strings', () => {
    expect(surfaceWithAlpha(PAGE_CANVAS, 0.96)).toBe('rgba(10,10,12,0.96)');
    expect(surfaceWithAlpha(MEMBER_PANEL, 0.92)).toBe('rgba(22,22,26,0.92)');
    expect(surfaceWithAlpha(COMPOSER_SHELL_SURFACE, 0.55)).toBe('rgba(10,10,12,0.55)');
  });

  it('derives translucent foreground ink without changing its rendered rgba strings', () => {
    expect(inkWithAlpha(SURFACE.dark.ink, 0.04)).toBe('rgba(248,250,252,0.04)');
    expect(inkWithAlpha(SURFACE.dark.ink, 0.22)).toBe('rgba(248,250,252,0.22)');
    expect(inkWithAlpha(SURFACE.dark.ink, 0.55)).toBe('rgba(248,250,252,0.55)');
  });

  it('declares dark ink and the legacy light-route canvas independently', () => {
    const inkSource = readFileSync(resolve(process.cwd(), 'src/lib/tokens/surface.ts'), 'utf8');
    const surfaceSource = readFileSync(resolve(process.cwd(), 'src/lib/tokens/surfaces.ts'), 'utf8');
    expect(inkSource).toMatch(/const dark: InkRamp = \{[\s\S]*?ink: '#F8FAFC'/);
    expect(surfaceSource).toMatch(/export const LIGHT_ROUTE_CANVAS = '#F8FAFC'/);
    expect(inkSource).not.toContain('LIGHT_ROUTE_CANVAS');
    expect(surfaceSource).not.toMatch(/LIGHT_ROUTE_CANVAS\s*=\s*SURFACE\.dark\.ink/);
    expect(typeof LIGHT_ROUTE_CANVAS).toBe('string');
  });

  it('round-trips the canonical HSL channel variables to the hex named in each comment', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    const expected = {
      background: '#0A0A0C',
      card: '#16161A',
      popover: '#16161A',
      muted: '#1E1E23',
      secondary: '#1E1E23',
    } as const;

    const hslToHex = (hue: number, saturation: number, lightness: number) => {
      const s = saturation / 100;
      const l = lightness / 100;
      const chroma = (1 - Math.abs(2 * l - 1)) * s;
      const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
      const match = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0]
        : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma]
        : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
      const offset = l - chroma / 2;
      return `#${match.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    };

    for (const [name, hex] of Object.entries(expected)) {
      const declaration = css.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%;\\s*/\\*\\s*(${hex})\\s*\\*/`));
      expect(declaration, `--${name} must retain its exact HSL channels and matching hex comment`).not.toBeNull();
      const [, hue, saturation, lightness, commentHex] = declaration ?? [];
      expect(hslToHex(Number(hue), Number(saturation), Number(lightness))).toBe(commentHex);
    }
  });

  it('keeps Trophy Room card sweeps coupled to the panel token', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/profile/handicap/whs/gam/tokens.ts'), 'utf8');
    expect(source.match(/cardBg: MEMBER_PANEL/g)).toHaveLength(9);
    expect(source.match(/cardSweep: panelSweep\(/g)).toHaveLength(9);
    expect(source).not.toMatch(/cardSweep:[^\n]*#1B1E27|cardSweep:\s*\n\s*['`][^\n]*#1B1E27/);
    expect(source).toMatch(/linear-gradient\(150deg, \$\{openingStops\}, \$\{MEMBER_PANEL\} \$\{endStop\}\)/);
  });

  it('routes the named inverted-control foregrounds through INK_ON_LIGHT', () => {
    const paths = [
      'src/pages/messaging-v2/Composer.tsx',
      'src/pages/messaging-v2/MessageBubble.tsx',
      'src/pages/EchoHistoryPage.tsx',
      'src/components/profile/handicap/whs/sections/CircleSection.tsx',
      'src/pages/PostDeepLinkPage.tsx',
      'src/components/post/scheduled/ScheduledPostsList.tsx',
      'src/features/tourhub/components/TourSwitcherAffordance.tsx',
    ];
    for (const path of paths) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8'), path).toContain('INK_ON_LIGHT');
    }
  });

  it('keeps dark skeletons on the canonical ramp and away from the black shimmer', () => {
    const darkSkeletonPaths = [
      'src/components/skeletons/WatchSkeletons.tsx',
      'src/components/skeletons/MediaLibrarySkeletons.tsx',
      'src/components/skeletons/ProfileSurfaceSkeleton.tsx',
      'src/components/skeletons/RateCoursePageSkeleton.tsx',
      'src/components/explore-tab-new/courseled/CourseImageFallback.tsx',
      'src/components/explore-tab-new/courseled/DiscoverSectionShells.tsx',
      'src/features/explore-magazine/ExploreShells.tsx',
      'src/features/watch-v2/components/HubVideoRow.tsx',
      'src/features/watch-v2/components/HubMixedGrid.tsx',
      'src/features/watch-v2/components/HubClipsRow.tsx',
      'src/features/profile-sheet-v2/ProfileSheetV2.tsx',
    ];
    for (const path of darkSkeletonPaths) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8'), path).not.toContain('clb-shimmer-light');
    }

    const primitive = readFileSync(resolve(process.cwd(), 'src/components/ui/skeleton.tsx'), 'utf8');
    expect(primitive).toContain('variant = "dark"');
    expect(primitive).toContain('bg-surface-alt');

    const allDarkSources = darkSkeletonPaths
      .map((path) => readFileSync(resolve(process.cwd(), path), 'utf8'))
      .join('\n');
    expect(allDarkSources).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\.0[46]\)/);
  });
});