import React from 'react';
import { MapPin } from 'lucide-react';

export type WatchInnerMode = 'clips' | 'longform';

const GOLF_TAGS: { id: string; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'All' },
  { id: 'near', label: 'Near Me', icon: <MapPin className="w-3 h-3" /> },
  { id: 'course-vlog', label: 'Course Vlogs' },
  { id: 'hole-out', label: 'Hole Outs' },
  { id: 'swing', label: 'Swing' },
  { id: 'tips-coaching', label: 'Tips & Coaching' },
  { id: 'my-round', label: 'My Round' },
  { id: 'funny', label: 'Funny' },
  { id: 'gear', label: 'Gear' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'travel', label: 'Golf Trip' },
  { id: 'challenge', label: 'Challenge' },
];

interface WatchInnerToggleProps {
  mode: WatchInnerMode;
  onModeChange: (m: WatchInnerMode) => void;
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export const WatchInnerToggle: React.FC<WatchInnerToggleProps> = ({ mode, onModeChange, activeTag, onTagChange }) => {
  return (
    <div
      className="sticky z-[29] bg-background"
      style={{
        top: '0px',
        borderBottom: '1px solid hsl(var(--border) / 0.12)',
        padding: '10px 16px 0',
      }}
    >
      {/* Row 1 — Mode toggle pills */}
      <div className="flex items-center gap-2 pb-2">
        {(['clips', 'longform'] as WatchInnerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="shrink-0 min-h-[34px] px-4 text-sm font-semibold transition-colors active:scale-[0.97]"
            style={{
              borderRadius: 8,
              background: mode === m ? 'hsl(var(--foreground))' : 'transparent',
              color: mode === m ? '#fff' : 'hsl(var(--muted-foreground))',
              border: mode === m ? 'none' : '1.5px solid hsl(var(--border))',
            }}
          >
            {m === 'clips' ? 'Clips' : 'Long Form'}
          </button>
        ))}
      </div>

      {/* Row 2 — Golf category tag chips (Clips mode only) */}
      {mode === 'clips' && (
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', padding: '2px 16px 10px' }}
        >
          {GOLF_TAGS.map((tag) => {
            const isActive = activeTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => onTagChange(tag.id)}
                className="shrink-0 whitespace-nowrap min-h-[28px] px-2.5 text-xs font-medium transition-colors active:scale-[0.97] flex items-center gap-1"
                style={{
                  borderRadius: 20,
                  background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                  border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                  color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                }}
              >
                {tag.icon && <span className="flex items-center">{tag.icon}</span>}
                {tag.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
