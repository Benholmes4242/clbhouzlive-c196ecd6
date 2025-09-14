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

// Run once on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', setNavHeightVar);

  // Also observe for resize (landscape ↔ portrait changes nav height)
  window.addEventListener('resize', setNavHeightVar);

  // Optional: observe DOM changes (if nav mounts later in SPA)
  const observer = new MutationObserver(setNavHeightVar);
  observer.observe(document.body, { childList: true, subtree: true });

  // Run immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setNavHeightVar);
  } else {
    setNavHeightVar();
  }
}

export { setNavHeightVar };