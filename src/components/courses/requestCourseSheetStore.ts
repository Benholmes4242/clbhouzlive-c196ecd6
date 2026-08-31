import { useSyncExternalStore } from 'react';

type State = { open: boolean; prefillName?: string; homeClub?: boolean };

let state: State = { open: false, prefillName: undefined, homeClub: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function openRequestCourseSheet(prefillName?: string, opts?: { homeClub?: boolean }) {
  state = { open: true, prefillName: prefillName?.trim() || undefined, homeClub: !!opts?.homeClub };
  emit();
}

export function closeRequestCourseSheet() {
  state = { open: false, prefillName: undefined, homeClub: false };
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
