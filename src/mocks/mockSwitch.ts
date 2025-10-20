/**
 * ⚠️ MOCK DATA ENABLED FOR DEVELOPMENT ⚠️
 * 
 * This function currently returns TRUE to show mock data for:
 * - Live Clubhouse Strip creators
 * - Nearby Golfers circle
 * 
 * DO NOT CHANGE THIS UNTIL EXPLICITLY INSTRUCTED TO SWITCH TO REAL DATA.
 * 
 * When ready to go live, uncomment the toggle logic below and remove the "return true".
 */
export function isMockLiveEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // ✅ KEEP THIS ENABLED UNTIL GO-LIVE
  return true;
  
  // 🔽 UNCOMMENT BELOW WHEN SWITCHING TO REAL DATA:
  // const url = new URL(window.location.href);
  // const q = url.searchParams.get('mockLive');
  // if (q === '1' || q === 'true') return true;
  // const ls = window.localStorage.getItem('mockLive');
  // return ls === '1' || ls === 'true';
}
// Quick toggle from console: localStorage.setItem('mockLive','1'); location.reload()
