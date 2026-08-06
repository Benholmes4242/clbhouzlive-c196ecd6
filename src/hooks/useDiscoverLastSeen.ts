import { useCallback, useEffect, useRef, useState } from 'react';

import { resetDiscoverNewCounts } from '@/stores/discoverNewStore';

/**
 * useDiscoverLastSeen (BRIEF_DISCOVER_NEW_SINCE, section 1).
 *
 * STORAGE: localStorage, namespaced per member. There is no server-side
 * per-user preferences row on this project (no user_preferences / user_settings
 * table exists), and the brief forbids creating one for this, so the stamp is
 * device-local by design.
 *
 * WRITE ON EXIT, NEVER ON ARRIVAL. Writing on arrival would clear the markers
 * before the member had a chance to read them. The stamp is therefore written
 * when they LEAVE: route change away, Discover tab switch away (both unmount
 * the page body) and app background.
 *
 * The baseline is read ONCE per visit, so markers persist for the whole visit —
 * scrolling past an item or tapping it never clears it.
 *
 * FIRST EVER VISIT: no stored stamp means baseline null means NOTHING is marked.
 * The stamp lands on that first exit and marking starts from the second visit.
 */

const KEY_PREFIX = 'clbhouz.discover.lastSeen';

function storageKey(userId?: string | null): string {
  return `${KEY_PREFIX}.${userId ?? 'anon'}`;
}

export function readDiscoverLastSeen(userId?: string | null): number | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeDiscoverLastSeen(userId?: string | null, at = Date.now()): void {
  try {
    localStorage.setItem(storageKey(userId), String(at));
  } catch {
    /* private mode / quota — the markers simply never appear */
  }
}

export interface DiscoverLastSeen {
  /** Baseline for this visit; null on a first ever visit (nothing is marked). */
  lastSeen: number | null;
  /** Write the stamp. Call only on exit. */
  markSeen: () => void;
}

export function useDiscoverLastSeen(userId?: string | null): DiscoverLastSeen {
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const loadedFor = useRef<string | null>(null);
  const mounted = useRef(true);

  // The session resolves after mount, so the baseline loads as soon as the
  // member identity is known — once per identity, never again on re-render.
  useEffect(() => {
    const id = userId ?? 'anon';
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setLastSeen(readDiscoverLastSeen(userId));
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    const now = Date.now();
    writeDiscoverLastSeen(userId, now);
    resetDiscoverNewCounts();
    // Only touch state while the page is still alive; on unmount the write is
    // all that matters (the next visit reads it fresh).
    if (mounted.current) setLastSeen(now);
  }, [userId]);

  return { lastSeen, markSeen };
}

/**
 * Marks the exit points for a mounted Discover body: unmount (route change or
 * Discover tab switch — SlidingPanels renders only the active panel, so both
 * unmount this tree) and app background.
 */
export function useMarkDiscoverSeenOnExit(markSeen: () => void): void {
  const ref = useRef(markSeen);
  ref.current = markSeen;

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) ref.current();
    };
    const onPageHide = () => ref.current();

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      ref.current();
    };
  }, []);
}
