import { memo, useRef } from 'react';
import { useEdgeFades } from '@/components/watch/shared/useEdgeFades';
import { TOUR_CONFIG, type TourId } from '../../hooks/useOverviewData';

interface SectionTourLensProps {
  value: TourId | null;
  onChange: (t: TourId | null) => void;
}

const TOUR_ORDER: TourId[] = ['pga', 'lpga', 'euro', 'liv', 'champ', 'pgad'];

/**
 * SectionTourLens — per-section tour filter primitive.
 *
 * A horizontally-scrolling chip row defaulting to "All Tours".
 * Controlled by the parent section; no internal state, no auto-scroll.
 * Right-edge fade appears only when the row overflows.
 */
function SectionTourLensInner({ value, onChange }: SectionTourLensProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEdgeFades(scrollerRef, wrapperRef);

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
        <Chip
          id={null}
          label="All Tours"
          active={value === null}
          onClick={() => onChange(null)}
        />
        {TOUR_ORDER.map((id) => {
          const config = TOUR_CONFIG[id];
          return (
            <Chip
              key={id}
              id={id}
              label={`${config.emoji} ${config.name}`}
              active={value === id}
              onClick={() => onChange(id)}
            />
          );
        })}
      </div>

      {/* Right-edge fade (only when scrollable) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full hrail-fade hrail-fade-right"
        style={{
          width: 5,
          background: 'linear-gradient(to left, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

interface ChipProps {
  id: TourId | null;
  label: string;
  active: boolean;
  onClick: () => void;
}

function Chip({ id, label, active, onClick }: ChipProps) {
  return (
    <button
      key={id ?? 'all'}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
      style={{
        height: 30,
        padding: '0 11px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 15,
        background: active ? 'rgba(247,147,30,0.12)' : 'transparent',
        border: active ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
        color: active ? '#c97a10' : 'hsl(var(--muted-foreground))',
        letterSpacing: '-0.01em',
        gap: 5,
      }}
    >
      <span>{label}</span>
    </button>
  );
}

export const SectionTourLens = memo(SectionTourLensInner);
export default SectionTourLens;
