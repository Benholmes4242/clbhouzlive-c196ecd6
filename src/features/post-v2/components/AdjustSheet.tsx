// AdjustSheet - real crop / reposition for image items.
//
// Shows the source image inside the currently selected frame aspect
// (Original/4:5/1:1/9:16). Drag to pan, pinch OR slider to zoom (1x - 3x).
// Rule-of-thirds grid appears while interacting. Reset returns to
// pos={50,50}, scale=1. Done writes { x, y, scale } into item.crop.

import { useEffect, useMemo, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import type { StageMediaItem } from '../hooks/useStageComposer';
import {
  DEFAULT_POS,
  MAX_SCALE,
  MIN_SCALE,
  baseCoverCrop,
  clampScale,
  frameRatio,
} from '../lib/frameCropMath';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  item: StageMediaItem | null;
  onApply: (crop: { x: number; y: number; scale: number }) => void;
}

export default function AdjustSheet({ open, onClose, item, onApply }: Props) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>(DEFAULT_POS);
  const [scale, setScale] = useState<number>(1);
  const [interacting, setInteracting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  // Reset local state on open.
  useEffect(() => {
    if (!open || !item) return;
    setNat(item.naturalWidth && item.naturalHeight ? { w: item.naturalWidth, h: item.naturalHeight } : null);
    setPos(item.crop ? { x: item.crop.x, y: item.crop.y } : DEFAULT_POS);
    setScale(item.crop?.scale ?? 1);
  }, [open, item]);

  // Preload dimensions when not already known.
  useEffect(() => {
    if (!open || !item || nat) return;
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = item.previewUrl;
  }, [open, item, nat]);

  // Measure the frame box for pointer math.
  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setBox({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const target = useMemo(() => (nat ? frameRatio(item?.frame ?? 'original', nat.w / nat.h) : 1), [nat, item?.frame]);

  // --- Preview transform math ---
  // baseImgW = smallest image size that covers the frame at scale=1.
  const layout = useMemo(() => {
    if (!nat || !box) return null;
    const base = baseCoverCrop(nat.w, nat.h, target);
    const pxPerSrc = box.w / base.w; // cover factor at scale=1
    const imgW = nat.w * pxPerSrc * scale;
    const imgH = nat.h * pxPerSrc * scale;
    // Excess pixels in preview space (image is at least as large as frame).
    const excessX = Math.max(0, imgW - box.w);
    const excessY = Math.max(0, imgH - box.h);
    // pos (0..100) -> preview offset. pos=50 centers.
    const left = -(pos.x / 100) * excessX;
    const top = -(pos.y / 100) * excessY;
    return { imgW, imgH, left, top, excessX, excessY, pxPerSrc };
  }, [nat, box, target, scale, pos]);

  // --- Pointer handling ---
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragOrigin = useRef<{ pos: { x: number; y: number }; layout: typeof layout } | null>(null);
  const pinchOrigin = useRef<{ dist: number; scale: number; pos: { x: number; y: number }; layout: typeof layout } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setInteracting(true);
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchOrigin.current = {
        dist: Math.hypot(dx, dy),
        scale,
        pos: { ...pos },
        layout,
      };
      dragOrigin.current = null;
    } else if (pointers.current.size === 1) {
      dragOrigin.current = { pos: { ...pos }, layout };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchOrigin.current) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      if (pinchOrigin.current.dist > 0) {
        const next = clampScale(pinchOrigin.current.scale * (dist / pinchOrigin.current.dist));
        setScale(next);
      }
      return;
    }

    if (pointers.current.size === 1 && dragOrigin.current && layout) {
      const dxPx = e.clientX - prev.x;
      const dyPx = e.clientY - prev.y;
      // Convert pixel drag into pos% delta (drag right = pan right = pos.x down)
      setPos((p) => {
        const nx = layout.excessX > 0 ? p.x - (dxPx / layout.excessX) * 100 : p.x;
        const ny = layout.excessY > 0 ? p.y - (dyPx / layout.excessY) * 100 : p.y;
        return {
          x: Math.max(0, Math.min(100, nx)),
          y: Math.max(0, Math.min(100, ny)),
        };
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchOrigin.current = null;
    if (pointers.current.size === 0) {
      dragOrigin.current = null;
      setInteracting(false);
    }
  };

  const reset = () => {
    setPos(DEFAULT_POS);
    setScale(1);
  };

  const done = () => {
    onApply({ x: pos.x, y: pos.y, scale });
    onClose();
  };

  // Stage area is fixed height inside the sheet.
  const STAGE_H = 360;

  return (
    <BottomSheet open={open} title="Adjust" onClose={onClose}>
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Frame stage */}
        <div style={{ background: '#000', borderRadius: 14, height: STAGE_H, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              position: 'relative',
              aspectRatio: `${target}`,
              maxWidth: '100%',
              maxHeight: '100%',
              // Fit inside stage: constrain by shorter side
              width: target >= 1 ? '100%' : 'auto',
              height: target >= 1 ? 'auto' : '100%',
              overflow: 'hidden',
              background: '#000',
              touchAction: 'none',
              cursor: 'grab',
              outline: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            {item && layout && (
              <img
                src={item.previewUrl}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: layout.left,
                  top: layout.top,
                  width: layout.imgW,
                  height: layout.imgH,
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Rule-of-thirds overlay */}
            {interacting && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ position: 'absolute', left: '66.666%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)' }} />
                <div style={{ position: 'absolute', top: '66.666%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CT.secondary, width: 40 }}>ZOOM</span>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(clampScale(parseFloat(e.target.value)))}
            onPointerDown={() => setInteracting(true)}
            onPointerUp={() => setInteracting(false)}
            style={{ flex: 1, accentColor: CT.ink, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: CT.ink, width: 40, textAlign: 'right' }}>{scale.toFixed(2)}x</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={reset}
            style={{ flex: 1, background: 'rgba(248,250,252,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: CT.ink, fontWeight: 600 }}
          >
            Reset
          </button>
          <button
            onClick={done}
            style={{ flex: 2, background: CT.ink, color: CT.canvas, border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
