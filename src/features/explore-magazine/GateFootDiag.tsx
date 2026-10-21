/**
 * CB40 TEMPORARY DIAGNOSTIC — DELETE THIS FILE AND ITS ONE MOUNT LINE IN
 * RoundsGate.tsx (search "GateFootDiag"). Scaffolding, not a feature: it
 * prints live DOM measurements of the gate's foot gap so a device screenshot
 * captures them. Every value is read from the DOM; nothing is derived from source.
 */
import { useEffect, useReducer, useState } from 'react';

const NA = 'unavailable';
const px = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? NA : `${Math.round(n * 100) / 100}px`);

function read(): [string, string][] {
  const root = getComputedStyle(document.documentElement);
  const prop = (n: string) => root.getPropertyValue(n).trim() || NA;

  /* env() resolves only inside a declaration, so a probe element carries it. */
  let envBottom = NA;
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px)';
    document.body.appendChild(probe);
    envBottom = getComputedStyle(probe).paddingBottom || NA;
    probe.remove();
  } catch { /* stays unavailable */ }

  const main = document.querySelector('main');
  const mainCs = main ? getComputedStyle(main) : null;
  let hasSupport = NA;
  try { hasSupport = String(CSS.supports('selector(:has(*))')); } catch { /* unavailable */ }

  const gate = document.querySelector<HTMLElement>('[data-rounds-gate]');
  const parent = gate?.parentElement ?? null;
  const buttons = document.querySelectorAll<HTMLElement>('[data-rounds-gate-card] button');
  const noHcp = buttons.length ? buttons[buttons.length - 1] : null;
  const nav = document.querySelector<HTMLElement>('[role="navigation"][aria-label="Main"]');
  const gap = noHcp && nav ? nav.getBoundingClientRect().top - noHcp.getBoundingClientRect().bottom : null;

  return [
    ['--nav-pill-h', prop('--nav-pill-h')],
    ['--sat', prop('--sat')],
    ['env(sa-bottom)', envBottom],
    ['main display', mainCs?.display ?? NA],
    ['main height', mainCs?.height ?? NA],
    ['main pad-bottom', mainCs?.paddingBottom ?? NA],
    [':has() supported', hasSupport],
    ['main rect.bottom', px(main?.getBoundingClientRect().bottom)],
    ['innerHeight', px(window.innerHeight)],
    ['gate offsetH', px(gate?.offsetHeight)],
    ['parent offsetH', px(parent?.offsetHeight)],
    ['button→nav gap', px(gap)],
    ['dpr', String(window.devicePixelRatio ?? NA)],
    ['viewport', `${window.innerWidth}×${window.innerHeight}`],
  ];
}

export function GateFootDiag() {
  const [lines, setLines] = useState<[string, string][]>([]);
  const [tick, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener('resize', bump);
    /* One settled re-read after first layout so the nav and fonts are in. */
    const t = window.setTimeout(bump, 600);
    return () => { window.removeEventListener('resize', bump); window.clearTimeout(t); };
  }, []);
  useEffect(() => { setLines(read()); }, [tick]);
  return (
    <div
      data-gate-foot-diag=""
      style={{
        position: 'fixed', top: 'calc(var(--sat, 0px) + 4px)', left: 4, zIndex: 2147483647,
        pointerEvents: 'none', background: 'rgba(0,0,0,0.82)', color: '#00ff88',
        font: '600 11px/1.35 ui-monospace, Menlo, monospace', padding: '6px 8px', borderRadius: 4,
        whiteSpace: 'pre',
      }}
    >
      {lines.map(([k, v]) => `${k}: ${v}`).join('\n')}
    </div>
  );
}
