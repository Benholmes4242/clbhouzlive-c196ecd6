import { useState, useEffect } from 'react';

/**
 * Detect on-screen keyboard height using the Visual Viewport API.
 * Returns 0 when no keyboard is visible.
 *
 * Uses a 50px threshold to avoid false positives from browser chrome changes.
 * Listens to both `resize` and `scroll` events to handle iOS viewport scrolling.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const kbHeight = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardHeight(kbHeight > 50 ? kbHeight : 0);
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    // Check initial state
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return keyboardHeight;
}
