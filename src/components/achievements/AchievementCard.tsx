import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AchievementCardProps {
  name: string;
  description: string;
  category: string;
  points?: number;
  unlockedAt?: string;
  compact?: boolean;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  skill: '🎯',
  exploration: '🌍',
  social: '👥',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  name,
  description,
  category,
  points,
  unlockedAt,
  compact = false,
}) => {
  const emoji = CATEGORY_EMOJIS[category] || '🏆';

  return (
    <div className={`rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-motion-medium ease-standard hover:scale-[1.02] hover:shadow-[var(--shadow-medium)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-accent)] ${
      compact ? 'p-3' : 'p-4'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-foreground ${
                compact ? 'text-body-sm' : 'text-body-md'
              } truncate`}>
                {name}
              </h4>
              <p className={`text-muted-foreground mt-1 ${
                compact ? 'text-meta line-clamp-1' : 'text-body-sm line-clamp-2'
              }`}>
                {description}
              </p>
            </div>
            {points && points > 0 && (
              <div className="flex-shrink-0 px-2 py-1 rounded-full bg-primary/10 text-primary text-meta font-medium">
                +{points} XP
              </div>
            )}
          </div>
          {unlockedAt && (
            <p className="text-meta text-muted-foreground mt-2">
              Unlocked {formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 px-2 py-1 rounded-md bg-muted inline-block">
        <span className="text-meta font-medium text-secondary">Achievement</span>
      </div>
    </div>
  );
};
