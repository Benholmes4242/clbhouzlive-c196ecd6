import React from 'react';
import { isNativeAppSync, isPreviewHost, waitForNativeBridge } from '@/utils/native/isNativeApp';

/**
 * Shared env status store — single source of truth for whether the app is
 * running natively, in preview, on the web (AppDownloadGate), or still
 * deciding (BootHold). RootGate drives the transition; other surfaces
 * (GlobalHeader, GlobalBottomNavigation) subscribe so they can skip mount
 * while the gate is holding or the web gate is showing.
 */
export type EnvStatus = 'pending' | 'native' | 'preview' | 'web';

const initial: EnvStatus = (() => {
  if (isNativeAppSync()) return 'native';
  if (isPreviewHost()) return 'preview';
  return 'pending';
})();

let current: EnvStatus = initial;
const listeners = new Set<() => void>();

function set(next: EnvStatus) {
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let bridgeStarted = false;
function startBridgeWait() {
  if (bridgeStarted) return;
  bridgeStarted = true;
  if (current !== 'pending') return;
  waitForNativeBridge(2000).then((isNative) => {
    set(isNative ? 'native' : 'web');
  });
}

export function useEnvStatus(): EnvStatus {
  const status = React.useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  React.useEffect(() => {
    if (status === 'pending') startBridgeWait();
  }, [status]);
  return status;
}

export function getEnvStatus(): EnvStatus {
  return current;
}

/** True when the app is running as a fully mounted client (native/preview). */
export function isAppShellVisible(status: EnvStatus): boolean {
  return status === 'native' || status === 'preview';
}
