import { memo } from 'react';
import { Search } from 'lucide-react';

/**
 * Compact circular button that lives in the light mood-chip row (Videos + Clips)
 * to open the full-screen search overlay.
 */
export const ChipRowSearchTrigger = memo(function ChipRowSearchTrigger(
  { onOpen }: { onOpen: () => void }
) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open search"
      className="shrink-0 flex items-center justify-center active:scale-[0.97]"
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.12)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        color: '#64748B',
        flex: '0 0 auto',
      }}
    >
      <Search size={16} strokeWidth={2} aria-hidden />
    </button>
  );
});

export default ChipRowSearchTrigger;
