/**
 * Scroll utilities for hub tiles
 */

/**
 * Smoothly ensure a child is fully visible inside a scrollable container
 */
export function scrollChildIntoView(
  container: HTMLElement,
  child: HTMLElement,
  padding = 12 // extra breathing room
) {
  const cRect = container.getBoundingClientRect();
  const rRect = child.getBoundingClientRect();

  const above = rRect.top < cRect.top + padding;
  const below = rRect.bottom > cRect.bottom - padding;

  if (above) {
    container.scrollBy({ top: rRect.top - cRect.top - padding, behavior: 'smooth' });
  } else if (below) {
    container.scrollBy({ top: rRect.bottom - cRect.bottom + padding, behavior: 'smooth' });
  }
}
