export function isMockLiveEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Enable mock data by default for development
  return true;
  
  // Original toggle logic (commented out):
  // const url = new URL(window.location.href);
  // const q = url.searchParams.get('mockLive');
  // if (q === '1' || q === 'true') return true;
  // const ls = window.localStorage.getItem('mockLive');
  // return ls === '1' || ls === 'true';
}
// Quick toggle from console: localStorage.setItem('mockLive','1'); location.reload()
