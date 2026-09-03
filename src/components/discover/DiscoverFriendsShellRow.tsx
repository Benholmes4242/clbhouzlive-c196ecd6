import { memo } from 'react';
import type { LoopMode } from '@/components/loop-tab/types';
import { scrollPageToTop } from '@/lib/getScrollParent';

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
                scrollPageToTop('smooth');
              }}
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
