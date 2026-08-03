/**
 * Lightweight event bus for the compare sheet.
 *
 * The Circle entry panel and the friend-view header control fire these; the
 * CompareMount mounted by HandicapPage subscribes and owns the sheet state.
 * Same pattern as whs/gam/events.ts.
 */
export type CompareSource = 'circle' | 'deeplink' | 'friend_cta';

type Listener = (payload: { targetUserId?: string; from: CompareSource }) => void;

const listeners = new Set<Listener>();

export const compareBus = {
  emit: (p: { targetUserId?: string; from: CompareSource }) =>
    listeners.forEach((fn) => fn(p)),
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export const openCompare = (
  from: CompareSource,
  targetUserId?: string,
) => compareBus.emit({ from, targetUserId });
