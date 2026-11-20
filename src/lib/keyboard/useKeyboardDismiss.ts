/** Wizard-local keyboard ownership. Focus plus visualViewport is authoritative;
 * passive touches preserve field scrolling, result lists and horizontal trays.
 * The wizard ref scopes focus even when #root owns review page scrolling.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

function textField(element: Element | null): HTMLElement | null {
  if (element instanceof HTMLTextAreaElement) return element;
  if (element instanceof HTMLInputElement && ['text', 'search', 'email', 'tel', 'url', 'password', 'number'].includes(element.type)) return element;
  if (element instanceof HTMLElement) return element.closest<HTMLElement>('[contenteditable]:not([contenteditable="false"])');
  return null;
}

export function useKeyboardDismiss(scrollRef: RefObject<HTMLElement>) {
  const [keyboard, setKeyboard] = useState({ keyboardOpen: false, keyboardTop: typeof window === 'undefined' ? 0 : window.innerHeight });
  const gesture = useRef<{ x: number; y: number; excluded: boolean } | null>(null);
  const update = useCallback(() => {
    const viewport = window.visualViewport;
    const field = textField(document.activeElement);
    const keyboardOpen = !!field && !!scrollRef.current?.contains(field) && (!viewport || window.innerHeight - viewport.height > 120);
    const keyboardTop = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    setKeyboard(previous => previous.keyboardOpen === keyboardOpen && previous.keyboardTop === keyboardTop ? previous : { keyboardOpen, keyboardTop });
  }, [scrollRef]);
  const dismiss = useCallback(() => { textField(document.activeElement)?.blur(); update(); }, [update]);

  // Rebind after commits: StageComposer swaps its empty/populated scrollers.
  // Gesture state survives focus and viewport re-renders in a ref.
  useEffect(() => {
    const scroll = scrollRef.current;
    const viewport = window.visualViewport;
    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      const field = textField(document.activeElement);
      const target = event.target instanceof Element ? event.target : null;
      if (!touch || !target || !scroll?.contains(target)) { gesture.current = null; return; }
      gesture.current = { x: touch.clientX, y: touch.clientY,
        excluded: !!target.closest('[data-keyboard-keep-open], .pf4-with-results') || !!(field?.contains(target) && field.scrollHeight > field.clientHeight) };
    };
    const move = (event: TouchEvent) => {
      const touch = event.touches[0];
      const drag = gesture.current;
      if (!touch || !drag || drag.excluded) return;
      const vertical = Math.abs(touch.clientY - drag.y);
      const horizontal = Math.abs(touch.clientX - drag.x);
      if (horizontal > vertical) { drag.excluded = true; return; }
      const field = textField(document.activeElement);
      if (vertical > 12 && field && scroll?.contains(field) && (!viewport || window.innerHeight - viewport.height > 120)) { gesture.current = null; dismiss(); }
    };
    const end = () => { gesture.current = null; };
    const passive = { passive: true };
    document.addEventListener('focusin', update, passive);
    document.addEventListener('focusout', update, passive);
    window.addEventListener('resize', update, passive);
    viewport?.addEventListener('resize', update, passive);
    viewport?.addEventListener('scroll', update, passive);
    scroll?.addEventListener('touchstart', start, passive);
    scroll?.addEventListener('touchmove', move, passive);
    scroll?.addEventListener('touchend', end, passive);
    scroll?.addEventListener('touchcancel', end, passive);
    update();
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      scroll?.removeEventListener('touchstart', start);
      scroll?.removeEventListener('touchmove', move);
      scroll?.removeEventListener('touchend', end);
      scroll?.removeEventListener('touchcancel', end);
    };
  });
  return { ...keyboard, dismiss };
}