import React from 'react';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';

export type WatchInnerMode = 'clips' | 'longform';

interface WatchInnerToggleProps {
  mode: WatchInnerMode;
  onModeChange: (m: WatchInnerMode) => void;
  activeTag: string;
  onTagChange: (tag: string) => void;
}

interface ChipButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onTap: () => void;
}

function ChipButton({ label, icon, isActive, onTap }: ChipButtonProps) {
  return (
    <button
      onClick={onTap}
      className="shrink-0 whitespace-nowrap min-h-[34px] px-3.5 text-[13px] font-semibold transition-colors active:scale-[0.97] flex items-center gap-1"
      style={{
        borderRadius: 20,
        background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
        border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
        color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
      }}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {label}
    </button>
  );
}

export const WatchInnerToggle: React.FC<WatchInnerToggleProps> = ({ mode, onModeChange, activeTag, onTagChange }) => {
  const { data: categoryChips = [], isLoading: chipsLoading } = useWatchCategoryChips();

  return (
    <div
      className="sticky z-[29] bg-background"
      style={{
        top: '0px',
        borderBottom: '1px solid hsl(var(--border) / 0.12)',
        padding: '8px 16px 0',
      }}
    >
      {/* Row 1 — Mode toggle: lighter segmented style */}
      <div
        className="flex items-center gap-1 pb-2 mx-auto"
        style={{
          maxWidth: 260,
          background: 'hsl(var(--muted))',
          borderRadius: 10,
          padding: 3,
        }}
      >
        {(['clips', 'longform'] as WatchInnerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="active:scale-[0.97] transition-colors"
            style={{
              flex: 1,
              minHeight: 32,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              border: 'none',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {m === 'clips' ? 'Clips' : 'Videos'}
          </button>
        ))}
      </div>

      {/* Row 2 — Dynamic category chips (Clips mode only) */}
      {mode === 'clips' && (
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', padding: '6px 16px 12px' }}
        >
          <ChipButton
            label="All"
            isActive={activeTag === 'all'}
            onTap={() => onTagChange('all')}
          />
          <ChipButton
            label="Near Me"
            icon={<MapPin className="w-3 h-3" />}
            isActive={activeTag === 'near'}
            onTap={() => onTagChange('near')}
          />
          {chipsLoading ? (
            [0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="shrink-0 h-[34px] w-[80px] rounded-full" />
            ))
          ) : (
            categoryChips.map(chip => (
              <ChipButton
                key={chip.id}
                label={chip.label}
                isActive={activeTag === chip.id}
                onTap={() => onTagChange(chip.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
