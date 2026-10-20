import { afterEach, describe, expect, it, vi } from 'vitest';
import { STATUS_BAR_CANVAS } from '@/lib/tokens/surfaces';

describe('launch status bar bridge', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete window.median;
    delete window.median_library_ready;
    delete (window as unknown as { __lvChromeCache?: unknown }).__lvChromeCache;
    vi.resetModules();
  });

  it('first native request uses the launch canvas and white-icon intent', async () => {
    vi.resetModules();
    const set = vi.fn();
    window.median = { statusbar: { set } };
    await import('@/hooks/useMedianStatusBar');
    expect(set).toHaveBeenNthCalledWith(1, {
      style: 'dark', color: STATUS_BAR_CANVAS, overlay: true, blur: false,
    });
  });

  it('retries the dark launch request when the bridge becomes ready', async () => {
    vi.resetModules();
    const { ensureStatusBarOverlayBooted } = await import('@/hooks/useMedianStatusBar');
    ensureStatusBarOverlayBooted();
    const set = vi.fn();
    window.median = { statusbar: { set } };
    window.median_library_ready?.();
    expect(set).toHaveBeenCalledWith({
      style: 'dark', color: STATUS_BAR_CANVAS, overlay: true, blur: false,
    });
  });

  it('hands Home back to transparent immersive chrome after the launch request', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const set = vi.fn();
    window.median = { statusbar: { set } };
    const { applyRouteChrome } = await import('@/lib/routeChrome');
    applyRouteChrome('/clubhouse');
    expect(set).toHaveBeenNthCalledWith(1, {
      style: 'dark', color: STATUS_BAR_CANVAS, overlay: true, blur: false,
    });
    expect(set).toHaveBeenLastCalledWith({
      style: 'dark', color: '00000000', overlay: true, blur: false,
    });
  });
});