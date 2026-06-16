// src/hooks/usePinchZoomPointer.ts
import { useEffect, useRef, useState, CSSProperties } from "react";

type UsePinchZoomPointerOpts = {
  maxScale?: number;
  minScale?: number;
  doubleTapZoom?: number; // e.g., 2
  overScrollMargin?: number; // iOS-style bounce margin
};

function clampPan({
  dx,
  dy,
  scale,
  imgWidth,
  imgHeight,
  containerWidth,
  containerHeight,
  overScrollMargin = 0,
}: {
  dx: number;
  dy: number;
  scale: number;
  imgWidth: number;
  imgHeight: number;
  containerWidth: number;
  containerHeight: number;
  overScrollMargin?: number;
}) {
  const scaledW = imgWidth * scale;
  const scaledH = imgHeight * scale;

  const maxX = Math.max(0, (scaledW - containerWidth) / 2) + overScrollMargin;
  const maxY = Math.max(0, (scaledH - containerHeight) / 2) + overScrollMargin;

  return {
    dx: Math.min(maxX, Math.max(-maxX, dx)),
    dy: Math.min(maxY, Math.max(-maxY, dy)),
    isOverscrolled: Math.abs(dx) > maxX - overScrollMargin || Math.abs(dy) > maxY - overScrollMargin
  };
}

export function usePinchZoomPointer(opts: UsePinchZoomPointerOpts = {}) {
  const {
    maxScale = 4,
    minScale = 1,
    doubleTapZoom = 2,
    overScrollMargin = 30,
  } = opts;

  const ref = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  // Helper to get image and container dimensions
  const getDimensions = () => {
    const container = ref.current;
    const img = imgRef.current;
    
    if (!container || !img) {
      return {
        imgWidth: 100,
        imgHeight: 100,
        containerWidth: 100,
        containerHeight: 100
      };
    }

    return {
      imgWidth: img.naturalWidth || img.offsetWidth,
      imgHeight: img.naturalHeight || img.offsetHeight,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight
    };
  };

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
      // Record the pointer position but DO NOT capture yet. Capturing on the
      // first finger of an unzoomed image hijacks vertical swipes from the
      // snap-scroll container. We capture only when the gesture is
      // unambiguously pinch (2 pointers) or pan-while-zoomed.
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 1) {
        // Pan-while-zoomed: capture so the pan is smooth and doesn't bleed
        // into the scroller.
        if (scale > 1) {
          el.setPointerCapture?.(e.pointerId);
        }

        // Double-tap (pointer) zoom
        const now = Date.now();
        if (now - lastTapTime.current < 300 && scale === 1) {
          // Zoom in on double tap; capture now that we've entered zoom so the
          // immediate follow-on gesture is owned by this element.
          setScale(clamp(doubleTapZoom, minScale, maxScale));
          el.setPointerCapture?.(e.pointerId);
        }
        lastTapTime.current = now;

        startScale.current = scale;
        startDx.current = dx;
        startDy.current = dy;
        lastCenter.current = Array.from(pointers.current.values())[0];
        startDistance.current = null;
      }

      if (pointers.current.size === 2) {
        // Pinch starting — capture BOTH active pointers so neither drops out
        // if a finger leaves the element bounds mid-pinch.
        pointers.current.forEach((_, id) => el.setPointerCapture?.(id));

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
          const rawDx = startDx.current + (cur.x - lc.x);
          const rawDy = startDy.current + (cur.y - lc.y);
          
          // Apply clamping with overscroll
          const dimensions = getDimensions();
          const bounds = clampPan({
            dx: rawDx,
            dy: rawDy,
            scale,
            ...dimensions,
            overScrollMargin
          });
          
          setDx(bounds.dx);
          setDy(bounds.dy);
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
        const rawDx = startDx.current + (c.x - lc.x);
        const rawDy = startDy.current + (c.y - lc.y);

        // Apply clamping during pinch
        const dimensions = getDimensions();
        const bounds = clampPan({
          dx: rawDx,
          dy: rawDy,
          scale: s,
          ...dimensions,
          overScrollMargin
        });
        
        setDx(bounds.dx);
        setDy(bounds.dy);

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

        // Snap back from overscroll with smooth animation
        if (scale > 1) {
          const dimensions = getDimensions();
          const strictBounds = clampPan({
            dx,
            dy,
            scale,
            ...dimensions,
            overScrollMargin: 0 // No margin for snap-back
          });
          
          if (strictBounds.dx !== dx || strictBounds.dy !== dy) {
            // Trigger smooth snap-back animation
            setDx(strictBounds.dx);
            setDy(strictBounds.dy);
          }
        }
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

  return { ref, imgRef, style, scale, setScale, dx, dy, setDx, setDy, reset };
}