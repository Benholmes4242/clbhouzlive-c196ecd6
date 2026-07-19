// MediaStageV2 - full-bleed dark canvas for the active media item.
// Empty state: "ghost collage" - three dashed drifting frames + amber add CTA.

import { Plus, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StageMediaItem, FrameId } from '../hooks/useStageComposer';
import CroppedImage from './CroppedImage';

const FRAME_RATIO: Record<FrameId, number | null> = {
  original: null,
  '4:5': 4 / 5,
  '1:1': 1,
  '9:16': 9 / 16,
};

interface Props {
  item: StageMediaItem | null;
  index: number;
  total: number;
  onOpenAdjust?: () => void;
  onOpenTrim?: () => void;
  onOpenCover?: () => void;
  onRequestAdd?: () => void;
}

const KEYFRAMES_CSS = `
@keyframes pv2-floaty {
  0%,100% { transform: translateY(0) rotate(var(--r)); }
  50% { transform: translateY(-14px) rotate(calc(var(--r) + 2.5deg)); }
}
`;

interface FrameDef {
  w: number; h: number; x: number; y: number; r: number; delay: number; play?: boolean;
}

// Base values authored at container=260. Scaled proportionally.
const BASE = 260;
const FRAMES: FrameDef[] = [
  { w: 96,  h: 120, x: -78, y: -34, r: -7, delay: 0 },
  { w: 110, h: 82,  x: 34,  y: -66, r: 4,  delay: 0.4, play: true },
  { w: 86,  h: 104, x: 52,  y: 40,  r: 9,  delay: 0.8 },
];

function useContainerSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState(240);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const h = rect.height || 240;
      const w = rect.width || 320;
      // Collage sized to command the phone stage without clipping:
      // min(92vw, 480px, stageHeight * 0.8).
      setSize(Math.max(140, Math.min(w * 0.92, 480, h * 0.8)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export default function MediaStageV2({ item, index, total, onOpenAdjust, onOpenTrim, onOpenCover, onRequestAdd }: Props) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const containerSize = useContainerSize(stageRef);
  const k = containerSize / BASE;
  const frameRefs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    if (item) return;
    if (reduced) return;
    let raf = 0;
    let stopped = false;
    let needsJs = false;
    // Probe after mount: if animation-name is not pv2-floaty on the first
    // frame, engage the JS driver.
    const probe = () => {
      const el = frameRefs.current[0];
      if (!el) return;
      const cs = window.getComputedStyle(el);
      if (!cs.animationName || cs.animationName === 'none' || !cs.animationName.includes('pv2-floaty')) {
        needsJs = true;
      }
      if (!needsJs) return;
      const start = performance.now();
      const PERIOD = 3.2;
      const tick = (t: number) => {
        if (stopped) return;
        const elapsed = (t - start) / 1000;
        FRAMES.forEach((f, i) => {
          const el = frameRefs.current[i];
          if (!el) return;
          const phase = (elapsed - f.delay) / PERIOD;
          const s = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2); // 0..1..0
          const ty = -14 * s;
          const rot = f.r + 2.5 * s;
          el.style.transform = `translateY(${ty}px) rotate(${rot}deg)`;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const id = window.setTimeout(probe, 60);
    return () => {
      stopped = true;
      window.clearTimeout(id);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [item, reduced]);

  if (!item) {
    const plusSize = 56;
    return (
      <div ref={stageRef} style={{ flex: 1, background: '#15171F', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <style>{KEYFRAMES_CSS}</style>
        <button
          onClick={onRequestAdd}
          aria-label="Add media"
          style={{
            position: 'relative',
            width: containerSize,
            height: containerSize,
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {FRAMES.map((f, i) => {
            const w = f.w * k;
            const h = f.h * k;
            const x = f.x * k;
            const y = f.y * k;
            const style: React.CSSProperties = {
              position: 'absolute',
              left: `calc(50% + ${x}px - ${w / 2}px)`,
              top: `calc(50% + ${y}px - ${h / 2}px)`,
              width: w,
              height: h,
              borderRadius: 12,
              border: '1.5px dashed rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform',
              transform: `rotate(${f.r}deg)`,
            };
            (style as any)['--r'] = `${f.r}deg`;
            if (!reduced) {
              style.animation = `pv2-floaty 3.2s ${f.delay}s ease-in-out infinite`;
            }
            return (
              <div
                key={i}
                ref={(el) => { frameRefs.current[i] = el; }}
                style={style}
              >
                {f.play && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={10} color="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.3)" style={{ marginLeft: 1 }} />
                  </div>
                )}
              </div>
            );
          })}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: plusSize,
              height: plusSize,
              borderRadius: 999,
              background: '#F7931E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(247,147,30,0.4)',
            }}
          >
            <Plus size={24} strokeWidth={2} color="#FFFFFF" />
          </div>
        </button>
      </div>
    );
  }

  const ratio = FRAME_RATIO[item.frame];
  // Measured px box: for aspected frames compute boxW/boxH so the frame is
  // fully visible in the stage (the CSS aspectRatio + %-only sizing dropped
  // the ratio whenever height was the binding dimension - making pills look
  // dead even though the ratio IS baked into the posted file).
  const boxStyle: React.CSSProperties = ratio
    ? (() => {
        const stageW = stageSize.w || 0;
        const stageH = stageSize.h || 0;
        if (stageW === 0 || stageH === 0) return { width: 0, height: 0 };
        const boxW = Math.min(stageW, stageH * ratio);
        const boxH = boxW / ratio;
        return { width: boxW, height: boxH };
      })()
    : { width: '100%', height: '100%' };
  return (
    <div ref={stageRef} style={{ flex: 1, background: '#15171F', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ ...boxStyle, transition: 'width 250ms cubic-bezier(.2,.8,.2,1), height 250ms cubic-bezier(.2,.8,.2,1)' }}>
        {item.type === 'video' ? (
          <video src={item.previewUrl} playsInline muted loop autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CroppedImage item={item} />
        )}
      </div>
      {total > 1 && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', color: '#F5F6F7', fontSize: 12, padding: '4px 8px', borderRadius: 999 }}>
          {index + 1} / {total}
        </div>
      )}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
        {item.type === 'image' && (
          <button onClick={onOpenAdjust} style={chipStyle}>Adjust</button>
        )}
        {item.type === 'video' && (
          <>
            <button onClick={onOpenTrim} style={chipStyle}>Trim</button>
            <button onClick={onOpenCover} style={chipStyle}>Cover</button>
          </>
        )}
      </div>
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  color: '#F5F6F7',
  border: 0,
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  cursor: 'pointer',
};
