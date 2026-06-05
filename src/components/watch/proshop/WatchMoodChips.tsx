import { memo } from 'react';
import { WATCH_MOODS, type WatchMoodId } from './hooks/useWatchMood';

interface WatchMoodChipsProps {
  active: WatchMoodId;
  onChange: (id: WatchMoodId) => void;
}

/**
 * Pro Shop primitive — the row of mood chips above the "Clips to explore" grid.
 * Light-surface styling: transparent background so the page #F8FAFC shows through,
 * ink-filled active pill, white inactive pills with subtle slate borders,
 * right-edge fade blending to #F8FAFC.
 */
function WatchMoodChipsInner({ active, onChange }: WatchMoodChipsProps) {
  return (
    <div
      className="relative"
      style={{ background: 'transparent' }}
    >
      <div
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

      {/* Right-edge fade — signals horizontal overflow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 28,
          background: 'linear-gradient(to right, rgba(10,14,20,0) 0%, #0A0E14 100%)',
        }}
      />
    </div>
  );
}

export const WatchMoodChips = memo(WatchMoodChipsInner);
export default WatchMoodChips;
