import { useState } from 'react';
import { Trophy, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import { HandicapImprovementLeaderboard } from './HandicapImprovementLeaderboard';
import { SeasonImprovementLeaderboard } from './SeasonImprovementLeaderboard';

type HandicapMode = 'lowest' | 'improved' | 'season';

const MODES = [
  { value: 'lowest' as const, label: 'Lowest', icon: Trophy },
  { value: 'improved' as const, label: 'Most Improved', icon: TrendingDown },
  { value: 'season' as const, label: 'Season', icon: Calendar },
];

export function HandicapTab() {
  const [activeMode, setActiveMode] = useState<HandicapMode>('lowest');

  return (
    <div className="space-y-4">
      {/* Mode Selector - Pill toggle style matching other tabs */}
      <div className="px-4">
        <div className="flex p-1 bg-[#e2e8f0]/50 rounded-full border border-[#e2e8f0]">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setActiveMode(mode.value)}
                className={cn(
                  'flex-1 py-2 px-3 text-xs font-medium rounded-full transition-all flex items-center justify-center gap-1.5',
                  isActive
                    ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on mode */}
      <div>
        {activeMode === 'lowest' && <LowestHandicapLeaderboard />}
        {activeMode === 'improved' && <HandicapImprovementLeaderboard days={30} />}
        {activeMode === 'season' && <SeasonImprovementLeaderboard />}
      </div>
    </div>
  );
}