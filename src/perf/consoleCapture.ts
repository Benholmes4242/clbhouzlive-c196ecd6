// Captures console output into a ring buffer for the on-screen LogHud (on-device testing).
// Patches console.* once and forwards to the originals, so desktop devtools is unchanged.
// Gated by the same flag as the perf instrument: install() no-ops unless DEV || ?perf=1.

import { isPerfEnabled, subscribePerfLive } from './navTiming';

export interface LogLine {
  t: number;                 // ms since capture start
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
}

const MAX_LINES = 1000;
const buffer: LogLine[] = [];
let installed = false;
let startTs = 0;
type Sub = () => void;
const subs = new Set<Sub>();

function fmtArg(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.stack || a.message;
  try { return JSON.stringify(a); } catch { return String(a); }
}

function push(level: LogLine['level'], args: unknown[]) {
  const text = args.map(fmtArg).join(' ');
  buffer.push({ t: Math.round(performance.now() - startTs), level, text });
  if (buffer.length > MAX_LINES) buffer.shift();
  subs.forEach((s) => { try { s(); } catch { /* ignore */ } });
}

export function installConsoleCapture(): void {
  if (installed) return;
  if (!isPerfEnabled()) return;
  installed = true;
  startTs = performance.now();

  // First buffered line: when capture actually installed (so the copied log shows what preceded it).
  buffer.push({ t: 0, level: 'info', text: `consoleCapture installed (boot +${Math.round(performance.now())}ms)` });

  // Build stamp — surfaces at the top of every LogHud capture so ship notes
  // unambiguously identify the build. Guarded so tests/older tooling without
  // the vite `define` don't ReferenceError.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stamp = typeof __BUILD_STAMP__ !== 'undefined' ? __BUILD_STAMP__ : null;
    if (stamp) console.info('[boot] build ' + stamp);
  } catch { /* ignore */ }


  // Drain anything the index.html early-log shim captured before modules evaluated.
  try {
    const early = (window as any).__earlyLogs as Array<[string, number, unknown[]]> | undefined;
    if (early && early.length) {
      const base = early[0][1];
      early.forEach(([lvl, ts, args]) => {
        buffer.push({
          t: Math.max(0, ts - base),
          level: (['log','info','warn','error','debug'].includes(lvl) ? lvl : 'log') as LogLine['level'],
          text: '[pre-init] ' + args.map(fmtArg).join(' '),
        });
      });
      (window as any).__earlyLogs = [];
    }
  } catch {}

  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((level) => {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try { push(level, args); } catch { /* ignore */ }
      orig(...args);
    };
  });

  // Capture runtime errors (native has no other way to see these).
  try {
    window.addEventListener('error', (e) => push('error', [`[window.onerror] ${e.message}`]));
    window.addEventListener('unhandledrejection', (e: any) =>
      push('error', [`[unhandledrejection] ${e?.reason?.message ?? e?.reason ?? ''}`]));
  } catch {}
}

export const consoleCapture = {
  isEnabled: () => isPerfEnabled(),
  getLines: () => buffer.slice(),
  clear: () => { buffer.length = 0; startTs = performance.now(); },
  subscribe: (fn: Sub) => { subs.add(fn); return () => { subs.delete(fn); }; },
  asText: () =>
    buffer.map((l) => `+${l.t}ms [${l.level}] ${l.text}`).join('\n'),
};

// Self-install at module-eval time so boot logs are captured before any other
// module runs. main.tsx imports this file as its very first line.
installConsoleCapture();

// Also install on a live-enable so flipping the flag from the on-screen button
// starts capture immediately (installed guard makes repeated calls safe).
subscribePerfLive(() => { try { installConsoleCapture(); } catch {} });
