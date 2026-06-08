import { memo } from 'react';
import { CLIPS_MOODS, type ClipsMoodId } from './hooks/useClipsMood';
import { ChipRowSearchField, ChipRowSearchTrigger } from '@/components/watch/shared/ChipRowSearchField';

interface ClipsMoodChipsProps {
  active: ClipsMoodId;
  onChange: (id: ClipsMoodId) => void;
  searchOpen: boolean;
  searchValue: string;
  onSearchOpen: () => void;
  onSearchChange: (v: string) => void;
  onSearchClose: () => void;
}

function ClipsMoodChipsInner({
  active, onChange, searchOpen, searchValue, onSearchOpen, onSearchChange, onSearchClose,
}: ClipsMoodChipsProps) {
  return (
    <div
      className="relative"
      style={{
        background: '#0A0E14',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="flex items-center gap-1.5"
        style={{ padding: '8.5px 28px 8.5px 16px' }}
      >
        {searchOpen ? (
          <ChipRowSearchField
            value={searchValue}
            onChange={onSearchChange}
            onClose={onSearchClose}
            placeholder="Search clips..."
          />
        ) : (
          <ChipRowSearchTrigger onOpen={onSearchOpen} />
        )}

        <div
          role="tablist"
          aria-label="Filter Clips by mood"
          className="flex gap-1.5 overflow-x-auto scrollbar-hide"
          style={{ flex: 1, minWidth: 0 }}
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
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.18)',
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                  letterSpacing: '-0.01em',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                {(() => { const Icon = m.icon; return <Icon size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />; })()}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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

export const ClipsMoodChips = memo(ClipsMoodChipsInner);
export default ClipsMoodChips;
