import { Search } from 'lucide-react';
import type { FriendsMode } from '@/components/friends-tab/hooks/useFriendsFeed';

const MODES: { id: FriendsMode; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
];

interface LoopHeaderProps {
  activeMode: FriendsMode;
  onModeChange: (mode: FriendsMode) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

export function LoopHeader({ activeMode, onModeChange, onOpenSearch }: LoopHeaderProps) {
  return (
    <div
      className="sticky z-30 bg-background"
      style={{
        top: '0px',
        borderBottom: '1px solid hsl(var(--border) / 0.12)',
      }}
    >
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
          aria-label="Search The Loop"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search The Loop…</span>
        </button>
      </div>
      <div role="tablist" className="flex justify-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {MODES.map(({ id, label }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(id)}
              className="shrink-0 min-h-[36px] px-4 text-sm font-semibold transition-colors active:scale-[0.97]"
              style={{
                borderRadius: 8,
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
