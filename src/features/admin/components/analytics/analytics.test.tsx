import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { dateLabel, delta, dur, onFor, pct, ratio, showTrackingGap, trackingGapCopy, wait } from './analyticsFormat';
import { lensOf, legacyLens, diagnosticOf, toLive, backFromLive } from './analyticsLens';
import { liftTone } from './BehaviourLens';
import { TrackingGap } from './JourneysLens';
import { areaOrder } from './ScreensLens';
import { mapHealth } from '../../hooks/useAnalyticsLenses';

describe('null is not zero', () => {
  it('pct and ratio render a hyphen for missing or zero denominators', () => {
    expect(pct(null)).toBe('-');
    expect(pct(0)).toBe('0%');
    expect(ratio(5, 0)).toBeNull();
    expect(ratio(32, 110)).toBe(29);
  });
  it('the mapper keeps missing keys null', () => {
    const h = mapHealth({ activity: { wau: 3 } });
    expect(h.activity.wau).toBe(3);
    expect(h.activity.mau).toBeNull();
  });
});

describe('formatters', () => {
  it('dur', () => {
    expect(dur(45)).toBe('45s');
    expect(dur(12 * 60 + 59)).toBe('12m');
    expect(dur(2 * 3600 + 5 * 60 + 30)).toBe('2h 5m');
  });
  it('onFor', () => {
    expect(onFor(48)).toBe('48s');
    expect(onFor(160)).toBe('2m 40s');
    expect(onFor(null)).toBe('-');
  });
  it('wait', () => {
    expect(wait(30)).toBe('<1m');
    expect(wait(3 * 3600 + 10 * 60)).toBe('3h 10m');
    expect(wait(2 * 86400 + 4 * 3600)).toBe('2d 4h');
  });
  it('delta', () => {
    expect(delta(11, 13)).toBe(-15);
    expect(delta(5, 0)).toBeNull();
  });
  it('calendar dates never shift', () => {
    expect(dateLabel('2026-09-15')).toBe('15 Sep');
    expect(dateLabel('2026-10-14T23:30:00+00')).toBe('14 Oct');
  });
});

describe('lift colour uses the raw ratio', () => {
  it('61/41 labels 1.5x but is not green', () => {
    expect((61 / 41).toFixed(1)).toBe('1.5');
    expect(liftTone(61 / 41)).toBe('flat');
    expect(liftTone(1.5)).toBe('good');
    expect(liftTone(0.8)).toBe('bad');
  });
});

describe('tracking gap', () => {
  it('hidden with 151 starts and 11 joined', () => {
    expect(showTrackingGap(11, 151)).toBe(false);
  });
  it('shown with 1 start and 11 joined, singular copy', () => {
    expect(showTrackingGap(11, 1)).toBe(true);
    render(<TrackingGap joined={11} starts={1} />);
    expect(screen.getByText(trackingGapCopy(11, 1)).textContent).toBe(
      '11 members joined in 30 days but only 1 sign-up start was recorded, so the old sign-up funnel read 1, 0, 0. Joined now comes from accounts, not events.',
    );
  });
});

describe('routing', () => {
  const p = (q: string) => new URLSearchParams(q);
  it('legacy params land on the right lens', () => {
    expect(lensOf(p('tab=live'))).toBe('live');
    expect(lensOf(p('tab=overview'))).toBe('health');
    expect(lensOf(p('tab=funnels'))).toBe('journeys');
    expect(lensOf(p('view=retention'))).toBe('health');
    expect(legacyLens('screens', null)).toBe('screens');
    expect(lensOf(p(''))).toBe('health');
  });
  it('diagnostics stay on tab=events and tab=auth', () => {
    expect(diagnosticOf(p('tab=events'))).toBe('events');
    expect(diagnosticOf(p('tab=auth'))).toBe('auth');
    expect(diagnosticOf(p('tab=live'))).toBeNull();
  });
  it('Live remembers where Back returns and Back clears staff', () => {
    const live = toLive(p('lens=screens&range=7d'));
    expect(live.get('lens')).toBe('live');
    expect(live.get('from')).toBe('screens');
    expect(live.get('range')).toBe('7d');
    live.set('staff', '1');
    const back = backFromLive(live);
    expect(back.get('lens')).toBe('screens');
    expect(back.has('staff')).toBe(false);
    expect(back.has('from')).toBe(false);
  });
});

describe('screen area chips', () => {
  it('orders by total time with Unlisted last', () => {
    const r = (area: string, secs: number) => ({ route: area + secs, label: '', area, views: 1, secs, members: 1 });
    expect(areaOrder([r('Unlisted', 9999), r('Feed', 10), r('Explore', 30), r('Feed', 25)]))
      .toEqual(['All', 'Feed', 'Explore', 'Unlisted']);
  });
});
