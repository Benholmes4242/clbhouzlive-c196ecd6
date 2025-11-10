/**
 * A11y utilities for live announcements
 */

/**
 * Announce a message to screen readers via live region
 */
export function announce(msg: string) {
  const el = document.getElementById('a11y-live');
  if (el) {
    el.textContent = '';
    setTimeout(() => {
      el.textContent = msg;
    }, 10);
  }
}
