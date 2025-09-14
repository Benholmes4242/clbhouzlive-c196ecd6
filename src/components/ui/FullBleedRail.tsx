import React from 'react';

export interface FullBleedRailProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onVisibleChange?: (index: number) => void;
  getKey?: (item: T, index: number) => string | number;
}

export function FullBleedRail<T>({
  items,
  renderCard,
  onVisibleChange,
  getKey = (_, i) => i,
}: FullBleedRailProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const rail = ref.current;
    if (!rail || !onVisibleChange) return;
    
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.85) {
            const idx = Number((e.target as HTMLElement).dataset.index ?? -1);
            if (idx >= 0) {
              onVisibleChange(idx);
            }
          }
        });
      },
      { threshold: [0, 0.5, 0.85] }
    );
    
    rail.querySelectorAll('.fullbleed-item').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length, onVisibleChange]);

  return (
    <div className="fullbleed-rail" ref={ref}>
      {items.map((item, index) => (
        <article 
          className="fullbleed-item" 
          data-index={index} 
          key={getKey(item, index)}
        >
          {renderCard(item, index)}
        </article>
      ))}
    </div>
  );
}