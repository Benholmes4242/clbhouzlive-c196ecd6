import { useSyncExternalStore } from 'react';

/**
 * Singleton store for the Home Club picker sheet.
 *
 * The picker is mounted once at the app root (HomeClubPickerHost) so it
 * survives the surface that opened it unmounting — same pattern as the
 * request-a-course sheet.
 */
type State = {
  open: boolean;
  /** When set, the picker hands the club back instead of writing it itself. */
  onSelected?: (club: { id: string; name: string }) => void;
};

let state: State = { open: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function openHomeClubPicker(opts?: { onSelected?: (club: { id: string; name: string }) => void }) {
  state = { open: true, onSelected: opts?.onSelected };
  emit();
}

export function closeHomeClubPicker() {
  state = { open: false };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function useHomeClubPickerState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
