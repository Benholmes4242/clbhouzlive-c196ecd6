/**
 * overlayTiming — per-overlay open transaction model.
 *
 * Parallel to navTiming. Overlays open WHILE a nav transaction may be live
 * underneath, have animation phases navs don't, and a different verdict
 * (content-settle vs skeleton-missing). Purely additive; shares the perf
 * gate (isPerfEnabled) and LogHud surface (AppLog).
 *
 * Phases (per instance): open-start · animation-start · data-settled ·
 * mounted · content-painted · animation-done · close-start · closed.
 */
import { isPerfEnabled } from './navTiming';
import { AppLog } from '@/lib/logger';

export type OverlayPhase =
  | 'open-start'
  | 'animation-start'
  | 'data-settled'
  | 'content-painted'
  | 'animation-done'
  | 'close-start'
  | 'closed';

interface OverlayTx {
  id: number;
  name: string;
  startedAt: number;
  marks: Partial<Record<OverlayPhase, number>>;
  finalized: boolean;
}

export interface OverlaySummary {
  id: number;
  name: string;
  openLatency: number | null;
  settle: number | null;
  data: number | null;
  animDone: number | null;
  verdict: 'OK' | 'SLOW' | 'JANK' | 'NA';
  flagged: boolean;
}

class OverlayTimingController {
  private nextId = 1;
  private current: OverlayTx | null = null;
  private byId = new Map<number, OverlayTx>();
  private recent: OverlaySummary[] = [];
  private listeners = new Set<(s: { recent: OverlaySummary[] }) => void>();
  private notifyScheduled = false;
  private FINALIZE_MS = 6000;

  private notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    queueMicrotask(() => {
      this.notifyScheduled = false;
      const snap = { recent: this.recent };
      this.listeners.forEach((l) => { try { l(snap); } catch {} });
    });
  }

  subscribe(l: (s: { recent: OverlaySummary[] }) => void) {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }

  getRecent() { return this.recent; }

  open(name: string): number {
    if (!isPerfEnabled()) return -1;
    const id = this.nextId++;
    const now = performance.now();
    const tx: OverlayTx = {
      id,
      name,
      startedAt: now,
      marks: { 'open-start': now },
      longTasks: [],
      finalized: false,
    };
    this.observeLongTasks(tx);
    this.current = tx;
    this.byId.set(id, tx);
    setTimeout(() => this.finalizeIfOpen(id), this.FINALIZE_MS);
    this.notify();
    return id;
  }

  mark(id: number, phase: OverlayPhase) {
    if (!isPerfEnabled() || id < 0) return;
    const tx = this.byId.get(id);
    if (!tx || tx.finalized) return;
    // First-write-wins per phase. animation-start may re-fire on drag/exit;
    // keep the first one so drags after open don't move it.
    if (tx.marks[phase] == null) tx.marks[phase] = performance.now();

    if (phase === 'animation-start') this.stopLongTasks(tx);
    if (phase === 'mounted' || phase === 'animation-start' || phase === 'content-painted') this.emit(tx);
    if (phase === 'closed') { this.emit(tx); this.finalize(tx); }
  }

  private observeLongTasks(tx: OverlayTx) {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          tx.longTasks.push({ start: entry.startTime, duration: entry.duration });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      tx.longTaskObserver = observer;
    } catch {
      // Long Task API is not available in every runtime.
    }
  }

  private stopLongTasks(tx: OverlayTx) {
    if (!tx.longTaskObserver) return;
    try { tx.longTaskObserver.disconnect(); } catch {}
    tx.longTaskObserver = undefined;
  }

  private finalizeIfOpen(id: number) {
    const tx = this.byId.get(id);
    if (tx && !tx.finalized) { this.emit(tx); this.finalize(tx); }
  }

  private finalize(tx: OverlayTx) {
    this.stopLongTasks(tx);
    tx.finalized = true;
    this.byId.delete(tx.id);
    if (this.current === tx) this.current = null;
  }

  private buildSummary(tx: OverlayTx): OverlaySummary {
    const m = tx.marks;
    const t0 = m['open-start'];
    const clamp = (x: number | null) => (x == null ? null : Math.max(0, Math.round(x)));
    const openLatency = t0 != null && m['animation-start'] != null ? clamp(m['animation-start']! - t0) : null;
    const mounted = t0 != null && m.mounted != null ? clamp(m.mounted - t0) : null;
    const commitToAnim = m.mounted != null && m['animation-start'] != null ? clamp(m['animation-start']! - m.mounted) : null;
    const settle = t0 != null && m['content-painted'] != null ? clamp(m['content-painted']! - t0) : null;
    const data = t0 != null && m['data-settled'] != null ? clamp(m['data-settled']! - t0) : null;
    const animDone = t0 != null && m['animation-done'] != null ? clamp(m['animation-done']! - t0) : null;
    const openWindowEnd = m['animation-start'] ?? performance.now();
    const openWindowTasks = t0 == null
      ? []
      : tx.longTasks.filter((lt) => lt.start >= t0 && lt.start <= openWindowEnd);
    const longTaskCount = openWindowTasks.length;
    const longTaskTotal = Math.round(openWindowTasks.reduce((sum, lt) => sum + lt.duration, 0));
    const longTaskMax = Math.round(openWindowTasks.reduce((max, lt) => Math.max(max, lt.duration), 0));
    let verdict: OverlaySummary['verdict'] = 'NA';
    if (openLatency != null) {
      if (openLatency > 150) verdict = 'JANK';
      else if (settle != null && settle > 800) verdict = 'SLOW';
      else verdict = 'OK';
    }
    const flagged = verdict === 'JANK' || verdict === 'SLOW';
    return {
      id: tx.id,
      name: tx.name,
      openLatency,
      mounted,
      commitToAnim,
      settle,
      data,
      animDone,
      longTaskCount,
      longTaskTotal,
      longTaskMax,
      verdict,
      flagged,
    };
  }

  private emit(tx: OverlayTx) {
    const s = this.buildSummary(tx);
    this.recent = [s, ...this.recent.filter((r) => r.id !== s.id)].slice(0, 20);
    const line =
      `overlay:${s.name.padEnd(12)} open ${s.openLatency ?? '-'}ms · settle ${s.settle ?? '-'}ms` +
      ` · data ${s.data ?? '-'} · anim ${s.animDone ?? '-'}` +
      ` · mounted ${s.mounted ?? '-'} · c->anim ${s.commitToAnim ?? '-'}` +
      ` · LT ${s.longTaskCount}/${s.longTaskTotal}/${s.longTaskMax} · ${s.verdict}`;
    if (s.flagged) AppLog.warn(`OVL-WARN ovl#${s.id}`, line);
    else AppLog.info(`ovl#${s.id}`, line);
    this.notify();
  }
}

export const overlayTiming = new OverlayTimingController();
export function overlayOpen(name: string) { return overlayTiming.open(name); }
export function overlayMark(id: number, phase: OverlayPhase) { overlayTiming.mark(id, phase); }
