import React from 'react';
import { MOMENT_BADGES } from '@/components/post/create-moment/categoryDefinitions';
import { cn } from '@/lib/utils';

interface AchievementBadgesOverlayProps {
  badgeIds?: string[] | null;
  className?: string;
}

export const AchievementBadgesOverlay: React.FC<AchievementBadgesOverlayProps> = ({ 
  badgeIds,
  className 
}) => {
  const ids = (badgeIds ?? []).slice(0, 2);
  if (!ids.length) return null;

  const badges = ids
    .map((id) => MOMENT_BADGES.find((b) => b.id === id))
    .filter(Boolean);

  if (!badges.length) return null;

  return (
    <div className={cn("absolute top-2 left-2 z-10 flex flex-col gap-1", className)}>
      {badges.map((badge) => (
        <div
          key={badge!.id}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium shadow-sm"
        >
          <span>{badge!.emoji}</span>
          <span>{badge!.label}</span>
        </div>
      ))}
    </div>
  );
};
