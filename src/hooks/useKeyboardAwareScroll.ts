import { useEffect } from 'react';

interface Options {
  /** Scroll container selector – defaults to the main page wrapper */
  containerSelector?: string;
}

/**
 * Automatically scrolls the focused input/textarea into view when
 * the virtual keyboard opens (mobile).
 */
export function useKeyboardAwareScroll(
  inputSelector: string,
  opts: Options = {}
) {
  const { containerSelector = '[data-scroll-container]' } = opts;

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    const handleFocusIn = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.matches(inputSelector)) return;

      // Allow keyboard/layout to settle first
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight || document.documentElement.clientHeight;

        const bottomMargin = 80; // px buffer above keyboard/bottom

        if (rect.bottom > viewportHeight - bottomMargin) {
          const offset = rect.bottom - (viewportHeight - bottomMargin);
          container.scrollBy({ top: offset, behavior: 'smooth' });
        }
      }, 200);
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [inputSelector, containerSelector]);
}
