import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Trophy, Sun, Moon, Zap, Check } from 'lucide-react';

export type SeasonType = 'preseason' | 'major' | 'summer' | 'off';
export type SeasonState = 'active' | 'upcoming' | 'locked' | 'completed';

interface Props {
  season: SeasonType;
  state: SeasonState;
  isNext?: boolean;
  onClick?: () => void;
}

const seasonConfig: Record<SeasonType, { label: string; icon: React.ElementType; color: string }> = {
  preseason: {
    label: 'Pre-Season',
    icon: Zap,
    color: '#2DD4BF' // teal-400
  },
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
  const isCompleted = state === 'completed';

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all min-w-0',
        'border text-sm font-medium',
        isActive && 'bg-white border-[#e2e8f0] shadow-sm',
        isCompleted && 'bg-white/40 border-[#e2e8f0]/40 opacity-70',
        !isActive && !isLocked && !isCompleted && 'bg-white/60 border-[#e2e8f0]/60 hover:bg-white/80',
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
            {i === 0 && config.label.includes(' ') && <br className="sm:hidden" />}
            {i === 0 && config.label.includes(' ') && <span className="hidden sm:inline"> </span>}
          </React.Fragment>
        ))}
      </span>

      {/* Checkmark for completed state */}
      {isCompleted && (
        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
      )}

      {/* Lock icon for locked state */}
      {isLocked && (
        <Lock className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
      )}

      {/* "Next" badge */}
      {isNext && !isLocked && !isCompleted && (
        <span className="text-[10px] font-semibold text-[#F59E0B] uppercase tracking-wide flex-shrink-0">
          Next
        </span>
      )}
    </button>
  );
};

export default SeasonChip;
