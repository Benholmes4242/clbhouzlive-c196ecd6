import { memo } from 'react';
import { EXPLORE_MOODS, type ExploreMoodId } from './hooks/useExploreMood';

interface MoodChipsProps {
  active: ExploreMoodId;
  onChange: (id: ExploreMoodId) => void;
}

function MoodChipsInner({ active, onChange }: MoodChipsProps) {
  return (
    <div
      className="relative"
      style={{ background: '#F8FAFC', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
    >
      <div
        role="tablist"
        aria-label="Filter by mood"
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ paddingRight: 32 }}
      >
        {EXPLORE_MOODS.map((m) => {
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(m.id)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center gap-1.5"
              style={{
                minHeight: 36,
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 20,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                letterSpacing: '-0.01em',
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right-edge fade affordance — signals horizontal overflow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 40,
          background: 'linear-gradient(to right, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
        }}
      />
    </div>
  );
}

export const MoodChips = memo(MoodChipsInner);
