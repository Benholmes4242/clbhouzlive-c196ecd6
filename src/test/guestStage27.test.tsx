/**
 * GUEST STAGE 2.7 — the Clubhouse locks against live feed nodes, never one
 * observed node (Virtuoso replaces item nodes).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({ track: vi.fn(), guest: true }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => h.guest, isGuestUser: () => h.guest }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestGateShown: (a: unknown) => h.track(a) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }) } } }));

import { useGuestClubhouseGate } from '@/features/guest/useGuestSurfaceGate';
import * as store from '@/features/guest/guestGateStore';

const VH = 844;
let root: HTMLElement;
function post(i: number, top: number) {
  const el = document.createElement('div');
  el.setAttribute('data-card-index', String(i));
  el.getBoundingClientRect = () => ({ top, bottom: top + 500, left: 0, right: 390, width: 390, height: 500, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  return el;
}
const frame = () => act(async () => { await new Promise(r => setTimeout(r, 30)); });
const scroll = async () => { document.getElementById('scroller')!.dispatchEvent(new Event('scroll')); await frame(); };

beforeEach(() => {
  vi.resetModules();
  h.track.mockClear(); h.guest = true;
  Object.defineProperty(window, 'innerHeight', { value: VH, configurable: true });
  root = document.createElement('div'); root.id = 'root';
  const sc = document.createElement('div'); sc.id = 'scroller'; root.appendChild(sc);
  document.body.appendChild(root);
});
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('Stage 2.7 — Clubhouse lock against live nodes', () => {
  it('the node carrying index 3 is replaced after mount, then scrolled into view: it locks', async () => {
    const lock = vi.spyOn(store, 'lockSurface').mockReturnValue(true);
    const sc = document.getElementById('scroller')!;
    [0, 1, 2].forEach(i => sc.appendChild(post(i, i * 300)));
    const old = post(3, 1400); sc.appendChild(old);
    renderHook(() => useGuestClubhouseGate());
    await frame();
    expect(lock).not.toHaveBeenCalled();
    old.replaceWith(post(3, 1400));
    await frame();
    expect(lock).not.toHaveBeenCalled();
    sc.querySelector('[data-card-index="3"]')!.replaceWith(post(3, 700));
    await scroll();
    expect(lock).toHaveBeenCalledWith('clubhouse');
    expect(h.track).toHaveBeenCalledWith({ surface: 'clubhouse', trigger: 'scroll' });
  });

  it('a fling where index 3 never renders but index 6 is in view: it locks', async () => {
    const lock = vi.spyOn(store, 'lockSurface').mockReturnValue(true);
    const sc = document.getElementById('scroller')!;
    [0, 1, 2].forEach(i => sc.appendChild(post(i, i * 300)));
    renderHook(() => useGuestClubhouseGate());
    await frame();
    sc.innerHTML = '';
    sc.appendChild(post(6, 100));
    await scroll();
    expect(lock).toHaveBeenCalledWith('clubhouse');
  });

  it('at the top of the feed, with only posts 0 to 2 in view: no lock', async () => {
    const lock = vi.spyOn(store, 'lockSurface').mockReturnValue(true);
    const sc = document.getElementById('scroller')!;
    [0, 1, 2].forEach(i => sc.appendChild(post(i, i * 300)));
    sc.appendChild(post(3, VH + 10));
    renderHook(() => useGuestClubhouseGate());
    await scroll();
    expect(lock).not.toHaveBeenCalled();
  });

  it('a member never locks', async () => {
    h.guest = false;
    const lock = vi.spyOn(store, 'lockSurface').mockReturnValue(true);
    document.getElementById('scroller')!.appendChild(post(5, 0));
    renderHook(() => useGuestClubhouseGate());
    await scroll();
    expect(lock).not.toHaveBeenCalled();
  });

  it('returning to a locked Clubhouse shows the card', async () => {
    vi.spyOn(store, 'isSurfaceLocked').mockImplementation(s => s === 'clubhouse');
    vi.spyOn(store, 'getGuestCardRequest').mockReturnValue(null);
    const open = vi.spyOn(store, 'openGuestCard').mockImplementation(() => {});
    renderHook(() => useGuestClubhouseGate());
    expect(open).toHaveBeenCalledWith({ kind: 'scroll', surface: 'clubhouse' });
  });
});
