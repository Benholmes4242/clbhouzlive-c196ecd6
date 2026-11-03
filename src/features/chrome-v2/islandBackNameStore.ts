/** HB4: route-scoped, owner-guarded publication prevents departing pages clearing new names. */
import { useSyncExternalStore } from 'react';

export interface IslandBackName { owner: symbol; pathname: string; name: string; past: boolean }
let current: IslandBackName | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
export function publishIslandBackName(value: IslandBackName): void { current = value; notify(); }
export function clearIslandBackName(owner: symbol): void {
  if (current?.owner !== owner) return;
  current = null; notify();
}
export function useIslandBackNameValue(): IslandBackName | null {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => current, () => null);
}