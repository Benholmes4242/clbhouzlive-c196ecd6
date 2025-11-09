import React from 'react';
import { hapticSoft } from '@/lib/ui/haptics';
import './nearby.css';
import '@/styles/pills.css';
import '@/styles/tokens.css';

interface StatusChipsProps {
  sameHomeClub?: boolean;
  isOpenToPlay?: boolean;
  onExpand?: () => void;
}

export function StatusChips({ sameHomeClub, isOpenToPlay, onExpand }: StatusChipsProps) {
  const chips = [];
  
  if (isOpenToPlay) {
    chips.push({ label: 'Open to play', type: 'open' as const });
  }
  
  if (sameHomeClub) {
    chips.push({ label: 'Same home club', type: 'default' as const });
  }

  if (chips.length === 0) return null;

  const visibleChips = chips.slice(0, 2);
  const overflowCount = chips.length - 2;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleChips.map((chip, i) => (
        <button
          key={i}
          className={`${chip.type === 'open' ? 'pill-o2p px-3 py-[6px] text-[12px] font-semibold inline-flex items-center' : 'pill text-white/90'}`}
          onClick={() => hapticSoft()}
          aria-pressed={chip.type === 'open'}
        >
          {chip.type === 'open' && <span className="dot" />}
          <span>{chip.label}</span>
        </button>
      ))}
      
      {overflowCount > 0 && (
        <button
          className="chip chip--ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold text-white/90"
          style={{
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
          }}
          onClick={() => {
            hapticSoft();
            onExpand?.();
          }}
          aria-label={`Show ${overflowCount} more status${overflowCount > 1 ? 'es' : ''}`}
        >
          +{overflowCount}
        </button>
      )}
    </div>
  );
}
