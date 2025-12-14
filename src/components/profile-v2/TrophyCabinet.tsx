/**
 * TrophyCabinet - Horizontal scrolling achievement shelf
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from './types';
import { TrophyDetailSheet } from './TrophyDetailSheet';
import { Trophy as TrophyIcon, Star, Target, Flag, Award, Medal, Crown, Zap } from 'lucide-react';

interface TrophyCabinetProps {
  trophies: Trophy[];
  className?: string;
}

const TROPHY_ICONS: Record<string, React.ElementType> = {
  trophy: TrophyIcon,
  star: Star,
  target: Target,
  flag: Flag,
  award: Award,
  medal: Medal,
  crown: Crown,
  zap: Zap,
};

export const TrophyCabinet: React.FC<TrophyCabinetProps> = ({
  trophies,
  className,
}) => {
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);

  return (
    <>
      <section className={cn('py-6', className)}>
        <h2
          className="text-lg font-semibold mb-4 px-5"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          Trophy Cabinet
        </h2>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-5 pb-2">
            {trophies.map((trophy) => {
              const IconComponent = TROPHY_ICONS[trophy.iconKey] || TrophyIcon;
              
              return (
                <button
                  key={trophy.id}
                  onClick={() => setSelectedTrophy(trophy)}
                  className={cn(
                    'flex flex-col items-center gap-2 min-w-[72px] p-3 rounded-2xl transition-all duration-200',
                    'dgp-glass-card',
                    trophy.isUnlocked 
                      ? 'opacity-100' 
                      : 'opacity-40 grayscale'
                  )}
                  style={{
                    boxShadow: trophy.isRare && trophy.isUnlocked
                      ? '0 0 20px rgba(200, 176, 106, 0.3)'
                      : undefined,
                  }}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      trophy.isRare && trophy.isUnlocked && 'animate-pulse'
                    )}
                    style={{
                      background: trophy.isUnlocked
                        ? trophy.isRare
                          ? 'linear-gradient(135deg, var(--dgp-accent-gold), #A08B4A)'
                          : 'var(--dgp-accent-green)'
                        : 'var(--dgp-glass-surface)',
                    }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{
                        color: trophy.isUnlocked
                          ? 'var(--dgp-bg-primary)'
                          : 'var(--dgp-text-muted)',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-medium text-center leading-tight max-w-[60px]"
                    style={{ color: 'var(--dgp-text-secondary)' }}
                  >
                    {trophy.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <TrophyDetailSheet
        trophy={selectedTrophy}
        open={!!selectedTrophy}
        onOpenChange={(open) => !open && setSelectedTrophy(null)}
      />
    </>
  );
};

export default TrophyCabinet;
