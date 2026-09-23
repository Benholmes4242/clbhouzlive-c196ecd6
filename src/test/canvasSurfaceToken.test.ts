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
  MEMBER_CELL,
  MEMBER_PANEL,
  PAGE_CANVAS,
  POST_DEEP_LINK_CANVAS,
  SHEET_SURFACE,
  SUSPENSION_SURFACE,
} from '@/lib/tokens/surfaces';

describe('canonical member surface tokens', () => {
  it('preserves every consolidated surface value exactly', () => {
    expect({
      PAGE_CANVAS,
      SHEET_SURFACE,
      MEMBER_PANEL,
      MEMBER_CELL,
      IMMERSIVE_FEED_CANVAS,
      FEED_CARD_SURFACE,
      ECHO_RAISED_SURFACE,
      COMPOSER_SHELL_SURFACE,
      COMPOSER_PANEL_SURFACE,
      POST_DEEP_LINK_CANVAS,
      SUSPENSION_SURFACE,
      ECHO_HISTORY_CANVAS,
      ECHO_HISTORY_PANEL,
      ECHO_HISTORY_ACTION,
    }).toEqual({
      PAGE_CANVAS: '#15171F',
      SHEET_SURFACE: '#15171F',
      MEMBER_PANEL: '#1B1E27',
      MEMBER_CELL: '#20242E',
      IMMERSIVE_FEED_CANVAS: '#05070A',
      FEED_CARD_SURFACE: '#10151C',
      ECHO_RAISED_SURFACE: '#181F28',
      COMPOSER_SHELL_SURFACE: '#0B0F14',
      COMPOSER_PANEL_SURFACE: '#1B222B',
      POST_DEEP_LINK_CANVAS: '#0D0F11',
      SUSPENSION_SURFACE: '#0F172A',
      ECHO_HISTORY_CANVAS: '#08090B',
      ECHO_HISTORY_PANEL: '#14181E',
      ECHO_HISTORY_ACTION: '#1D222A',
    });
  });

  it('keeps the global page and modal variables single-owned', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css.match(/--bg-page:\s*#15171F/g)).toHaveLength(1);
    expect(css.match(/--bg-modal:/g)).toHaveLength(1);
    expect(css.match(/--background:\s*225 11% 10%/g)).toHaveLength(1);
  });
});