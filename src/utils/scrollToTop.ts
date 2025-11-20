/**
 * Smooth scroll to top utility - used by pagination and scroll-to-top button
 * Scrolls the #root container to top with smooth animation
 */
export const scrollToTop = () => {
  const scrollContainer = document.getElementById('root');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
