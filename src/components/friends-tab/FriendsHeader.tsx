import { Search } from 'lucide-react';
import type { FriendsMode } from './hooks/useFriendsFeed';

interface FriendsHeaderProps {
  activeMode: FriendsMode;
  onModeChange: (mode: FriendsMode) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

const MODES: { id: FriendsMode; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
];

export function FriendsHeader({
  activeMode,
  onModeChange,
  onOpenSearch,
  embedded = false,
}: FriendsHeaderProps) {
  const topStyle = embedded
    ? { marginTop: 24 }
    : { marginTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 24px)' };

  return (
    <div className="px-4 pb-3" style={topStyle}>
      {/* Search bar */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
        aria-label="Search friends' posts"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search friends' posts…</span>
      </button>

      {/* Filter chips */}
      <div className="flex items-center justify-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
        {MODES.map(({ id, label }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`min-h-[36px] px-4 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
