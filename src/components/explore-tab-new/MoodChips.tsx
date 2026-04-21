import { memo } from 'react';
import { EXPLORE_MOODS, type ExploreMoodId } from './hooks/useExploreMood';

interface MoodChipsProps {
  active: ExploreMoodId;
  onChange: (id: ExploreMoodId) => void;
}

function MoodChipsInner({ active, onChange }: MoodChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by mood"
      className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
      style={{ background: '#F8FAFC', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
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
              background: isActive ? '#0F172A' : '#FFFFFF',
              border: isActive ? '1px solid #0F172A' : '1px solid rgba(15,23,42,0.12)',
              color: isActive ? '#FFFFFF' : '#0F172A',
              letterSpacing: '-0.01em',
            }}
          >
            <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const MoodChips = memo(MoodChipsInner);
