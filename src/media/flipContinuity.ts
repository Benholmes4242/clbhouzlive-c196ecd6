/**
 * FLIP handoff continuity — one-shot maps for currentTime + play-state
 * hand-off between the origin tile (feed) and the fullscreen viewer.
 *
 * Root cause this fixes:
 *   HLSPoolManager.handOff() transfers the buffer but NOT currentTime, and
 *   nothing re-attaches the origin tile on viewer close. Result: jump on open,
 *   black tile on return, restart-instead-of-resume.
 *
 * Flow:
 *   OPEN  — openWithOrigin captures {t, wasPlaying} from the origin <video>
 *           before handOff, calls setStart(url, ...).
 *   ATTACH (fullscreen) — InlineVideo consumes start after ATTACH_DONE and
 *           seeks the buffered instance BEFORE its play() call.
 *   TICK  — InlineVideo writes currentTime → writeLast(url, t) on every
 *           timeupdate so the last playhead is always known.
 *   CLOSE — FullscreenFeedOverlay calls emitClose(). Every InlineVideo whose
 *           url was handed off snapshots getLast(), stashes it via setReturn,
 *           tears its stale hlsRef down, and re-attaches. On ATTACH_DONE it
 *           consumes the return entry and seeks — resuming where the viewer
 *           left off. The tile's poster underlay covers the reattach gap so
 *           the user never sees black.
 */

type StartEntry = { t: number; wasPlaying: boolean };
type ReturnEntry = { t: number };
type Listener = () => void;

const starts = new Map<string, StartEntry>();
const returns = new Map<string, ReturnEntry>();
const lastTimes = new Map<string, number>();
const handedOff = new Set<string>();
const closeListeners = new Set<Listener>();

export const flipContinuity = {
  setStart(url: string, entry: StartEntry) {
    starts.set(url, entry);
    handedOff.add(url);
  },
  consumeStart(url: string): StartEntry | null {
    const v = starts.get(url);
    if (v) starts.delete(url);
    return v ?? null;
  },
  wasHandedOff(url: string): boolean {
    return handedOff.has(url);
  },
  clearHandOff(url: string) {
    handedOff.delete(url);
  },
  writeLast(url: string, t: number) {
    if (!Number.isFinite(t) || t < 0) return;
    lastTimes.set(url, t);
  },
  getLast(url: string): number | null {
    return lastTimes.get(url) ?? null;
  },
  setReturn(url: string, entry: ReturnEntry) {
    returns.set(url, entry);
  },
  consumeReturn(url: string): ReturnEntry | null {
    const v = returns.get(url);
    if (v) returns.delete(url);
    return v ?? null;
  },
  onClose(l: Listener): () => void {
    closeListeners.add(l);
    return () => closeListeners.delete(l);
  },
  emitClose() {
    closeListeners.forEach((l) => {
      try { l(); } catch {}
    });
  },
};
