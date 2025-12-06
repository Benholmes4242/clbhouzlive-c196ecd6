import React from 'react';
import { Trophy, Target, Star, Award, Flag, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  type: 'single-hcp' | 'hole-in-one' | 'pb-round' | '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'founders';
  label: string;
  value?: string | number;
}

interface MiniAchievementStripProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

const getAchievementIcon = (type: Achievement['type']) => {
  switch (type) {
    case 'single-hcp':
      return Target;
    case 'hole-in-one':
      return Star;
    case 'pb-round':
      return Zap;
    case '20-club':
    case '50-club':
    case '100-club':
    case '200-club':
    case '300-club':
      return Trophy;
    case 'founders':
      return Award;
    default:
      return Flag;
  }
};

/**
 * MiniAchievementStrip - Horizontal swipeable achievement badges
 * Height: 48-56px
 * Badge: Rounded rectangle 60-90px wide
 * Background: rgba(255,255,255,0.06)
 * Icon left, text right
 */
const MiniAchievementStrip: React.FC<MiniAchievementStripProps> = ({
  achievements,
  onAchievementClick,
}) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-2" style={{ minWidth: 'max-content' }}>
          {achievements.map((achievement) => {
            const Icon = getAchievementIcon(achievement.type);
            
            return (
              <button
                key={achievement.id}
                type="button"
                onClick={() => onAchievementClick?.(achievement)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5',
                  'rounded-sq-sm',
                  'bg-white/[0.06] border border-white/[0.08]',
                  'transition-all duration-150',
                  'hover:bg-white/[0.10] active:scale-[0.98]',
                  'min-w-[60px] max-w-[90px]'
                )}
                style={{ height: '48px' }}
              >
                <Icon className="w-4 h-4 text-foreground/80 flex-shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">
                  {achievement.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MiniAchievementStrip;
