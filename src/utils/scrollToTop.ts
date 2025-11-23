/**
 * Smooth scroll to top utility - used by pagination and scroll-to-top button
 * Scrolls the #root container to top with smooth animation
 */
export const scrollToTop = () => {
  try {
    const scrollContainer = document.getElementById('root');
    if (scrollContainer && scrollContainer.scrollTo) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (error) {
    // Silently fail if scroll is called after unmount
    console.warn('[scrollToTop] Error scrolling:', error);
  }
};
