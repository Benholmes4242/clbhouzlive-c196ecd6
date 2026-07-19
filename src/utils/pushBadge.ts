/**
 * Clear the iOS app icon badge via the Median OneSignal bridge.
 *
 * Documented API: https://median.co/docs/onesignal-badge-count
 *   window.median.onesignal.badge.set(count)
 *
 * Legacy fallback chain kept for older bridge versions — all optional-chained.
 * No-op on web.
 */
export function clearAppBadge(): void {
  try {
    const os = (window as any).median?.onesignal;
    if (!os) return;
    // Documented Median bridge (median.co/docs/onesignal-badge-count).
    try { os.badge?.set?.(0); } catch {}
    // Legacy fallbacks for older bridge builds.
    try { os.clearBadges?.(); } catch {}
    try { os.clearBadgeCount?.(); } catch {}
    try { os.setBadgeCount?.(0); } catch {}
    try { (window as any).median?.ios?.clearBadge?.(); } catch {}
  } catch {}
}
