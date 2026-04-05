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
          className="flex items-center gap-2 w-full h-11 px-3 rounded-2xl bg-muted text-muted-foreground text-[15px]"
          aria-label="Search Clbhouz"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search Clbhouz…</span>
        </button>
      </div>
      <div role="tablist" className="flex justify-center gap-2 px-4 pb-3.5 overflow-x-auto scrollbar-hide">
        {MODES.map(({ id, label }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(id)}
              className="shrink-0 transition-colors active:scale-[0.97]"
              style={{
                borderRadius: 20,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                padding: '6px 24px',
                minHeight: 36,
                whiteSpace: 'nowrap',
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
