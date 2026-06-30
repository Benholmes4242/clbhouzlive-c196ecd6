/**
 * navTiming — per-route navigation transaction model.
 *
 * Dev/preview only. Production: every public function no-ops and observers
 * are never created. Gate: import.meta.env.DEV || (?perf=1 query flag).
 *
 * One transaction per route change. Emits a single structured line at
 * `nav:interactive` (or on timeout). Flagged navs warn with [PERF-WARN].
 */

// Routes that intentionally hold a neutral background instead of a skeleton (e.g. /auth shows the
// charcoal BootHold while the session resolves, then paints in one shot). These must NOT be flagged
// skeleton:MISSING. Path-based so the verdict is race-proof (no dependency on effect timing).
const SKELETON_EXEMPT_PATHS = new Set<string>(['/auth']);

function isSkeletonExemptPath(path: string): boolean {
  // exact match or known auth subpaths (e.g. /auth/callback) if added later
  return SKELETON_EXEMPT_PATHS.has(path);
}

import * as React from 'react';
import { AppLog } from '@/lib/logger';

export type NavPhase =
  | 'start'
  | 'lazy-start'
  | 'lazy-end'
  | 'skeleton-shown'
  | 'skeleton-exempt'
  | 'data-settled'
  | 'content-painted'
  | 'interactive';

export interface NavTransaction {
  id: number;
  path: string;
  startedAt: number;
  marks: Partial<Record<NavPhase, number>>;
  headerMounts: number;
  headerUnmounts: number;
  pageRootMounts: number;
  cls: number;
  largestShift: number;
  largestShiftEl?: string;
  finalized: boolean;
}

interface NavSummary {
  id: number;
  path: string;
  total: number;
  /** Time from nav start to content-painted (LCP-equivalent). Null when
   * the page didn't call usePageReady — most non-feed pages today. */
  content: number | null;
  lazy: number;
  skeleton: number;
  data: number;
  paint: number;
  cls: number;
  headerFlash: number; // number of extra header remounts (>1 mount within nav)
  skeletonVerdict: 'OK' | 'FLASH' | 'MISSING' | 'NA';
  mounts: number;
  doubleMount: boolean;
  flagged: boolean;
}

type Listener = (snapshot: { current: NavTransaction | null; recent: NavSummary[] }) => void;

const RECENT_LIMIT = 20;
const FINALIZE_TIMEOUT_MS = 5000;

const PERF_FLAG_KEY = 'clbhouz:perf';

function perfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.DEV) return true;
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('perf') === '1') return true;
  } catch {}
  try {
    if (window.location.hash.includes('perf')) return true;
  } catch {}
  try {
    if (localStorage.getItem(PERF_FLAG_KEY) === '1') return true;
  } catch {}
  return false;
}

const ENABLED = perfEnabled();

// Live visibility gate for UI surfaces (HUDs, console capture). Re-reads each call so an in-app
// toggle takes effect WITHOUT a reload (Median WebView reloads may not re-eval modules).
// Hot-path instrumentation keeps using the frozen ENABLED const above for true zero-cost.
let liveOverride: boolean | null = null;
const perfLiveSubs = new Set<() => void>();

export const subscribePerfLive = (fn: () => void) => {
  perfLiveSubs.add(fn);
  return () => { perfLiveSubs.delete(fn); };
};

export function setPerfLive(on: boolean): void {
  liveOverride = on;
  try {
    if (on) localStorage.setItem(PERF_FLAG_KEY, '1');
    else localStorage.removeItem(PERF_FLAG_KEY);
  } catch {}
  perfLiveSubs.forEach((f) => { try { f(); } catch {} });
}

export const enablePerf = () => setPerfLive(true);
export const disablePerf = () => setPerfLive(false);


class NavTimingController {
  private nextId = 1;
  private current: NavTransaction | null = null;
  private settling: NavTransaction | null = null; // finalized headline, still awaiting late content-painted
  private recent: NavSummary[] = [];
  private listeners = new Set<Listener>();
  private finalizeTimer: ReturnType<typeof setTimeout> | null = null;
  private clsObserver: PerformanceObserver | null = null;

  isEnabled(): boolean {
    return ENABLED;
  }

  getCurrent(): NavTransaction | null {
    return this.current;
  }

  getRecent(): NavSummary[] {
    return this.recent;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private notify() {
    const snap = { current: this.current, recent: this.recent };
    this.listeners.forEach((l) => {
      try { l(snap); } catch { /* ignore */ }
    });
  }

  beginNav(path: string) {
    if (!ENABLED) return;
    // Finalize any prior transaction that never reached interactive
    if (this.current && !this.current.finalized) {
      this.finalize('superseded');
    }
    // Close any settling tx from a previous nav (it keeps whatever it last emitted).
    if (this.settling) {
      this.closeTx(this.settling);
    }
    const id = this.nextId++;
    const now = performance.now();
    this.current = {
      id,
      path,
      startedAt: now,
      marks: { start: now },
      headerMounts: 0,
      headerUnmounts: 0,
      pageRootMounts: 0,
      cls: 0,
      largestShift: 0,
      finalized: false,
    };
    try { performance.mark(`clbz:nav:${id}:start`); } catch { /* ignore */ }
    this.attachClsObserver();
    this.armFinalizeTimer();
    this.notify();
  }

  mark(phase: NavPhase) {
    if (!ENABLED) return;
    // Late content-painted (and data-settled) may land on the settling tx after interactive closed
    // the headline. Everything else only applies to the live current tx.
    const tx =
      this.current ??
      (this.settling && (phase === 'content-painted' || phase === 'data-settled')
        ? this.settling
        : null);
    if (!tx) return;
    if (tx.marks[phase] != null) return; // first-write-wins per phase
    const t = performance.now();
    tx.marks[phase] = t;
    try { performance.mark(`clbz:nav:${tx.id}:${phase}`); } catch { /* ignore */ }
    if (phase === 'interactive') {
      this.finalize('interactive');
      return;
    }
    if (tx === this.settling && phase === 'content-painted') {
      // Late LCP landed: recompute + re-emit corrected summary, then close.
      const summary = this.buildSummary(tx);
      this.recent = [summary, ...this.recent.filter((s) => s.id !== tx.id)].slice(0, RECENT_LIMIT);
      this.emit(summary, 'content');
      this.notify();
      this.closeTx(tx);
      return;
    }
    this.notify();
  }

  noteHeaderMount() {
    if (!ENABLED || !this.current) return;
    this.current.headerMounts++;
    this.notify();
  }

  noteHeaderUnmount() {
    if (!ENABLED || !this.current) return;
    this.current.headerUnmounts++;
  }

  notePageRootMount() {
    if (!ENABLED || !this.current) return;
    this.current.pageRootMounts++;
    this.notify();
  }

  private attachClsObserver() {
    if (typeof PerformanceObserver === 'undefined') return;
    try { this.clsObserver?.disconnect(); } catch { /* ignore */ }
    try {
      this.clsObserver = new PerformanceObserver((list) => {
        if (!this.current) return;
        for (const entry of list.getEntries() as any[]) {
          if (entry.hadRecentInput) continue;
          const value = entry.value ?? 0;
          this.current.cls += value;
          if (value > this.current.largestShift) {
            this.current.largestShift = value;
            const src = entry.sources?.[0];
            const node: Element | undefined = src?.node;
            if (node && node.tagName) {
              const cls = typeof node.className === 'string' ? `.${node.className.split(/\s+/)[0]}` : '';
              this.current.largestShiftEl = `${node.tagName.toLowerCase()}${cls}`;
            }
          }
        }
        this.notify();
      });
      // Intentionally NOT buffered: we want only shifts that occur during
      // THIS nav's window, not every shift since page load (which would make
      // CLS climb monotonically across the session).
      this.clsObserver.observe({ type: 'layout-shift' } as any);
    } catch {
      this.clsObserver = null;
    }
  }

  private armFinalizeTimer() {
    if (this.finalizeTimer) clearTimeout(this.finalizeTimer);
    this.finalizeTimer = setTimeout(() => {
      if (this.current) this.finalize('timeout');
      else if (this.settling) this.closeTx(this.settling);
    }, FINALIZE_TIMEOUT_MS);
  }

  private buildSummary(tx: NavTransaction): NavSummary {
    const m = tx.marks;
    // `total` = shell paint (FCP-equivalent). We keep nav close at interactive
    // so every page stays comparable on first-paint regardless of deep data.
    const end = m.interactive ?? m['content-painted'] ?? m['data-settled'] ?? performance.now();
    const total = Math.round(end - tx.startedAt);
    // `content` = settle (LCP-equivalent). Null when the page didn't signal
    // readiness via usePageReady — most non-feed pages today.
    const content =
      m['content-painted'] != null
        ? Math.round(m['content-painted']! - tx.startedAt)
        : null;

    const lazy =
      m['lazy-start'] != null && m['lazy-end'] != null
        ? Math.round(m['lazy-end']! - m['lazy-start']!)
        : 0;
    const skeleton =
      m['skeleton-shown'] != null
        ? Math.round((m['content-painted'] ?? end) - m['skeleton-shown']!)
        : 0;
    const data =
      m['data-settled'] != null
        ? Math.round(m['data-settled']! - tx.startedAt)
        : 0;
    const paint =
      m['content-painted'] != null && m['data-settled'] != null
        ? Math.round(m['content-painted']! - m['data-settled']!)
        : 0;

    const headerFlash = Math.max(0, tx.headerMounts - 1);
    const mounts = tx.pageRootMounts;
    const doubleMount = mounts > 1;

    let skeletonVerdict: NavSummary['skeletonVerdict'] = 'NA';
    if (isSkeletonExemptPath(tx.path) || m['skeleton-exempt'] != null) {
      skeletonVerdict = 'NA';
    } else if (m['skeleton-shown'] != null) {
      skeletonVerdict = skeleton < 100 ? 'FLASH' : 'OK';
    } else if (total > 200) {
      skeletonVerdict = 'MISSING';
    }

    const flagged =
      headerFlash > 0 ||
      skeletonVerdict === 'MISSING' ||
      skeletonVerdict === 'FLASH' ||
      tx.cls > 0.1 ||
      doubleMount;

    return {
      id: tx.id,
      path: tx.path,
      total,
      content,
      lazy,
      skeleton,
      data,
      paint,
      cls: Number(tx.cls.toFixed(3)),
      headerFlash,
      skeletonVerdict,
      mounts,
      doubleMount,
      flagged,
    };
  }

  private closeTx(tx: NavTransaction) {
    if (this.finalizeTimer) {
      clearTimeout(this.finalizeTimer);
      this.finalizeTimer = null;
    }
    try { this.clsObserver?.disconnect(); } catch { /* ignore */ }
    this.clsObserver = null;
    if (this.current === tx) this.current = null;
    if (this.settling === tx) this.settling = null;
    this.notify();
  }

  private finalize(reason: 'interactive' | 'timeout' | 'superseded' | 'content') {
    if (!this.current || this.current.finalized) return;
    const tx = this.current;
    tx.finalized = true;

    const summary = this.buildSummary(tx);
    this.recent = [summary, ...this.recent.filter((s) => s.id !== tx.id)].slice(0, RECENT_LIMIT);
    this.emit(summary, reason);

    if (reason === 'interactive' && tx.marks['content-painted'] == null) {
      // Keep amendable for a late content milestone. Stop the CLS observer (interactive = end of
      // the CLS window) but keep tx alive in the settling slot. finalizeTimer remains as hard cap.
      try { this.clsObserver?.disconnect(); } catch { /* ignore */ }
      this.clsObserver = null;
      this.settling = tx;
      this.current = null;
      this.notify();
      return;
    }

    // Fully close (timeout / superseded / content already present at interactive).
    this.closeTx(tx);
  }

  private emit(s: NavSummary, reason: string) {
    const tag = `nav#${s.id}`;
    const line =
      `${s.path.padEnd(24)} fcp ${s.total}ms` +
      (s.content != null ? ` · content ${s.content}ms` : '') +
      ` | lazy ${s.lazy} · skeleton ${s.skeleton} · data ${s.data} · paint ${s.paint} | ` +
      `CLS ${s.cls} · header:${s.headerFlash > 0 ? `FLASH(${s.headerFlash + 1})` : 'OK'} · ` +
      `skeleton:${s.skeletonVerdict} · mounts:${s.mounts}` +
      (reason !== 'interactive' ? `  [${reason}]` : '');

    if (s.flagged) {
      AppLog.warn(`PERF-WARN ${tag}`, line);
    } else {
      AppLog.info(tag, line);
    }
  }
}


export const navTiming = new NavTimingController();

// --- Public helper API (no-ops in production) ---

export const isPerfEnabled = (): boolean => {
  if (liveOverride !== null) return liveOverride;
  if (ENABLED) return true;
  try { if (localStorage.getItem(PERF_FLAG_KEY) === '1') return true; } catch {}
  return false;
};

export function beginNav(path: string) {
  navTiming.beginNav(path);
}
export function markNav(phase: NavPhase) {
  navTiming.mark(phase);
}
export function markSkeletonShown() {
  navTiming.mark('skeleton-shown');
}
export function markSkeletonExempt() {
  navTiming.mark('skeleton-exempt');
}
export function markDataSettled() {
  navTiming.mark('data-settled');
}
export function markContentPainted() {
  navTiming.mark('content-painted');
}
export function markInteractive() {
  navTiming.mark('interactive');
}
export function noteHeaderMount() {
  navTiming.noteHeaderMount();
}
export function noteHeaderUnmount() {
  navTiming.noteHeaderUnmount();
}
export function notePageRootMount() {
  navTiming.notePageRootMount();
}

/**
 * Wrap React.lazy() to track per-route chunk fetch time.
 * Usage: const Page = trackedLazy('Page', () => import('./pages/Page'));
 */
export function trackedLazy<T extends { default: React.ComponentType<any> }>(
  _label: string,
  factory: () => Promise<T>,
) {
  return React.lazy(() => {
    if (ENABLED) markNav('lazy-start');
    return factory().then((mod) => {
      if (ENABLED) markNav('lazy-end');
      return mod;
    });
  });
}
