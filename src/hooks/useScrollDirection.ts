/**
 * Nav scroll direction store (module singleton).
 *
 * Tracks whether the floating bottom nav pill should render EXPANDED or
 * CONDENSED based on scroll direction across one or more scroll containers.
 *
 * - Any scroller can register itself via registerNavScroller(el).
 * - The window is registered automatically on first import (browser only).
 * - Direction thresholds are asymmetric: quick to re-expand, slower to hide.
 * - Always expanded near the top of the current active scroller (< 80px).
 */

import { useSyncExternalStore } from 'react';

export type NavState = 'expanded' | 'condensed';

const listeners = new Set<() => void>();
let state: NavState = 'expanded';
let forceExpandCount = 0; // when > 0, always expanded (sheets, keyboard, route change)

const DOWN_THRESHOLD = 24;
const UP_THRESHOLD = 12;
const TOP_ZONE = 80;
const JITTER = 2;

// Per-scroller state
type ScrollerRecord = {
  target: HTMLElement | Window;
  lastTop: number;
  accum: number;
  dir: 'up' | 'down' | null;
  onScroll: (e: Event) => void;
};
const scrollers = new Map<HTMLElement | Window, ScrollerRecord>();

function emit() {
  for (const l of listeners) l();
}

function setState(next: NavState) {
  if (forceExpandCount > 0) next = 'expanded';
  if (state !== next) {
    state = next;
    emit();
  }
}

function getScrollTop(target: HTMLElement | Window): number {
  if (target === window) return window.scrollY || document.documentElement.scrollTop || 0;
  return (target as HTMLElement).scrollTop || 0;
}

function makeHandler(record: ScrollerRecord) {
  let raf = 0;
  return () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const top = Math.max(0, getScrollTop(record.target));
      const delta = top - record.lastTop;
      record.lastTop = top;

      if (top < TOP_ZONE) {
        record.accum = 0;
        record.dir = null;
        setState('expanded');
        return;
      }
      if (Math.abs(delta) < JITTER) return;

      const dir: 'up' | 'down' = delta > 0 ? 'down' : 'up';
      if (dir !== record.dir) {
        record.dir = dir;
        record.accum = 0;
      }
      record.accum += Math.abs(delta);

      if (dir === 'down' && record.accum > DOWN_THRESHOLD) {
        setState('condensed');
      } else if (dir === 'up' && record.accum > UP_THRESHOLD) {
        setState('expanded');
      }
    });
  };
}

export function registerNavScroller(target: HTMLElement | Window | 'window' | null | undefined): () => void {
  if (typeof window === 'undefined' || !target) return () => {};
  const el: HTMLElement | Window = target === 'window' ? window : target;
  if (scrollers.has(el)) return () => unregister(el);

  const record: ScrollerRecord = {
    target: el,
    lastTop: getScrollTop(el),
    accum: 0,
    dir: null,
    onScroll: () => {},
  };
  record.onScroll = makeHandler(record);
  el.addEventListener('scroll', record.onScroll, { passive: true } as AddEventListenerOptions);
  scrollers.set(el, record);

  return () => unregister(el);
}

function unregister(el: HTMLElement | Window) {
  const rec = scrollers.get(el);
  if (!rec) return;
  el.removeEventListener('scroll', rec.onScroll as EventListener);
  scrollers.delete(el);
}

export function pushForceExpand(): () => void {
  forceExpandCount++;
  setState('expanded');
  return () => {
    forceExpandCount = Math.max(0, forceExpandCount - 1);
  };
}

export function resetToExpanded() {
  for (const rec of scrollers.values()) {
    rec.accum = 0;
    rec.dir = null;
    rec.lastTop = getScrollTop(rec.target);
  }
  setState('expanded');
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return state;
}

export function useNavScrollState(): NavState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Auto-register the window scroller once (SSR-safe).
if (typeof window !== 'undefined') {
  registerNavScroller(window);
}
