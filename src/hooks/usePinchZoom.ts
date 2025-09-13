import { useRef, useState } from "react";

export function usePinchZoom() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  function onTouchStart(e: React.TouchEvent) {
    const element = ref.current as any;
    if (!element) return;

    if (scale === 1) {
      // Not zoomed: allow vertical scroll to pass through
      // Just record positions for potential future zoom, don't prevent default
    } else {
      // Zoomed in: capture interaction
      e.preventDefault();
    }

    element._start = {
      touches: Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY })),
      scale,
      dx,
      dy,
    };
  }

  function onTouchMove(e: React.TouchEvent) {
    const element = ref.current as any;
    if (!element?._start) return;

    if (scale === 1) {
      // Not zoomed: don't prevent default; let scroll pass through
      // Only track for potential pinch initialization
      if (e.touches.length === 2) {
        // Allow pinch to start from unzoomed state
        e.preventDefault();
        const touches = Array.from(e.touches);
        const [a, b] = touches;
        const dist = (p: any, q: any) => Math.hypot(p.x - q.x, p.y - q.y);
        const s0 = dist(element._start.touches[0], element._start.touches[1]);
        const s1 = dist({x: a.clientX, y: a.clientY}, {x: b.clientX, y: b.clientY});
        const factor = Math.min(4, Math.max(1, element._start.scale * (s1 / (s0 || 1))));
        setScale(factor);
      }
      return;
    }

    // Zoomed: capture and handle pan/zoom
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const touches = Array.from(e.touches);
      const [a, b] = touches;
      const dist = (p: any, q: any) => Math.hypot(p.x - q.x, p.y - q.y);
      const s0 = dist(element._start.touches[0], element._start.touches[1]);
      const s1 = dist({x: a.clientX, y: a.clientY}, {x: b.clientX, y: b.clientY});
      const factor = Math.min(4, Math.max(1, element._start.scale * (s1 / (s0 || 1))));
      setScale(factor);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      const cur = e.touches[0];
      const prev = element._start.touches[0];
      setDx(element._start.dx + (cur.clientX - prev.x));
      setDy(element._start.dy + (cur.clientY - prev.y));
    }
  }

  function onTouchEnd() {
    if (scale < 1.02) {
      setScale(1);
      setDx(0);
      setDy(0);
    }
  }

  const style = {
    transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
    // Allow vertical scrolling when not zoomed, capture all when zoomed
    touchAction: scale === 1 ? ('pan-y' as const) : ('none' as const),
    transition: scale === 1 ? "transform 0.3s ease-out" : "none",
    // Optional but helpful
    WebkitUserDrag: "none" as const,
    userSelect: "none" as const,
  };

  const reset = () => {
    setScale(1);
    setDx(0);
    setDy(0);
  };

  return {
    ref,
    style,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    reset,
    scale
  };
}