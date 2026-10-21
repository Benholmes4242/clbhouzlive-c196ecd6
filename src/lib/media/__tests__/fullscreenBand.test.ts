import { describe, expect, it } from 'vitest';
import { BAND_H_CSS, bandHeightPx } from '../fullscreenBand';
import { resolveRestingRect } from '../resolveRestingRect';

describe('fullscreen comment band', () => {
  it.each([[34, 90], [0, 72], [16, 72], [20, 76]])('reserves %i inset as a %i pixel band', (inset, height) => {
    expect(bandHeightPx(inset)).toBe(height);
  });

  it('keeps the CSS geometry identical to the pixel geometry', () => {
    expect(BAND_H_CSS).toBe('calc(12px + 44px + max(16px, env(safe-area-inset-bottom, 0px)))');
  });

  const viewport = { w: 390, h: 844, safeTop: 47, safeBottom: bandHeightPx(34), safeLeft: 0, safeRight: 0 };

  it('contains a landscape video centred above the band', () => {
    const rect = resolveRestingRect(1600, 900, viewport, 'video');
    expect(rect.fit).toBe('contain');
    expect(rect.width).toBe(390);
    expect(rect.height).toBeCloseTo(219.375);
    expect(rect.left).toBe(0);
    expect(rect.top + rect.height / 2).toBeCloseTo((47 + 754) / 2);
    expect(rect.top + rect.height).toBeLessThanOrEqual(754);
  });

  it('contains a portrait video centred horizontally above the band', () => {
    const rect = resolveRestingRect(900, 1600, viewport, 'video');
    expect(rect.fit).toBe('contain');
    expect(rect.height).toBe(707);
    expect(rect.top).toBe(47);
    expect(rect.left + rect.width / 2).toBe(195);
    expect(rect.top + rect.height).toBeLessThanOrEqual(754);
  });
});