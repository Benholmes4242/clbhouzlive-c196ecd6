/**
 * audioDebug — Ring-buffer + summary store for the V1 Audio + Continuity HUD.
 *
 * Instrumentation-only. Zero-cost when FLAGS.audioDebug is off: every log/read
 * helper short-circuits before touching the buffer.
 *
 * Timeline entries are stamped:
 *   - `t`      : wall-clock ms (Date.now)
 *   - `ms`     : ms since the current open-cycle's beginOpen() call
 *   - `openId` : correlation id issued at tap → open cycle
 *   - `event`  : short tag ('tap','session.state','open.decision', ...)
 *   - `data`   : arbitrary payload
 *
 * Consumers:
 *   - AudioDebugHud renders the timeline + live SESSION/EL/MODE/POS summary.
 *   - Copy button dumps a textual transcript for pasting into bug reports.
 */

import { FLAGS } from '@/config/flags';

export type AudioLogEntry = {
  t: number;
  openId: string | null;
  ms: number | null;
  event: string;
  data: Record<string, unknown>;
};

// ~2000 entries so a five-minute continuous capture fits at typical event
// rates (heartbeat 1/s + play/pause/policy churn during scroll).
const BUFFER_SIZE = 2000;

let buffer: AudioLogEntry[] = [];
const listeners = new Set<() => void>();

let currentOpenId: string | null = null;
let openStartTs: number | null = null;
let openSeq = 0;

// Runtime-toggleable. localStorage override wins; falls back to the
// compile-time FLAGS.audioDebug default. Mirrors the perf-toggle pattern
// (setPerfLive / subscribePerfLive) so the admin console can flip it live.
const AUDIO_DEBUG_KEY = 'clbhouz-flag-audio-debug';
const enableSubs = new Set<() => void>();

export const audioDebugEnabled = (): boolean => {
  try {
    if (typeof window !== 'undefined') {
      const v = window.localStorage.getItem(AUDIO_DEBUG_KEY);
      if (v === '1') return true;
      if (v === '0') return false;
    }
  } catch { /* noop */ }
  try {
    return !!(FLAGS as unknown as Record<string, unknown>).audioDebug;
  } catch {
    return false;
  }
};

export function setAudioDebugEnabled(on: boolean): void {
  try {
    if (typeof window !== 'undefined') {
      if (on) window.localStorage.setItem(AUDIO_DEBUG_KEY, '1');
      else window.localStorage.setItem(AUDIO_DEBUG_KEY, '0');
    }
  } catch { /* noop */ }
  enableSubs.forEach((f) => { try { f(); } catch { /* noop */ } });
}

export function subscribeAudioDebugEnabled(cb: () => void): () => void {
  enableSubs.add(cb);
  return () => { enableSubs.delete(cb); };
}


// ─── open-cycle correlation ─────────────────────────────────────────────

export function beginOpen(hint?: string): string {
  const id = `o${++openSeq}${hint ? '·' + hint.slice(0, 8) : ''}`;
  currentOpenId = id;
  openStartTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  return id;
}

export function endOpen() {
  currentOpenId = null;
  openStartTs = null;
}

export function getOpenId(): string | null {
  return currentOpenId;
}

export function msSinceOpen(): number | null {
  if (openStartTs == null) return null;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return Math.round(now - openStartTs);
}

// ─── log write / read ───────────────────────────────────────────────────

export function logAudio(event: string, data: Record<string, unknown> = {}): void {
  if (!audioDebugEnabled()) return;
  buffer.push({
    t: Date.now(),
    openId: currentOpenId,
    ms: msSinceOpen(),
    event,
    data: safeShallow(data),
  });
  if (buffer.length > BUFFER_SIZE) buffer.splice(0, buffer.length - BUFFER_SIZE);
  emit();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function emit() {
  listeners.forEach((l) => { try { l(); } catch {} });
}

export function getEntries(): ReadonlyArray<AudioLogEntry> {
  return buffer;
}

export function clearEntries(): void {
  buffer = [];
  emit();
}

// ─── live summary (updated at 250ms by HUD) ─────────────────────────────

export type AudioSummary = {
  sessionMuted: boolean;
  msSinceGesture: number | null;
  laneId: string | null;
  laneMuted: boolean | null;
  laneVolume: number | null;
  laneCurrentTime: number | null;
  lanePaused: boolean | null;
  mode: 'borrow' | 'cold' | null;
  tilePos: number | null;
  fsPos: number | null;
  continuityOk: boolean | null;
  // v4 heartbeat: who currently owns the ONE_UNMUTED_LANE slot, and whether
  // the visible ACTIVE lane is actually the one that owns it.
  activeLaneId: string | null;
  activePostId: string | null;
  activeElMuted: boolean | null;
  unmutedLanes: string[];
  borrowedLanes: string[];
};

let summary: AudioSummary = {
  sessionMuted: true,
  msSinceGesture: null,
  laneId: null,
  laneMuted: null,
  laneVolume: null,
  laneCurrentTime: null,
  lanePaused: null,
  mode: null,
  tilePos: null,
  fsPos: null,
  continuityOk: null,
  activeLaneId: null,
  activePostId: null,
  activeElMuted: null,
  unmutedLanes: [],
  borrowedLanes: [],
};

export function setSummary(patch: Partial<AudioSummary>): void {
  summary = { ...summary, ...patch };
  emit();
}

export function getSummary(): AudioSummary {
  return summary;
}

// ─── copy transcript ────────────────────────────────────────────────────

export function buildAudioLogText(): string {
  const header = [
    `AudioDebug transcript · ${new Date().toISOString()}`,
    `SUMMARY: ${safeJson(summary)}`,
    `---`,
  ];
  const lines = buffer.map((e) => {
    const ms = e.ms == null ? '   -' : `+${String(e.ms).padStart(4, ' ')}`;
    const oid = (e.openId ?? '-').padEnd(10, ' ');
    return `${ms}ms  ${oid}  ${e.event.padEnd(22, ' ')}  ${safeJson(e.data)}`;
  });
  return [...header, ...lines].join('\n');
}

// ─── helpers ────────────────────────────────────────────────────────────

function safeJson(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

function safeShallow(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === null || v === undefined) { out[k] = v; continue; }
    const type = typeof v;
    if (type === 'number' || type === 'string' || type === 'boolean') { out[k] = v; continue; }
    try { out[k] = JSON.parse(JSON.stringify(v)); } catch { out[k] = String(v); }
  }
  return out;
}
