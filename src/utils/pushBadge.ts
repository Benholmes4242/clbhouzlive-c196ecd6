/**
 * Clear the iOS app icon badge via the Median OneSignal bridge.
 * Method names differ across bridge versions — try each, no-op on web.
 */
export function clearAppBadge(): void {
  try {
    const os = (window as any).median?.onesignal;
    if (!os) return;
    try { os.clearBadges?.(); } catch {}
    try { os.clearBadgeCount?.(); } catch {}
    try { os.setBadgeCount?.(0); } catch {}
    try { (window as any).median?.ios?.clearBadge?.(); } catch {}
  } catch {}
}
