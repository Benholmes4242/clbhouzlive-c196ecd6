// echoDocNavHeight.ts
// Dynamically measure bottom nav bar height and expose it as a CSS var

function setNavHeightVar() {
  const nav = document.querySelector<HTMLElement>('.bottom-nav, nav[role="navigation"], [data-nav="bottom"]');
  if (nav) {
    const height = nav.offsetHeight || 56; // fallback if nav has no height
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  } else {
    // fallback if no nav found
    document.documentElement.style.setProperty('--nav-height', `56px`);
  }
}

// F1: Setup with cleanup tracking
let cleanupFunctions: (() => void)[] = [];

// Run once on load
if (typeof window !== 'undefined') {
  const handleLoad = () => setNavHeightVar();
  const handleResize = () => setNavHeightVar();
  
  window.addEventListener('load', handleLoad);
  window.addEventListener('resize', handleResize);
  
  // Track cleanup functions
  cleanupFunctions.push(() => {
    window.removeEventListener('load', handleLoad);
    window.removeEventListener('resize', handleResize);
  });

  // Optional: observe DOM changes (if nav mounts later in SPA)
  const observer = new MutationObserver(setNavHeightVar);
  observer.observe(document.body, { childList: true, subtree: true });
  
  cleanupFunctions.push(() => {
    observer.disconnect();
  });

  // Run immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    const handleDOMReady = () => setNavHeightVar();
    document.addEventListener('DOMContentLoaded', handleDOMReady);
    cleanupFunctions.push(() => {
      document.removeEventListener('DOMContentLoaded', handleDOMReady);
    });
  } else {
    setNavHeightVar();
  }
}

// Export cleanup function for app teardown (mainly for testing)
export function cleanupNavHeightListeners() {
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
}

export { setNavHeightVar };