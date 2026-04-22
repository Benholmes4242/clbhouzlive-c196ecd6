import { memo } from 'react';
import { CLIPS_MOODS, type ClipsMoodId } from './hooks/useClipsMood';

interface ClipsMoodChipsProps {
  active: ClipsMoodId;
  onChange: (id: ClipsMoodId) => void;
}

/**
 * Pro Shop chip strip for the Clips subpage. Solid-dark active state matches
 * the Watch tab Pro Shop pattern. Cream #F5F1EA background ties the row into
 * the Pro Shop surface; right-edge fade signals horizontal overflow.
 */
function ClipsMoodChipsInner({ active, onChange }: ClipsMoodChipsProps) {
  return (
    <div
      className="relative"
      style={{
        background: '#F5F1EA',
        borderBottom: '0.5px solid rgba(15,23,42,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Filter Clips by mood"
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ paddingRight: 32 }}
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
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center gap-1.5"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 999,
                background: isActive ? '#0F172A' : '#FFFFFF',
                border: isActive ? '1px solid transparent' : '1px solid rgba(15,23,42,0.12)',
                color: isActive ? '#FFFFFF' : '#0F172A',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right-edge fade to cream — signals horizontal overflow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 40,
          background: 'linear-gradient(to right, rgba(245,241,234,0) 0%, #F5F1EA 100%)',
        }}
      />
    </div>
  );
}

export const ClipsMoodChips = memo(ClipsMoodChipsInner);
export default ClipsMoodChips;
