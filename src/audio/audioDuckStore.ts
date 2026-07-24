/**
 * audioDuckStore — Global "sheet is open, quiet the video please" signal.
 *
 * Any surface that should silence inline video while it's open (comment
 * sheets, mention pickers, action sheets, share sheets) registers a stable
 * key here on mount and clears it on unmount. Consumers (VideoEngine) treat
 * a non-empty set as a hard override: no lane may be the unmuted speaker
 * while a duck key is active.
 *
 * Kept intentionally tiny + framework-agnostic — plain module state with a
 * subscribe callback that VideoEngine can hook without a React round-trip.
 */

type Listener = () => void;

const keys = new Set<string>();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try { l(); } catch { /* isolate */ }
  });
}

export const audioDuck = {
  hold(key: string) {
    if (keys.has(key)) return;
    keys.add(key);
    emit();
  },
  release(key: string) {
    if (!keys.delete(key)) return;
    emit();
  },
  /** Force-clear every held key. Used on app boot to purge stale duck state
   *  from a previous version that may have latched a key without releasing
   *  it (e.g. after the old shadcn sheet-wide auto-duck). Never call from
   *  product code — this is a safety valve, not a feature. */
  reset() {
    if (keys.size === 0) return;
    keys.clear();
    emit();
  },
  isDucked(): boolean {
    return keys.size > 0;
  },
  keys(): string[] {
    return Array.from(keys);
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

/** React helper — auto hold/release across a component's lifetime. */
import { useEffect } from 'react';
export function useAudioDuck(active: boolean, key: string) {
  useEffect(() => {
    if (!active) return;
    audioDuck.hold(key);
    return () => audioDuck.release(key);
  }, [active, key]);
}
