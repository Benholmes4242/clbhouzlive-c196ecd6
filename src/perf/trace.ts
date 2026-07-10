/**
 * [TRACE] cold-open correlation helper.
 *
 * Every fullscreen cold-open goes through openWithOrigin, which mints a short
 * `openId` and registers it here keyed by ownerKey/postId. Downstream layers
 * (store, slot, useVideoLane, VideoEngine) look up the current open by their
 * known keys and stamp every [TRACE] line with the same `openId` + `elId`
 * (the <video>'s `dataset.vid`). Gated on isPerfEnabled — zero behaviour
 * change, log-only.
 */
import { isPerfEnabled } from './navTiming';

export interface TraceOpen {
  openId: string;
  surface: string;
  ownerKey: string | null;
  postId: string | null;
  startedAt: number;
}

const opens: TraceOpen[] = [];
const MAX_OPENS = 8;
let vidSeq = 0;

type TraceSink = (evt: string, payload: Record<string, unknown>) => void;

export function traceGenId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function traceGenElId(): string {
  vidSeq += 1;
  return `v${vidSeq.toString(36)}`;
}

export function traceRegisterOpen(o: TraceOpen): void {
  opens.unshift(o);
  if (opens.length > MAX_OPENS) opens.length = MAX_OPENS;
}

export function traceLookup(
  keys: { ownerKey?: string | null; postId?: string | null } = {}
): TraceOpen | null {
  const { ownerKey, postId } = keys;
  const norm = (k: string | null | undefined): string | null => {
    if (!k) return null;
    return k.includes(':') ? k : `${k}:0`;
  };
  const nOwner = norm(ownerKey);
  const nPost = norm(postId);
  for (const o of opens) {
    const oOwner = norm(o.ownerKey);
    const oPost = norm(o.postId);
    if (nOwner && (oOwner === nOwner || oPost === nOwner)) return o;
    if (nPost && (oOwner === nPost || oPost === nPost)) return o;
  }
  return null;
}

export function traceLatestOpen(): TraceOpen | null {
  return opens[0] ?? null;
}

export function trace(evt: string, payload: Record<string, unknown> = {}): void {
  if (!isPerfEnabled()) return;
  try {
    const sink = typeof window !== 'undefined'
      ? (window as unknown as { __trace_sink__?: TraceSink }).__trace_sink__
      : undefined;
    sink?.(evt, payload);
  } catch { /* trace-only */ }
  // eslint-disable-next-line no-console
  console.info('[TRACE]', evt, payload);
}

export function elIdOf(
  el: { dataset?: DOMStringMap } | null | undefined
): string {
  const vid = el && el.dataset ? (el.dataset as any).vid : undefined;
  return vid || 'NULL';
}
