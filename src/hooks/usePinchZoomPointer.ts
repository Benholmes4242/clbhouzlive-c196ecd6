// src/hooks/usePinchZoomPointer.ts
import { useEffect, useRef, useState, CSSProperties } from "react";

type UsePinchZoomPointerOpts = {
  maxScale?: number;
  minScale?: number;
  doubleTapZoom?: number; // e.g., 2
};

export function usePinchZoomPointer(opts: UsePinchZoomPointerOpts = {}) {
  const {
    maxScale = 4,
    minScale = 1,
    doubleTapZoom = 2,
  } = opts;

  const ref = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastTapTime = useRef<number>(0);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const startScale = useRef(1);
  const startDx = useRef(0);
  const startDy = useRef(0);
  const startDistance = useRef<number | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getCenter = () => {
    const pts = Array.from(pointers.current.values());
    const n = pts.length;
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / n,
      y: pts.reduce((s, p) => s + p.y, 0) / n,
    };
  };

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  // Style: allow vertical pass-through when not zoomed
  const style: CSSProperties = {
    transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
    touchAction: scale === 1 ? "pan-y" : "none",
    transition: scale === 1 ? "transform 0.25s ease-out" : "none",
    userSelect: "none",
  } as CSSProperties & { WebkitUserDrag: string };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      // Allow vertical scroll when not zoomed; still collect positions.
      el.setPointerCapture?.(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 1) {
        // Double-tap (pointer) zoom
        const now = Date.now();
        if (now - lastTapTime.current < 300 && scale === 1) {
          // Zoom in on double tap
          setScale(clamp(doubleTapZoom, minScale, maxScale));
          // No need to preventDefault; we capture pointer
        }
        lastTapTime.current = now;

        startScale.current = scale;
        startDx.current = dx;
        startDy.current = dy;
        lastCenter.current = Array.from(pointers.current.values())[0];
        startDistance.current = null;
      }

      if (pointers.current.size === 2) {
        // Initialize pinch
        const [p1, p2] = Array.from(pointers.current.values());
        startDistance.current = distance(p1, p2);
        startScale.current = scale;
        startDx.current = dx;
        startDy.current = dy;
        lastCenter.current = getCenter();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const n = pointers.current.size;

      if (n === 1) {
        // Pan only when zoomed
        if (scale > 1) {
          const cur = Array.from(pointers.current.values())[0];
          const lc = lastCenter.current!;
          const ndx = startDx.current + (cur.x - lc.x);
          const ndy = startDy.current + (cur.y - lc.y);
          setDx(ndx);
          setDy(ndy);
          // Prevent page scroll while zoomed
          e.preventDefault();
        }
        return;
      }

      if (n === 2) {
        const [p1, p2] = Array.from(pointers.current.values());
        const curDist = distance(p1, p2);
        if (startDistance.current == null) {
          startDistance.current = curDist;
        }
        const s = clamp((curDist / (startDistance.current || curDist)) * startScale.current, minScale, maxScale);
        setScale(s);

        const c = getCenter();
        const lc = lastCenter.current!;
        const ndx = startDx.current + (c.x - lc.x);
        const ndy = startDy.current + (c.y - lc.y);
        setDx(ndx);
        setDy(ndy);

        // Capture gesture while pinching
        e.preventDefault();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size === 0) {
        lastCenter.current = null;
        startDistance.current = null;

        // Snap back if slightly over-zoomed or offscreen (lightweight bounds)
        const s = clamp(scale, minScale, maxScale);
        if (s !== scale) setScale(s);

        // Optional: add bounds for dx/dy based on content size/container size.
      } else if (pointers.current.size === 1) {
        // When one pointer remains after a pinch, reset baselines
        startScale.current = scale;
        startDx.current = dx;
        startDy.current = dy;
        lastCenter.current = Array.from(pointers.current.values())[0];
        startDistance.current = null;
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });
    el.addEventListener("pointerleave", onPointerUp, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown as any);
      el.removeEventListener("pointermove", onPointerMove as any);
      el.removeEventListener("pointerup", onPointerUp as any);
      el.removeEventListener("pointercancel", onPointerUp as any);
      el.removeEventListener("pointerleave", onPointerUp as any);
    };
  }, [scale, dx, dy]);

  const reset = () => {
    setScale(1);
    setDx(0);
    setDy(0);
  };

  return { ref, style, scale, setScale, dx, dy, setDx, setDy, reset };
}