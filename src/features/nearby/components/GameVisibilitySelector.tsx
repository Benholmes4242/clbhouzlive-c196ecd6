import React from 'react';
import { Globe, Users, Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameVisibility } from '../types';

interface GameVisibilitySelectorProps {
  value: GameVisibility;
  onChange: (visibility: GameVisibility) => void;
  className?: string;
}

const VISIBILITY_OPTIONS: Array<{
  value: GameVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'public',
    label: 'Public (Everyone)',
    description: 'Any golfer can discover this game',
    icon: Globe
  },
  {
    value: 'friends',
    label: 'Friends Only',
    description: 'Only your followers (approved) and tagged players can see it',
    icon: Users
  },
  {
    value: 'club',
    label: 'Club Members',
    description: 'Only golfers who share your home club and tagged players can see it',
    icon: Building2
  }
];

export function GameVisibilitySelector({ value, onChange, className }: GameVisibilitySelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--hub-text-sub)' }}>
        <Info className="h-3.5 w-3.5" />
        <span>Who can see this game?</span>
      </div>
      
      <div className="space-y-2">
        {VISIBILITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-left transition-all",
                isSelected
                  ? "bg-gradient-to-br from-[#6E9277] to-[#89A78C] border-transparent"
                  : "hover:bg-[var(--hub-glass-bg-hover)]"
              )}
              style={{
                border: isSelected ? 'none' : '1px solid var(--hub-stroke-subtle)',
                background: isSelected ? undefined : 'var(--hub-glass-bg-subtle)',
              }}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: isSelected ? 'white' : 'var(--hub-text-sub)' }} />
                <div className="flex-1 min-w-0">
                  <div 
                    className="font-medium text-sm mb-0.5"
                    style={{ color: isSelected ? 'white' : 'var(--hub-text)' }}
                  >
                    {option.label}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--hub-text-sub)' }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
