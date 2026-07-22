/**
 * Video pool feature flag. ON by default in Phase 2; localStorage override
 * remains as an emergency kill-switch.
 */
export function isVideoPoolEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const ls = localStorage.getItem('VIDEO_POOL');
      if (ls === '0' || ls === 'false') return false;
      if (ls === '1' || ls === 'true') return true;
    }
  } catch { /* ignore */ }
  return import.meta.env.VITE_VIDEO_POOL !== '0';
}
