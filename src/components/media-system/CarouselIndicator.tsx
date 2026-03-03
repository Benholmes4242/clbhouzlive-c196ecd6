/**
 * CarouselIndicator — Instagram-style dots with active pill.
 * Max 5 visible; dots beyond ±2 of active shrink and fade.
 */

interface CarouselIndicatorProps {
  total: number;
  activeIndex: number;
}

export function CarouselIndicator({ total, activeIndex }: CarouselIndicatorProps) {
  if (total <= 1) return null;

  return (
    <div
      className="absolute z-20 flex items-center justify-center gap-1.5"
      style={{ bottom: 40, left: '50%', transform: 'translateX(-50%)' }}
    >
      {Array.from({ length: total }, (_, i) => {
        const dist = Math.abs(i - activeIndex);
        const isActive = i === activeIndex;

        // Beyond ±2: shrink + extra fade
        const farAway = dist > 2;

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-200 ease-out"
            style={{
              width: isActive ? 8 : farAway ? 4 : 6,
              height: isActive ? 8 : farAway ? 4 : 6,
              backgroundColor: 'white',
              opacity: isActive ? 1 : farAway ? 0.3 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
