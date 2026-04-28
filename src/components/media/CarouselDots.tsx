/**
 * CarouselDots — unified segment-bar multi-media indicator.
 *
 * Stories-style filled progress bars. White-only, non-interactive
 * (parent owns gesture/index). Returns null when count <= 1.
 *
 * The `variant` prop is deprecated and ignored — all surfaces render
 * the same segment-bar style now.
 */
import React, { useEffect, useState } from 'react';

const MAX_VISIBLE = 6;

export interface CarouselDotsProps {
  count: number;
  active: number;
  /** @deprecated All variants render as segment bars now. Prop ignored. Will be removed next release. */
  variant?: 'segments' | 'elongated' | 'windowed';
  /** Controls opacity for fade behaviour. Default true. */
  isVisible?: boolean;
  className?: string;
}

export const CarouselDots: React.FC<CarouselDotsProps> = ({
  count,
  active,
  isVisible = true,
  className = '',
}) => {
  if (count <= 1) return null;

  const safeActive = Math.max(0, Math.min(active, count - 1));
  const visibleCount = Math.min(count, MAX_VISIBLE);
  const overflow = count - visibleCount;

  return (
    <div
      role="group"
      aria-label="Media carousel position"
      className={`flex items-center ${className}`}
      style={{
        width: 124,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
      }}
    >
      <span className="sr-only" aria-live="polite">
        Image {safeActive + 1} of {count}
      </span>
      <div style={{ display: 'flex', flex: 1, gap: 4 }}>
        {Array.from({ length: visibleCount }).map((_, i) => {
          const isCurrent = i === safeActive;
          const isComplete = i < safeActive;
          const fillWidth = isCurrent || isComplete ? '100%' : '0%';
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.22)',
                boxShadow: '0 1px 1px rgba(0,0,0,0.25)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: fillWidth,
                  borderRadius: 2,
                  background: isCurrent
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.7)',
                  boxShadow: isCurrent
                    ? '0 0 6px rgba(255,255,255,0.5)'
                    : undefined,
                  transition: 'width 320ms cubic-bezier(0.22,0.61,0.36,1)',
                }}
              />
            </div>
          );
        })}
      </div>
      {overflow > 0 && (
        <span
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.3px',
            marginLeft: 2,
          }}
        >
          +{overflow}
        </span>
      )}
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
