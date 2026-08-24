import { Clock } from 'lucide-react';
import type { RecentItem } from '../hooks/useRecentSearchesV2';
import { SectionHeader, ACTION } from './SectionHeader';
import { S } from '../lib/tokens';

interface Props {
  items: RecentItem[];
  onPick: (query: string) => void;
  onClear: () => void;
}

export function RecentsList({ items, onPick, onClear }: Props) {
  if (items.length === 0) return null;
  return (
    <div>
      <SectionHeader
        label="Recent"
        right={
          <button type="button" onClick={onClear} style={ACTION}>
            Clear
          </button>
        }
      />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.query)}
          className="w-full flex items-center gap-3 px-4 min-h-[48px] active:bg-white/[0.04] text-left"
        >
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: S.TILE }}
          >
            <Clock size={14} color={S.QUIET} strokeWidth={2} />
          </div>
          <span className="text-[14px]" style={{ color: S.INK }}>{item.query}</span>
        </button>
      ))}
    </div>
  );
}
