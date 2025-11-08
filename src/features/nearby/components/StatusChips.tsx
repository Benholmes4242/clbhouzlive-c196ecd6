import React from 'react';
import { hapticSoft } from '@/lib/ui/haptics';
import './nearby.css';

interface StatusChipsProps {
  sameHomeClub?: boolean;
  isOpenToPlay?: boolean;
  onExpand?: () => void;
}

export function StatusChips({ sameHomeClub, isOpenToPlay, onExpand }: StatusChipsProps) {
  const chips = [];
  
  if (sameHomeClub) {
    chips.push({ icon: '🏠', label: 'Same home club', tone: 'default' as const });
  }
  
  if (isOpenToPlay) {
    chips.push({ icon: '🟢', label: 'Open to play', tone: 'success' as const });
  }

  if (chips.length === 0) return null;

  const visibleChips = chips.slice(0, 2);
  const overflowCount = chips.length - 2;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleChips.map((chip, i) => (
        <button
          key={i}
          className={`chip inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold ${
            chip.tone === 'success'
              ? 'text-[#cfe8d6] shadow-[inset_0_0_0_1px_rgba(110,146,119,0.4)]'
              : 'text-white/90'
          }`}
          style={{
            background: chip.tone === 'success'
              ? 'linear-gradient(180deg, rgba(76,220,151,0.45), rgba(0,0,0,0.25))'
              : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: chip.tone === 'default' ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}
          onClick={() => hapticSoft()}
          aria-pressed={chip.tone === 'success'}
        >
          <span className="text-[14px] leading-none">{chip.icon}</span>
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
