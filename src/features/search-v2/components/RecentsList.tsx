import { Clock } from 'lucide-react';
import type { RecentItem } from '../hooks/useRecentSearchesV2';
import { SectionHeader, ACTION } from './SectionHeader';

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
          className="w-full flex items-center gap-3 px-4 min-h-[48px] active:bg-black/[0.02] text-left"
        >
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(15,23,42,0.06)' }}
          >
            <Clock size={14} color="#64748B" strokeWidth={2} />
          </div>
          <span className="text-[14px]" style={{ color: '#0F172A' }}>{item.query}</span>
        </button>
      ))}
    </div>
  );
}
