import { memo } from 'react';
import { CLIPS_MOODS, type ClipsMoodId } from './hooks/useClipsMood';

interface ClipsMoodChipsProps {
  active: ClipsMoodId;
  onChange: (id: ClipsMoodId) => void;
}

/**
 * Canonical chip strip — matches WatchMoodChips exactly.
 */
function ClipsMoodChipsInner({ active, onChange }: ClipsMoodChipsProps) {
  return (
    <div
      className="relative"
      style={{
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Filter Clips by mood"
        className="flex gap-1.5 overflow-x-auto scrollbar-hide"
        style={{ padding: '8.5px 28px 8.5px 16px' }}
      >
        {CLIPS_MOODS.map((m) => {
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
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                letterSpacing: '-0.01em',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 28,
          background: 'linear-gradient(to right, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
        }}
      />
    </div>
  );
}

export const ClipsMoodChips = memo(ClipsMoodChipsInner);
export default ClipsMoodChips;
