import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { resetDiscoverNewCounts } from '@/stores/discoverNewStore';

/**
 * useDiscoverLastSeen (BRIEF_DISCOVER_NEW_SINCE + server storage pass).
 *
 * TRUTH: public.user_surface_last_seen, surface_key 'discover', written through
 * public.mark_surface_seen() which upserts MONOTONICALLY and clamps future
 * stamps to now(). The stamp is therefore server-clocked and shared across a
 * member's devices — marking Discover seen on one device un-marks it on the next.
 *
 * LOCALSTORAGE IS A CACHE, NOT THE TRUTH. It is read first so markers do not
 * flicker while the network resolves, then reconciled to the LATER of local and
 * server. Offline visits ride the local value and reconcile on the next
 * successful exit-write.
 *
 * WRITE ON EXIT, NEVER ON ARRIVAL. Writing on arrival would clear the markers
 * before the member had a chance to read them. The stamp is therefore written
 * when they LEAVE: route change away, Discover tab switch away (both unmount
 * the page body) and app background.
 *
 * FIRST EVER VISIT: no stored stamp anywhere means baseline null means NOTHING
 * is marked. The stamp lands on that first exit and marking starts from the
 * second visit.
 *
 * SIGNED OUT: no read, no write, no markers — the layer is inert.
 *
 * FAILURE IS SILENT BUT NOT LOSSY: an rpc failure still updates the local
 * stamp, and the next exit retries. Navigation is never blocked, nothing toasts.
 */

const KEY_PREFIX = 'clbhouz.discover.lastSeen';
const SURFACE_KEY = 'discover';

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

function tsOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = new Date(value).getTime();
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Server read. Returns undefined when the read itself failed (offline). */
async function fetchServerLastSeen(): Promise<number | null | undefined> {
  const { data, error } = await supabase
    .from('user_surface_last_seen')
    .select('last_seen_at')
    .eq('surface_key', SURFACE_KEY)
    .maybeSingle();

  if (error) {
    console.warn('[discover last-seen] server read failed', error.message);
    return undefined;
  }
  return tsOf((data as { last_seen_at?: string } | null)?.last_seen_at);
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

  /**
   * Migration flag: true only while a local stamp exists and the server has no
   * row yet. In that one case the first exit-write carries the local stamp as
   * p_seen_at so nobody's existing position is lost. Never after that.
   */
  const migrateStamp = useRef<number | null>(null);

  // The session resolves after mount, so the baseline loads as soon as the
  // member identity is known — once per identity, never again on re-render.
  useEffect(() => {
    // Signed out: inert. No read, no baseline, so nothing is ever marked.
    if (!userId) {
      loadedFor.current = null;
      migrateStamp.current = null;
      setLastSeen(null);
      return;
    }
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;

    // 1. Instant baseline from the cache so markers do not flicker.
    const local = readDiscoverLastSeen(userId);
    setLastSeen(local);

    // 2. Reconcile to the server value, taking the LATER of the two.
    let cancelled = false;
    void (async () => {
      const server = await fetchServerLastSeen();
      if (cancelled || !mounted.current) return;

      if (server === undefined) {
        // Offline / read failed — the local value carries this visit.
        return;
      }
      if (server === null && local != null) {
        migrateStamp.current = local;
        return;
      }
      if (server != null) {
        migrateStamp.current = null;
        const merged = Math.max(server, local ?? 0);
        setLastSeen(merged);
        writeDiscoverLastSeen(userId, merged);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    // Signed out: nothing to stamp.
    if (!userId) return;

    const now = Date.now();
    const carry = migrateStamp.current;

    // Local cache first, so the write is never lossy even if the rpc fails.
    writeDiscoverLastSeen(userId, Math.max(now, carry ?? 0));
    resetDiscoverNewCounts();
    // Only touch state while the page is still alive; on unmount the write is
    // all that matters (the next visit reads it fresh).
    if (mounted.current) setLastSeen(now);

    // Fire and forget. The server clocks the stamp (no client timestamp),
    // except for the one-off migration of a pre-existing local stamp.
    const args: { p_surface_key: string; p_seen_at?: string } = {
      p_surface_key: SURFACE_KEY,
    };
    if (carry != null) args.p_seen_at = new Date(carry).toISOString();
    migrateStamp.current = null;

    void supabase
      .rpc('mark_surface_seen', args)
      .then(({ error }) => {
        if (error) {
          console.warn('[discover last-seen] mark_surface_seen failed', error.message);
          // Retry happens naturally on the next exit; local stamp already holds.
          if (carry != null) migrateStamp.current = carry;
        }
      });
  }, [userId]);

  return { lastSeen, markSeen };
}

/**
 * Marks the exit points for a mounted Discover body: unmount (route change or
 * Discover tab switch — SlidingPanels renders only the active panel, so both
 * unmount this tree) and app background.
 *
 * Median WebView note: `visibilitychange` -> hidden is the reliable background
 * signal (it fires before the app is suspended, so the rpc gets dispatched);
 * `pagehide` fires on webview teardown but the request may be cut off, and
 * `beforeunload` is not dependable there at all. The local cache write is
 * synchronous in every case, so a dropped rpc costs nothing but a one-visit
 * delay — the next exit re-sends.
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
