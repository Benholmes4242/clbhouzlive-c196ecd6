import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track } }));
import { useFitOneLine } from '@/features/explore-magazine/useFitOneLine';
import { LocalHoleChart } from '@/components/courses/course-detail/about/HowItPlays';
import { installErrorTracking } from '@/lib/errorTracking';

let observers: Array<() => void> = [];
let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;
let origRO: typeof ResizeObserver;
const flushFrames = () => { const fs = [...frames.values()]; frames.clear(); fs.forEach(f => f(0)); };
beforeEach(() => {
  observers = []; frames = new Map(); nextFrame = 1;
  origRO = window.ResizeObserver;
  (window as any).ResizeObserver = class { cb: () => void; constructor(cb: () => void) { this.cb = cb; observers.push(() => cb([{ contentRect: { height: 0 } }] as any)); } observe() {} disconnect() {} };
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { const id = nextFrame++; frames.set(id, cb); return id; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => { frames.delete(id); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); (window as any).ResizeObserver = origRO; });

function Fit() { const ref = useFitOneLine<HTMLSpanElement>('Course name', 20, 12); return <div><span ref={ref}>Course name</span></div>; }

describe('FIX_RO_NOISE_1 useFitOneLine', () => {
  it('an observer fire schedules one frame and the font write happens in it', () => {
    const { container } = render(<Fit />);
    const el = container.querySelector('span')!;
    el.style.fontSize = '7px';
    act(() => observers[0]());
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(el.style.fontSize).toBe('7px');
    act(() => flushFrames());
    expect(el.style.fontSize).toBe('20px');
  });
  it('cleanup cancels a pending frame', () => {
    const { unmount } = render(<Fit />);
    act(() => observers[0]());
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(frames.size).toBe(0);
  });
});

describe('FIX_RO_NOISE_1 HowItPlays chart', () => {
  it('an observer fire updates width via the next frame', () => {
    const holes = [1, 2].map(n => ({ hole_no: n, par: 4, yards: 400, stroke_index: n, rounds: 30, avg_to_par: 0.5, avg_gross: 4.5, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 5, par: 15, bogey: 8, double: 2 } })) as any;
    const mine = new Map([[1, { hole_no: 1, avg_to_par: 0.3 }], [2, { hole_no: 2, avg_to_par: 0.4 }]]) as any;
    const { container } = render(<LocalHoleChart holes={holes} myByHole={mine} hasYou />);
    expect(container.querySelector('polyline')).toBeNull();
    const wrap = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    Object.defineProperty(wrap, 'clientWidth', { configurable: true, value: 300 });
    act(() => observers[0]());
    expect(container.querySelector('polyline')).toBeNull();
    act(() => flushFrames());
    expect(container.querySelector('polyline')).not.toBeNull();
  });
});

describe('FIX_RO_NOISE_1 error tracking', () => {
  beforeEach(() => { track.mockClear(); installErrorTracking(); });
  for (const message of ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications']) {
    it(`records nothing for "${message}"`, () => {
      window.dispatchEvent(new ErrorEvent('error', { message }));
      expect(track).not.toHaveBeenCalled();
    });
  }
  it('still tracks any other error', () => {
    window.dispatchEvent(new ErrorEvent('error', { message: `Boom ${Date.now()}` }));
    expect(track).toHaveBeenCalledWith('app_error', expect.objectContaining({ kind: 'error' }));
  });
});
