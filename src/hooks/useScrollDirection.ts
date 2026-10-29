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
import { getPageScrollTop } from '@/lib/getScrollParent';


export type NavState = 'expanded' | 'condensed';

const listeners = new Set<() => void>();
let state: NavState = 'expanded';
let forceExpandCount = 0; // when > 0, always expanded (sheets, keyboard, route change)

const DOWN_THRESHOLD = 24;
const UP_THRESHOLD = 12;
const TOP_ZONE = 80;
const JITTER = 2;

/* SCROLLED FLAG (BRIEF_ISLANDS_NAV §2). A second piece of state computed in
   the SAME rAF handler — no new scroll listener. True once the active
   scroller's top passes 24px; drives the top scrim's cross-fade to the solid
   band and the logo island's scrolled title. Resets with resetToExpanded. */
const SCROLLED_THRESHOLD = 24;
let scrolled = false;

function setScrolled(next: boolean) {
  if (scrolled !== next) {
    scrolled = next;
    emit();
  }
}

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
  if (target === window) {
    /* The page scroller is #root, resolved once and cached by the shared helper.
       window.scrollY is always 0 in this app, so reading it here reported "at
       the top" forever. (#root is registered as its own scroller too; this
       branch only matters for the auto-registered window record.) */
    return getPageScrollTop();
  }
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
      setScrolled(top > SCROLLED_THRESHOLD);

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
  // The new page's real position decides, so a scrolled flag never carries
  // across routes (BRIEF_TOUR_OVERVIEW_BAND §3).
  let top = 0;
  for (const rec of scrollers.values()) top = Math.max(top, rec.lastTop);
  setScrolled(top > SCROLLED_THRESHOLD);
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

function getScrolledSnapshot() {
  return scrolled;
}

/** True once the active scroller passes 24px. See SCROLLED_THRESHOLD above. */
export function useChromeScrolled(): boolean {
  return useSyncExternalStore(subscribe, getScrolledSnapshot, getScrolledSnapshot);
}

// Auto-register document-level scrollers (SSR-safe).
// Different layouts scroll different elements depending on CSS:
//   - Some routes let `window` scroll (documentElement).
//   - Global CSS sets `body { height: 100%; overflow-y: auto }` making
//     body a scroll container.
//   - Global CSS also fixes `#root` to `100dvh`, and on light routes
//     `#root` itself is the actual scroller (its scrollHeight > clientHeight).
// Registering all three is harmless — each tracks its own scrollTop, and
// only the one the UA actually scrolls will emit events.
function autoRegisterRoots() {
  registerNavScroller(window);
  if (document.body) registerNavScroller(document.body);
  const root = document.getElementById('root');
  if (root) registerNavScroller(root);
}

if (typeof window !== 'undefined') {
  if (typeof document !== 'undefined' && document.body) {
    autoRegisterRoots();
  } else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', autoRegisterRoots, { once: true });
  }
}
