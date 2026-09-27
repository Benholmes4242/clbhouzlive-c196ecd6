/**
 * TEMPORARY DIAGNOSTIC — BRIEF_ROUND_PUSH_DEVICE_READOUT.
 * Remove this file and its three call sites once the cold-push answer is in.
 *
 * Flag: visiting any URL with ?diag=1 persists a localStorage key; ?diag=0
 * clears it. Without the key the readout returns null and no interval runs.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';

const KEY = 'clbhouz.diag.roundPush';

function readFlag(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get('diag');
    if (p === '1') localStorage.setItem(KEY, '1');
    if (p === '0') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const DIAG_ON: boolean = typeof window !== 'undefined' && readFlag();
const T0 = typeof performance !== 'undefined' ? performance.now() : 0;

/** Values published by RoundDetailSheet (mutable, read on the interval). */
export const roundDiag: {
  round: string;
  cardOpen: string;
  gate: string;
} = { round: '-', cardOpen: '-', gate: '-' };

function readDom(): string {
  const el = document.querySelector('[data-scorecard-overlay]') as HTMLElement | null;
  if (!el) return 'ABSENT';
  const cs = getComputedStyle(el);
  return `present op=${cs.opacity} disp=${cs.display} vis=${cs.visibility} z=${cs.zIndex}`;
}

function Readout() {
  const location = useLocation();
  const { user, loading: authLoading } = useSupabaseSession();
  const { activeActor, isLoading: actorLoading } = useActiveActor();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  const a = activeActor as { type?: string; id?: string } | null;
  const bg = !!(location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation;
  const lines = [
    `t        ${Math.round(performance.now() - T0)}ms`,
    `path     ${location.pathname}`,
    `key      ${location.key}`,
    `bg       ${bg}`,
    `auth     loading=${authLoading} user=${user ? 'yes' : 'no'}`,
    `actor    ${a ? `${a.type}:${String(a.id).slice(0, 8)}` : 'null'} loading=${actorLoading}`,
    `round    ${roundDiag.round}`,
    `cardOpen ${roundDiag.cardOpen}`,
    `gate     ${roundDiag.gate}`,
    `dom      ${readDom()}`,
  ];

  return (
    <pre
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483647,
        margin: 0, padding: 'max(env(safe-area-inset-top, 0px), 47px) 8px 6px',
        background: '#000', color: '#0f0', font: '10px/1.3 ui-monospace, Menlo, monospace',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', pointerEvents: 'none',
      }}
    >
      {lines.join('\n')}
    </pre>
  );
}

export function RoundPushDiag() {
  return DIAG_ON ? <Readout /> : null;
}
