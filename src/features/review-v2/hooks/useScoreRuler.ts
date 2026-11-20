import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { barValueFromX, snapScore } from '../lib/scoreStepRules';

/** Tap commits immediately; moving pointers refine the same 1–10 / 0.1 scale. */
export function useScoreRuler(value: number | null, onChange: (value: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const setFromPointer = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    onChange(barValueFromX(clientX - rect.left, rect.width));
  }, [onChange]);
  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => setFromPointer(event.clientX);
    const stop = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging, setFromPointer]);
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button > 0) return;
    event.preventDefault();
    setDragging(true);
    setFromPointer(event.clientX);
    ref.current?.focus({ preventScroll: true });
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    let next: number;
    const current = value ?? 1;
    const step = event.shiftKey ? 1 : 0.1;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowUp': next = current + step; break;
      case 'ArrowLeft': case 'ArrowDown': next = current - step; break;
      case 'Home': next = 1; break;
      case 'End': next = 10; break;
      default: return;
    }
    event.preventDefault();
    onChange(snapScore(next));
  };
  return { ref, dragging, onPointerDown, onKeyDown };
}