// Captures console output into a ring buffer for the on-screen LogHud (on-device testing).
// Patches console.* once and forwards to the originals, so desktop devtools is unchanged.
// Gated by the same flag as the perf instrument: install() no-ops unless DEV || ?perf=1.

import { isPerfEnabled } from './navTiming';

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

  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((level) => {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try { push(level, args); } catch { /* ignore */ }
      orig(...args);
    };
  });
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
