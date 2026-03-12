/**
 * Smooth scroll to top utility - used by pagination and scroll-to-top button
 * Scrolls all possible scroll containers to top with smooth animation
 */
export const scrollToTop = () => {
  // Scroll window (in case a page is using document scrolling)
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  // Scroll common app containers (most pages scroll #root)
  const rootContainer = document.getElementById('root');
  const mainElement = document.querySelector('main') as HTMLElement | null;
  const pageContainer = document.querySelector('.page-with-header') as HTMLElement | null;
  const pageRoot = document.querySelector('.page-root') as HTMLElement | null;

  const targets = [rootContainer, mainElement, pageContainer, pageRoot].filter(Boolean) as HTMLElement[];

  for (const el of targets) {
    el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  // Mobile compatibility / hard reset (some browsers ignore smooth on overflow containers)
  requestAnimationFrame(() => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    for (const el of targets) el.scrollTop = 0;
  });
};

