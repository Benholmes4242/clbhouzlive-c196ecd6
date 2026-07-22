/**
 * Video pool feature flag. OFF by default; only reads `VITE_VIDEO_POOL === '1'`
 * or a runtime localStorage override so we can flip it in prod without a
 * redeploy while Phase 1 bakes.
 */
export function isVideoPoolEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const ls = localStorage.getItem('VIDEO_POOL');
      if (ls === '1' || ls === 'true') return true;
      if (ls === '0' || ls === 'false') return false;
    }
  } catch { /* ignore */ }
  return import.meta.env.VITE_VIDEO_POOL === '1';
}
