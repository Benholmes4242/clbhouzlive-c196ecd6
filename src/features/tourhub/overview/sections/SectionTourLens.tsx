import { memo, useRef } from 'react';
import { TOUR_CONFIG, type TourId } from '../../hooks/useOverviewData';
import { useEdgeFades } from '@/components/watch/shared/useEdgeFades';

interface SectionTourLensProps {
  value: TourId | null;
  onChange: (t: TourId | null) => void;
}

const TOUR_ORDER: TourId[] = ['pga', 'euro', 'liv', 'champ', 'pgad', 'lpga'];

interface TourLensChip {
  id: TourId | null;
  label: string;
  emoji?: string;
}

/**
 * Per-section tour lens primitive.
 * Compact horizontally-scrolling chip row that defaults to "All Tours"
 * and lets users flip the tour filter for a single overview section.
 */
function SectionTourLensInner({ value, onChange }: SectionTourLensProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEdgeFades(scrollerRef, wrapperRef);

  const chips: TourLensChip[] = [
    { id: null, label: 'All Tours' },
    ...TOUR_ORDER.map((id): TourLensChip => ({
      id,
      label: TOUR_CONFIG[id].name,
      emoji: TOUR_CONFIG[id].emoji,
    })),
  ];

  return (
    <div
      ref={wrapperRef}
      className="relative hrail-edge-fade"
      style={{ background: '#F8FAFC' }}
    >
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Filter section by tour"
        className="flex gap-1.5 overflow-x-auto scrollbar-hide"
        style={{ padding: '8.5px 16px' }}
      >
        {chips.map((chip) => {
          const isActive = value === chip.id;
          return (
            <button
              key={chip.id ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(chip.id)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                letterSpacing: '-0.01em',
                gap: 5,
              }}
            >
              {chip.emoji && <span aria-hidden>{chip.emoji}</span>}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right-edge fade (only when scrollable) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full hrail-fade hrail-fade-right"
        style={{
          width: 28,
          background: 'linear-gradient(to left, #F8FAFC 0%, rgba(248,250,252,0) 100%)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

export const SectionTourLens = memo(SectionTourLensInner);
export default SectionTourLens;
