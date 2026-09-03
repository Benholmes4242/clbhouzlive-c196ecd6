import { memo, useRef } from 'react';
import { WATCH_MOODS, type WatchMoodId } from './hooks/useWatchMood';
import { useEdgeFades } from '../shared/useEdgeFades';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface WatchMoodChipsProps {
  active: WatchMoodId;
  onChange: (id: WatchMoodId) => void;
}

/**
 * Pro Shop primitive — the row of mood chips above the "Clips to explore" grid.
 * Phase 7: conditional edge fades (right only appears when scrollable; left only
 * after the user has scrolled right).
 */
function WatchMoodChipsInner({ active, onChange }: WatchMoodChipsProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEdgeFades(scrollerRef, wrapperRef);

  return (
    <div
      ref={wrapperRef}
      className="relative hrail-edge-fade"
      style={{ background: A.CANVAS }}
    >
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Filter Watch by mood"
        className="flex gap-1.5 overflow-x-auto scrollbar-hide"
        style={{ padding: '8.5px 28px 8.5px 16px' }}
      >
        {WATCH_MOODS.map((m) => {
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(m.id)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.18)',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                letterSpacing: '-0.01em',
                gap: 5,
              }}
            >
              {(() => { const Icon = m.icon; return <Icon size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />; })()}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Left fade (only after scrolling right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-full hrail-fade hrail-fade-left"
        style={{
          width: 5,
          background: `linear-gradient(to right, rgba(21,23,31,0) 0%, ${A.CANVAS} 100%)`,
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

export const WatchMoodChips = memo(WatchMoodChipsInner);
export default WatchMoodChips;
