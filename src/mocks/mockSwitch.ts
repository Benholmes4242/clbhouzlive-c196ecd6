/**
 * ✅ REAL DATA ENABLED (50/50 BLEND WITH MOCK)
 * 
 * This function controls whether to force 100% mock data for:
 * - Live Clubhouse Strip creators
 * - Nearby Golfers circle
 * 
 * Default: false (real + mock blend)
 * Override: Set ?mockLive=1 in URL or localStorage.setItem('mockLive','1')
 */
export function isMockLiveEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for dev override to force 100% mock
  const url = new URL(window.location.href);
  const q = url.searchParams.get('mockLive');
  if (q === '1' || q === 'true') return true;
  const ls = window.localStorage.getItem('mockLive');
  return ls === '1' || ls === 'true';
}
// Quick toggle from console: localStorage.setItem('mockLive','1'); location.reload()
