/**
 * overlayTiming — per-overlay open transaction model.
 *
 * Parallel to navTiming. Overlays open WHILE a nav transaction may be live
 * underneath, have animation phases navs don't, and a different verdict
 * (content-settle vs skeleton-missing). Purely additive; shares the perf
 * gate (isPerfEnabled) and LogHud surface (AppLog).
 *
 * Phases (per instance): open-start · animation-start · data-settled ·
 * content-painted · animation-done · close-start · closed.
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
  verdict: 'OK' | 'SLOW' | 'SYNC-COMMIT' | 'NA';
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
    const tx: OverlayTx = { id, name, startedAt: now, marks: { 'open-start': now }, finalized: false };
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

    if (phase === 'content-painted') this.emit(tx);
    if (phase === 'closed') { this.emit(tx); this.finalize(tx); }
  }

  private finalizeIfOpen(id: number) {
    const tx = this.byId.get(id);
    if (tx && !tx.finalized) { this.emit(tx); this.finalize(tx); }
  }

  private finalize(tx: OverlayTx) {
    tx.finalized = true;
    this.byId.delete(tx.id);
    if (this.current === tx) this.current = null;
  }

  private buildSummary(tx: OverlayTx): OverlaySummary {
    const m = tx.marks;
    const at = m['animation-start'];
    const openLatency = at != null && m['open-start'] != null ? Math.round(at - m['open-start']!) : null;
    const settle = at != null && m['content-painted'] != null ? Math.round(m['content-painted']! - at) : null;
    const data = at != null && m['data-settled'] != null ? Math.round(m['data-settled']! - at) : null;
    const animDone = at != null && m['animation-done'] != null ? Math.round(m['animation-done']! - at) : null;
    let verdict: OverlaySummary['verdict'] = 'NA';
    if (settle != null) {
      if (settle <= 16) verdict = 'SYNC-COMMIT';
      else if (settle > 400) verdict = 'SLOW';
      else verdict = 'OK';
    }
    const flagged = verdict === 'SLOW' || verdict === 'SYNC-COMMIT' || (openLatency != null && openLatency > 120);
    return { id: tx.id, name: tx.name, openLatency, settle, data, animDone, verdict, flagged };
  }

  private emit(tx: OverlayTx) {
    const s = this.buildSummary(tx);
    this.recent = [s, ...this.recent.filter((r) => r.id !== s.id)].slice(0, 20);
    const line =
      `overlay:${s.name.padEnd(12)} open ${s.openLatency ?? '-'}ms · settle ${s.settle ?? '-'}ms` +
      ` · data ${s.data ?? '-'} · anim ${s.animDone ?? '-'} · ${s.verdict}`;
    if (s.flagged) AppLog.warn(`OVL-WARN ovl#${s.id}`, line);
    else AppLog.info(`ovl#${s.id}`, line);
    this.notify();
  }
}

export const overlayTiming = new OverlayTimingController();
export function overlayOpen(name: string) { return overlayTiming.open(name); }
export function overlayMark(id: number, phase: OverlayPhase) { overlayTiming.mark(id, phase); }
