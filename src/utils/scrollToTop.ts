/**
 * Smooth scroll to top utility - used by pagination and scroll-to-top button
 * Scrolls all possible scroll containers to top with smooth animation
 */
export const scrollToTop = () => {
  // Scroll window
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Also scroll #root container if it's the scroll parent
  const scrollContainer = document.getElementById('root');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Scroll document elements for mobile compatibility
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
};
