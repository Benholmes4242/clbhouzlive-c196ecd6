import { useRef } from 'react';

export function useLongPress(callback: () => void, ms = 350) {
  const timeoutRef = useRef<number | null>(null);
  
  const start = () => {
    timeoutRef.current = window.setTimeout(callback, ms);
  };
  
  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      callback();
    }
  };
}