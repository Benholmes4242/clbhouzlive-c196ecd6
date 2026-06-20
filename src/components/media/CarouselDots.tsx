/**
 * CarouselDots — Instagram-style sliding-window dot indicator.
 *
 * ≤7 dots: all shown. >7: a 7-dot window with edge dots shrinking/fading
 * to imply "more beyond". No "+N" overflow (the n/total chip handles count).
 * Plain white. Non-interactive (parent owns gesture/index). Returns null when count <= 1.
 */
import React, { useEffect, useState } from 'react';

const WINDOW = 7; // max dots rendered at once
const DOT = 6;    // dot diameter (px)
const GAP = 5;

function computeWindow(count: number, active: number) {
  if (count <= WINDOW) {
    return Array.from({ length: count }, (_, i) => ({ index: i, scale: 1, opacity: 1 }));
  }

  const half = Math.floor(WINDOW / 2);
  let start = active - half;
  let end = active + half;

  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > count - 1) {
    start -= (end - (count - 1));
    end = count - 1;
  }
  start = Math.max(0, start);

  const dots: { index: number; scale: number; opacity: number }[] = [];
  for (let i = start; i <= end; i++) {
    const atLeftEdge = i === start && start > 0;
    const atRightEdge = i === end && end < count - 1;
    const secondLeft = i === start + 1 && start > 0;
    const secondRight = i === end - 1 && end < count - 1;

    let scale = 1, opacity = 1;
    if (atLeftEdge || atRightEdge) {
      scale = 0.5;
      opacity = 0.5;
    } else if (secondLeft || secondRight) {
      scale = 0.75;
      opacity = 0.75;
    }

    dots.push({ index: i, scale, opacity });
  }

  return dots;
}

export interface CarouselDotsProps {
  count: number;
  active: number;
  /** @deprecated Ignored. All surfaces render as dot indicators now. */
  variant?: 'segments' | 'elongated' | 'windowed';
  /** Controls opacity for fade behaviour. Default true. */
  isVisible?: boolean;
  className?: string;
  tone?: 'light' | 'dark';
}

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  count,
  active,
  isVisible = true,
  className = '',
  tone = 'light',
}) => {
  if (count <= 1) return null;

  const safeActive = Math.max(0, Math.min(active, count - 1));
  const dots = computeWindow(count, safeActive);

  return (
    <div
      role="group"
      aria-label="Media carousel position"
      className={`flex items-center justify-center ${className}`}
      style={{
        gap: GAP,
        height: DOT + 4,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
      }}
    >
      <span className="sr-only" aria-live="polite">
        Image {safeActive + 1} of {count}
      </span>
      {dots.map(({ index, scale, opacity }) => {
        const isActive = index === safeActive;
        const size = DOT * scale;
        return (
          <div
            key={index}
            style={{
              width: size,
              height: size,
              borderRadius: 999,
              flexShrink: 0,
              background: isActive
                ? '#FFFFFF'
                : `rgba(255,255,255,${0.45 * opacity})`,
              transition: 'all 260ms cubic-bezier(0.22,0.61,0.36,1)',
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * useCarouselDotsVisibility — fullscreen-only fade behaviour.
 * Visible on mount and on every active-index change, then fades after idleMs.
 * Feed cards should NOT use this — they stay always-visible.
 */
export function useCarouselDotsVisibility(
  activeIndex: number,
  options?: { idleMs?: number },
) {
  const idleMs = options?.idleMs ?? 2500;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), idleMs);
    return () => clearTimeout(timer);
  }, [activeIndex, idleMs]);

  return isVisible;
}

export default CarouselDots;
