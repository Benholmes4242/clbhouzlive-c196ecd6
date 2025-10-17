// echoDocNavHeight.ts
// Dynamically measure bottom nav bar height and expose it as a CSS var

function setNavHeightVar() {
  const nav = document.querySelector<HTMLElement>('.global-bottom-nav, .chrome-bottom-nav, .bottom-nav, nav[role="navigation"], [data-nav="bottom"]');
  if (nav) {
    const height = nav.offsetHeight || 56; // fallback if nav has no height
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  } else {
    // fallback if no nav found
    document.documentElement.style.setProperty('--nav-height', `56px`);
  }
}

function setVisualViewportOffsetVar() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (!vv) {
    document.documentElement.style.setProperty('--vvh-offset', '0px');
    return;
  }
  const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty('--vvh-offset', `${Math.round(offset)}px`);
}

// Run once on load
if (typeof window !== 'undefined') {
  const runAll = () => { setNavHeightVar(); setVisualViewportOffsetVar(); };
  window.addEventListener('load', runAll);

  // Also observe for resize (landscape ↔ portrait changes nav height)
  window.addEventListener('resize', runAll);

  // Listen to visual viewport changes (iOS Safari bottom bar)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVisualViewportOffsetVar);
    window.visualViewport.addEventListener('scroll', setVisualViewportOffsetVar);
  }

  // Observe DOM changes (if nav mounts later in SPA)
  const observer = new MutationObserver(runAll);
  observer.observe(document.body, { childList: true, subtree: true });

  // Run immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAll);
  } else {
    runAll();
  }
}

export { setNavHeightVar };