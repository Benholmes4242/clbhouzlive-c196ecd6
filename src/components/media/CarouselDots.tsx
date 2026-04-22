/**
 * CarouselDots — unified multi-media indicator.
 *
 * Two variants:
 *  - 'segments'  → Stories-style filled bars for fullscreen surfaces
 *  - 'elongated' → iOS-style pill dots for feed cards
 *
 * White-only. No amber. Non-interactive (parent owns gesture/index).
 * Returns null when count <= 1.
 *
 * Spec: see brief "Carousel dots for multi-media posts".
 */
import React, { useEffect, useState } from 'react';

export interface CarouselDotsProps {
  count: number;
  active: number;
  variant: 'segments' | 'elongated' | 'windowed';
  /** Controls opacity for fade behaviour. Default true. */
  isVisible?: boolean;
  className?: string;
}

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  count,
  active,
  variant,
  isVisible = true,
  className = '',
}) => {
  if (count <= 1) return null;

  const safeActive = Math.max(0, Math.min(active, count - 1));

  const containerStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 300ms ease',
    pointerEvents: 'none',
  };

  if (variant === 'segments') {
    return (
      <div
        role="group"
        aria-label="Media carousel position"
        className={`flex gap-[6px] w-full ${className}`}
        style={containerStyle}
      >
        <span className="sr-only" aria-live="polite">
          Image {safeActive + 1} of {count}
        </span>
        {Array.from({ length: count }).map((_, i) => {
          const isCurrent = i === safeActive;
          const isComplete = i < safeActive;
          const fillWidth = isCurrent || isComplete ? '100%' : '0%';
          return (
            <div
              key={i}
              className="flex-1 h-[4px] rounded-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.28)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: fillWidth,
                  background: 'rgba(255, 255, 255, 0.98)',
                  transition: 'width 300ms ease',
                  boxShadow: isCurrent ? '0 0 4px rgba(255,255,255,0.35)' : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'windowed') {
    return (
      <div
        role="group"
        aria-label="Media carousel position"
        className={`flex gap-1 justify-center items-center ${className}`}
        style={containerStyle}
      >
        <span className="sr-only" aria-live="polite">
          Image {safeActive + 1} of {count}
        </span>
        {Array.from({ length: count }).map((_, i) => {
          const d = Math.abs(i - safeActive);
          const size = d === 0 ? 8 : d === 1 ? 6 : d === 2 ? 5 : 4;
          const opacity = d === 0 ? 1 : d === 1 ? 0.8 : d === 2 ? 0.55 : 0.3;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300 ease-out"
              style={{
                width: size,
                height: size,
                background: 'rgba(255, 255, 255, 0.98)',
                opacity,
                boxShadow: d === 0 ? '0 1px 3px rgba(0,0,0,0.3)' : undefined,
              }}
            />
          );
        })}
      </div>
    );
  }

  // elongated variant
  return (
    <div
      role="group"
      aria-label="Media carousel position"
      className={`flex gap-[6px] justify-center items-center ${className}`}
      style={containerStyle}
    >
      <span className="sr-only" aria-live="polite">
        Image {safeActive + 1} of {count}
      </span>
      {Array.from({ length: count }).map((_, i) => {
        const isCurrent = i === safeActive;
        return (
          <div
            key={i}
            className="h-[6px] rounded-full"
            style={{
              width: isCurrent ? 20 : 6,
              background: isCurrent
                ? 'rgba(255, 255, 255, 0.98)'
                : 'rgba(255, 255, 255, 0.42)',
              boxShadow: isCurrent ? '0 1px 3px rgba(0,0,0,0.3)' : undefined,
              transition: 'all 300ms ease-out',
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
