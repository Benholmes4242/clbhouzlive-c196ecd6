import { useSyncExternalStore } from 'react';

type State = { open: boolean; prefillName?: string };

let state: State = { open: false, prefillName: undefined };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function openRequestCourseSheet(prefillName?: string) {
  state = { open: true, prefillName: prefillName?.trim() || undefined };
  emit();
}

export function closeRequestCourseSheet() {
  state = { open: false, prefillName: undefined };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function useRequestCourseSheetState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
