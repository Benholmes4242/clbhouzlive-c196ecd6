import { memo } from 'react';
import type { LoopMode } from '@/components/loop-tab/types';

interface ChipDef {
  id: LoopMode;
  label: string;
  emoji?: string;
}

const MODES: ChipDef[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
];

interface DiscoverFriendsShellRowProps {
  activeMode: LoopMode;
  onModeChange: (mode: LoopMode) => void;
}

/**
 * Row 2 of the Discover shell when main=loop. Canonical chip styling
 * (matches WatchMoodChips). Two pills centered: Latest / Popular.
 */
function DiscoverFriendsShellRowInner({
  activeMode,
  onModeChange,
}: DiscoverFriendsShellRowProps) {
  return (
    <div
      className="relative"
      style={{
        background: '#0A0E14',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Filter Friends feed"
        className="flex justify-center gap-1.5"
        style={{ padding: '8.5px 16px' }}
      >
        {MODES.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                onModeChange(m.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              {m.emoji && <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const DiscoverFriendsShellRow = memo(DiscoverFriendsShellRowInner);
export default DiscoverFriendsShellRow;
