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

  it('contains a portrait video, width-limited, anchored under the notch', () => {
    const rect = resolveRestingRect(900, 1600, viewport, 'video');
    expect(rect.fit).toBe('contain');
    expect(rect.width).toBe(390);
    expect(rect.left).toBe(0);
    expect(rect.height).toBeCloseTo(693.333, 2);
    expect(rect.top).toBe(0);
    expect(rect.top + rect.height).toBeLessThanOrEqual(754);
  });

  it.each(['video', 'image'] as const)('anchors 9:16 %s on 393×852 with safeTop 59', type => {
    const rect = resolveRestingRect(900, 1600, { ...viewport, w: 393, h: 852, safeTop: 59 }, type);
    expect(rect).toMatchObject({ top: 0, left: 0, width: 393, fit: 'contain' });
    expect(rect.height).toBeCloseTo(698.667, 2);
    expect(rect.top + rect.height).toBeLessThanOrEqual(762);
  });

  it('height-limits 9:16 on 320×568 without cropping or overflow', () => {
    const rect = resolveRestingRect(900, 1600, { ...viewport, w: 320, h: 568, safeTop: 20, safeBottom: 72 }, 'video');
    expect(rect).toEqual({ top: 0, left: 20.5, width: 279, height: 496, fit: 'contain' });
    expect(rect.left + rect.width).toBeLessThanOrEqual(320);
    expect(rect.top + rect.height).toBe(496);
  });

  it('keeps 4:5 photos centred in the safe area', () => {
    const rect = resolveRestingRect(1080, 1350, viewport, 'image');
    expect(rect).toEqual({ top: 156.75, left: 0, width: 390, height: 487.5, fit: 'contain' });
  });

  it.each([[1, 1], [3, 4], [2, 3]])('keeps %i:%i photos safely centred', (w, h) => {
    const rect = resolveRestingRect(w, h, viewport, 'image');
    expect(rect.top).toBeGreaterThan(47);
    expect(rect.top + rect.height / 2).toBeCloseTo(400.5);
    expect(rect.width).toBe(390);
    expect(rect.fit).toBe('contain');
  });

  it('height-limits taller portraits and centres between lateral safe insets', () => {
    const rect = resolveRestingRect(1, 3, { ...viewport, safeLeft: 10, safeRight: 20 }, 'image');
    expect(rect).toMatchObject({ top: 0, height: 754, fit: 'contain' });
    expect(rect.width).toBeCloseTo(754 / 3);
    expect(rect.left).toBeCloseTo(10 + (360 - 754 / 3) / 2);
  });

  it('keeps unknown dimensions at the existing full-viewport fallback', () => {
    expect(resolveRestingRect(0, 0, viewport, 'video')).toEqual({ top: 0, left: 0, width: 390, height: 844, fit: 'contain' });
  });

  it('anchors the inclusive 3:5 threshold even without a reserved footer', () => {
    const rect = resolveRestingRect(3, 5, { ...viewport, safeBottom: 0 }, 'image');
    expect(rect).toEqual({ top: 0, left: 0, width: 390, height: 650, fit: 'contain' });
  });

  it('centres media just wider than 3:5 regardless of its width-filled height', () => {
    const rect = resolveRestingRect(601, 1000, viewport, 'image');
    expect(rect.top).toBeGreaterThan(47);
    expect(rect.top + rect.height / 2).toBeCloseTo(400.5);
    expect(rect.width).toBe(390);
    expect(rect.fit).toBe('contain');
  });

  it('anchors synthetic portrait media without reserving a footer', () => {
    const rect = resolveRestingRect(900, 1600, { ...viewport, safeBottom: 0 }, 'video');
    expect(rect.top).toBe(0);
    expect(rect.width).toBe(390);
    expect(rect.height).toBeCloseTo(693.333, 2);
  });
});