import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Trophy, Sun, Moon } from 'lucide-react';

export type SeasonType = 'major' | 'summer' | 'off';
export type SeasonState = 'active' | 'upcoming' | 'locked';

interface Props {
  season: SeasonType;
  state: SeasonState;
  isNext?: boolean;
  onClick?: () => void;
}

const seasonConfig: Record<SeasonType, { label: string; icon: React.ElementType; color: string }> = {
  major: { 
    label: 'Major Season', 
    icon: Trophy, 
    color: '#F59E0B' // amber-500 (warm gold)
  },
  summer: { 
    label: 'Summer Season', 
    icon: Sun, 
    color: '#FDBA74' // orange-300 (softer peach)
  },
  off: { 
    label: 'Off-Season', 
    icon: Moon, 
    color: '#94A3B8' // slate-400 (cool slate)
  },
};

export const SeasonChip: React.FC<Props> = ({ season, state, isNext, onClick }) => {
  const config = seasonConfig[season];
  const Icon = config.icon;
  const isLocked = state === 'locked';
  const isActive = state === 'active';

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all min-w-0',
        'border text-sm font-medium',
        isActive && 'bg-white border-[#e2e8f0] shadow-sm',
        !isActive && !isLocked && 'bg-white/60 border-[#e2e8f0]/60 hover:bg-white/80',
        isLocked && 'bg-[#f8fafc] border-[#e2e8f0]/40 opacity-60 cursor-not-allowed'
      )}
    >
      {/* Icon */}
      <Icon 
        className="w-4 h-4 flex-shrink-0" 
        style={{ color: isLocked ? '#94A3B8' : config.color }} 
      />
      
      {/* Label - allow wrapping on small screens */}
      <span 
        className={cn(
          'text-xs font-medium leading-tight',
          isLocked ? 'text-[#94A3B8]' : 'text-[#1e293b]'
        )}
      >
        {config.label.split(' ').map((word, i) => (
          <React.Fragment key={i}>
            {word}
            {i === 0 && <br className="sm:hidden" />}
            {i === 0 && <span className="hidden sm:inline"> </span>}
          </React.Fragment>
        ))}
      </span>

      {/* Lock icon for locked state */}
      {isLocked && (
        <Lock className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
      )}

      {/* "Next" badge */}
      {isNext && !isLocked && (
        <span className="text-[10px] font-semibold text-[#F59E0B] uppercase tracking-wide flex-shrink-0">
          Next
        </span>
      )}
    </button>
  );
};

export default SeasonChip;
