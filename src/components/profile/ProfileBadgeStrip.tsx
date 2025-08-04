import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface ProfileBadgeStripProps {
  coursesPlayed: number;
  totalXP: number;
  britainIrelandCompleted?: number;
  europeCompleted?: number;
  usaCompleted?: number;
  worldwideCompleted?: number;
  className?: string;
}

const ProfileBadgeStrip: React.FC<ProfileBadgeStripProps> = ({
  coursesPlayed,
  totalXP,
  britainIrelandCompleted = 0,
  europeCompleted = 0,
  usaCompleted = 0,
  worldwideCompleted = 0,
  className
}) => {
  const badges = [];

  // Trophy Level Badge - Skip rookie since it's shown in profile ring
  const getTrophyBadge = () => {
    if (coursesPlayed >= 300) return { emoji: '👑', name: 'Legend', color: 'from-purple-500 to-violet-600' };
    if (coursesPlayed >= 200) return { emoji: '🏆', name: 'Elite', color: 'from-emerald-500 to-green-600' };
    if (coursesPlayed >= 100) return { emoji: '🥇', name: 'Century', color: 'from-blue-500 to-indigo-600' };
    if (coursesPlayed >= 50) return { emoji: '🥈', name: 'Turn', color: 'from-gray-400 to-slate-500' };
    // Skip rookie badge since it's now shown as profile ring
    return null;
  };

  const trophyBadge = getTrophyBadge();
  if (trophyBadge) {
    badges.push({
      id: 'trophy',
      icon: trophyBadge.emoji,
      text: trophyBadge.name,
      color: trophyBadge.color,
      tooltip: `${trophyBadge.name} Trophy - ${coursesPlayed} courses played`
    });
  }

  // Regional Completion Badges
  if (britainIrelandCompleted >= 20) {
    badges.push({
      id: 'gb-ireland',
      icon: '🇬🇧',
      text: 'GB&I Complete',
      color: 'from-red-500 to-blue-600',
      tooltip: 'Completed Great Britain & Ireland Top 100 list'
    });
  }

  if (europeCompleted >= 100) {
    badges.push({
      id: 'europe',
      icon: '🇪🇺',
      text: 'Europe Complete',
      color: 'from-blue-500 to-yellow-500',
      tooltip: 'Completed Continental Europe Top 100 list'
    });
  }

  if (usaCompleted >= 100) {
    badges.push({
      id: 'usa',
      icon: '🇺🇸',
      text: 'USA Complete',
      color: 'from-red-500 to-blue-700',
      tooltip: 'Completed USA Top 100 list'
    });
  }

  if (worldwideCompleted >= 100) {
    badges.push({
      id: 'worldwide',
      icon: '🌍',
      text: 'World Complete',
      color: 'from-green-500 to-blue-500',
      tooltip: 'Completed Worldwide Top 100 list'
    });
  }

  // XP Milestone Badges
  if (totalXP >= 10000) {
    badges.push({
      id: 'xp-milestone',
      icon: '✨',
      text: `${Math.floor(totalXP / 1000)}k XP`,
      color: 'from-yellow-400 to-orange-500',
      tooltip: `Total Experience Points: ${totalXP.toLocaleString()}`
    });
  }

  // Show only first 4 badges to prevent overflow
  const displayBadges = badges.slice(0, 4);

  if (displayBadges.length === 0) return null;

  return (
    <Tooltip.Provider>
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {displayBadges.map((badge) => (
          <Tooltip.Root key={badge.id}>
            <Tooltip.Trigger asChild>
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-white border-0 bg-gradient-to-r cursor-help hover:scale-105 transition-transform duration-200',
                  badge.color
                )}
              >
                <span className="mr-1">{badge.icon}</span>
                {badge.text}
              </Badge>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg max-w-xs z-50"
                sideOffset={4}
              >
                {badge.tooltip}
                <Tooltip.Arrow className="fill-black/90" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
};

export default ProfileBadgeStrip;