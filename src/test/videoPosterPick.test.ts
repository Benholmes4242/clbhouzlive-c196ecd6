import { describe, expect, it } from 'vitest';
import { candidateTimes, chooseFrame, lumaStats, picturePasses, posterUrl } from '../../supabase/functions/pick-video-poster/pick';

function pixels(values: number[]) { return new Uint8Array(values.flatMap(v => [v, v, v, 255])); }
describe('VIDEO_POSTERS_1 measured frames', () => {
  it('rejects a black frame', () => { expect(picturePasses(lumaStats(pixels([0, 0])))).toBe(false); });
  it('rejects a flat dark fade with mean 18 and sd 0', () => {
    const stats = lumaStats(pixels([18, 18])); expect(stats.mean).toBeCloseTo(18); expect(stats.sd).toBeCloseTo(0); expect(picturePasses(stats)).toBe(false);
  });
  it('rejects white text on black with mean about 8 and sd about 24', () => {
    const stats = lumaStats(pixels([...Array(9).fill(0), 80])); expect(stats.mean).toBeCloseTo(8); expect(stats.sd).toBeCloseTo(24); expect(picturePasses(stats)).toBe(false);
  });
  it('accepts a real golf frame with mean 120 and sd 30', () => {
    const stats = lumaStats(pixels([90, 150])); expect(stats.mean).toBeCloseTo(120); expect(stats.sd).toBeCloseTo(30); expect(picturePasses(stats)).toBe(true);
  });
  it('requires both thresholds inclusively', () => { expect(picturePasses({ mean: 35, sd: 15 })).toBe(true); expect(picturePasses({ mean: 34.9, sd: 40 })).toBe(false); expect(picturePasses({ mean: 120, sd: 14.9 })).toBe(false); });
  it('uses weighted RGB luma and ignores alpha', () => { expect(lumaStats([255, 0, 0, 0]).mean).toBeCloseTo(54.213); });
  it('preserves candidate order without a known duration', () => { expect(candidateTimes(null)).toEqual([0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 60]); });
  it('respects duration minus one and deduplicates percentage times', () => { expect(candidateTimes(12)).toEqual([0, 1, 2, 3, 4, 5, 7, 10, 6]); expect(candidateTimes(2)).toEqual([0]); });
  it('appends floored quarter and midpoint after fixed candidates', () => { expect(candidateTimes(101)).toEqual([0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 60, 25, 50]); });
  it('chooses the first passing candidate', () => { expect(chooseFrame([{ time: 1, mean: 35, sd: 15, passed: true }, { time: 2, mean: 120, sd: 30, passed: true }])?.time).toBe(1); });
  it('nothing passing chooses the highest mean plus sd', () => { expect(chooseFrame([{ time: 1, mean: 18, sd: 0, passed: false }, { time: 2, mean: 8, sd: 24, passed: false }])?.time).toBe(2); });
  it('empty candidates yield no choice', () => { expect(chooseFrame([])).toBeNull(); });
  it('canonical full-size URL always includes time zero', () => { expect(posterUrl('stream', 0)).toBe('https://customer-4ah4gni80ytefpck.cloudflarestream.com/stream/thumbnails/thumbnail.jpg?height=1080&fit=crop&time=0s'); });
  it('canonical full-size URL includes the picked time', () => { expect(posterUrl('stream', 7)).toContain('&time=7s'); });
});