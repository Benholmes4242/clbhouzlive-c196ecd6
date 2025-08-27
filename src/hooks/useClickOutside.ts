import { useEffect, useRef } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  listenCapturing: boolean = true
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener, listenCapturing);
    document.addEventListener('touchstart', listener, listenCapturing);

    return () => {
      document.removeEventListener('mousedown', listener, listenCapturing);
      document.removeEventListener('touchstart', listener, listenCapturing);
    };
  }, [ref, handler, listenCapturing]);

  return ref;
}